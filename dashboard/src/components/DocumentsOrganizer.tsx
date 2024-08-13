import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SortableJS from "sortablejs";
import type { DocumentWithLinkedItem, DocumentOrFolderId, FolderWithLinkedItem, Folder } from "../types/document";
// import UserName from './UserName';
import { useRecoilValue } from "recoil";
import { organisationAuthentifiedState } from "../recoil/auth";
import UserName from "./UserName";
import { formatDateTimeWithNameOfDay } from "../services/date";

type Item = DocumentWithLinkedItem | FolderWithLinkedItem | Folder;

interface DocumentForTree extends DocumentWithLinkedItem {}
interface FolderForTree extends FolderWithLinkedItem {
  children: FolderChildren;
}

interface RootForTree extends Folder {
  children: FolderChildren;
}

type FolderChildren = Array<FolderForTree | DocumentForTree | RootForTree>;

interface DocumentsOrganizerProps<T extends Item> {
  items: T[];
  onSave: (newOrder: T[]) => Promise<boolean>;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onFolderClick: (folder: FolderForTree) => void;
  onDocumentClick?: (document: DocumentForTree) => void;
  color: "main" | "blue-900";
  htmlId: "social" | "family" | "medical";
  rootFolderName?: "Dossier Racine" | "👪 Documents familiaux";
  debug?: boolean;
}

const modalWidth = window.innerWidth * 0.9;
const informationsWidth = modalWidth * 0.4;
const informationsStyle = { flexBasis: informationsWidth };
const emptyFunction = () => {};

export default function DocumentsOrganizer<T extends Item>({
  items,
  htmlId,
  rootFolderName = "Dossier Racine",
  onSave,
  onDragStart = emptyFunction,
  onDragEnd = emptyFunction,
  onFolderClick,
  onDocumentClick,
  color,
  debug = false,
}: DocumentsOrganizerProps<T>) {
  const [openedFolderIds, setOpenedFolderIds] = useState<DocumentOrFolderId[]>(["root"]);

  const itemsRef = useRef<T[]>(items);
  const documentsTree = useMemo(() => {
    if (JSON.stringify(itemsRef.current) === JSON.stringify(items)) {
      return buildFolderTree(itemsRef.current, rootFolderName);
    }
    itemsRef.current = items;
    return buildFolderTree(items, rootFolderName);
  }, [items, rootFolderName]);

  useEffect(() => {
    // we want to keep alternate line colors
    const elements = document.getElementById(`${htmlId}-documents`)?.querySelectorAll('[data-visible="true"]') || [];
    for (let i = 0; i < elements.length; i++) {
      if (i % 2 === 0) {
        elements[i].classList.add("before:tw-bg-opacity-0");
        elements[i].classList.remove("before:tw-bg-opacity-5");
      } else {
        elements[i].classList.add("before:tw-bg-opacity-5");
        elements[i].classList.remove("before:tw-bg-opacity-0");
      }
    }
  }, [documentsTree, htmlId, openedFolderIds]);

  // reloadTreeKey to prevent error `Failed to execute 'removeChild' on 'Node'` from sortablejs after updating messy tree
  // const [reloadTreeKey, setReloadeTreeKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const onListChange = useCallback(
    async (save: boolean) => {
      onDragEnd();
      if (!rootRef.current) return;
      if (htmlId === "family") return;
      setIsSaving(true);
      const elementsNewState = getElementsNewState(rootRef.current.children[0] as HTMLDivElement);
      const newOrder = elementsNewState.map((newItem) => {
        const originalItem = items.find((original) => original._id === newItem._id);
        if (!originalItem) throw new Error(`Item not found: ${newItem._id}`);
        return {
          ...originalItem,
          position: newItem.position,
          parentId: newItem.parentId,
        };
      });
      // setReloadeTreeKey((k) => k + 1);
      if (save) onSave(newOrder);
      // setReloadeTreeKey((k) => k + 1);
      setIsSaving(false);
    },
    [items, htmlId, onSave, onDragEnd]
  );

  if (!items.length) return null;

  return (
    <div id={`${htmlId}-documents`}>
      <div className="tw-flex tw-w-full tw-border tw-border-gray-100 tw-py-1 tw-text-xs tw-text-gray-400">
        <p className="tw-m-0 tw-grow tw-pl-4">Nom</p>
        <div style={informationsStyle} className="tw-flex tw-shrink-0 tw-items-center">
          <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">Créé par</p>
          <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">Créé le</p>
          {/* <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">Type</p> */}
          {/* <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">Taille</p> */}
        </div>
      </div>
      <div
        // key={reloadTreeKey}

        ref={rootRef}
        className="tw-overflow-x-hidden tw-pb-10 tw-text-gray-800"
      >
        <Branch
          key={JSON.stringify(items)}
          parentId="root"
          movable={false}
          position={0}
          folder={documentsTree}
          level={rootFolderName === "Dossier Racine" ? -1 : 0} // -1 because root is not displayed and we want all the root items to be stuck to the left
          htmlId={htmlId}
          initShowOpen
          onListChange={onListChange}
          onDragStart={onDragStart}
          onFolderClick={onFolderClick}
          onDocumentClick={onDocumentClick}
          openedFolderIds={openedFolderIds}
          setOpenedFolderIds={setOpenedFolderIds}
          color={color}
          debug={debug}
        />
      </div>
      {!!isSaving && (
        <div className="tw-pointer-events-none tw-absolute tw-left-0 tw-top-0 tw-h-full tw-w-full tw-bg-gray-500 tw-opacity-25">
          {/* <Loader color="#bbbbbb" size={40} /> */}
        </div>
      )}
    </div>
  );
}

interface BranchProps {
  folder: FolderForTree | RootForTree;
  level: number;
  position: number;
  movable?: boolean;
  htmlId: "social" | "family" | "medical";
  parentId: DocumentOrFolderId;
  initShowOpen: boolean;
  onListChange: (save: boolean) => void;
  onDragStart: () => void;
  onFolderClick: (folder: FolderForTree) => void;
  onDocumentClick?: (document: DocumentForTree) => void;
  setOpenedFolderIds: (ids: DocumentOrFolderId[]) => void;
  openedFolderIds: DocumentOrFolderId[];
  color: "main" | "blue-900";
  debug?: boolean;
}

function Branch({
  folder,
  level,
  position,
  movable = true,
  parentId,
  htmlId,
  onListChange,
  onDragStart,
  onFolderClick,
  onDocumentClick,
  setOpenedFolderIds,
  openedFolderIds,
  initShowOpen,
  color,
  debug = false,
}: BranchProps) {
  const open = initShowOpen || openedFolderIds.includes(folder._id);
  if (!folder.children.length && !openedFolderIds.includes(folder._id)) {
    // On doit décaler setOpenedFolderIds pour éviter le bug React qui embête le monde entier sauf Dan Abramov:
    // "Cannot update a component from inside the function body of a different component".
    // https://github.com/facebook/react/issues/18178#issuecomment-59584631
    // Si on veut ne pas passer par le setTimeout, il faut passer par un useEffect, en tout cas le set ne peut
    // pas être directement dans le corps de la fonction.
    setTimeout(() => {
      setOpenedFolderIds([...openedFolderIds, folder._id]);
    }, 0);
  }
  const parentIsOpen = openedFolderIds.includes(parentId);
  const gridRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<SortableJS>();
  useEffect(() => {
    if (!gridRef.current) return;
    if (htmlId === "family") return;
    sortableRef.current = SortableJS.create(gridRef.current, {
      animation: 150,
      group: `${htmlId}-documents`,
      invertSwap: true,
      // swapThreshold: 0.5,
      filter: ".unmovable", // 'unmovable' class is not draggable
      onEnd: () => onListChange(true),
      onStart: onDragStart,
    });
  }, [onListChange, onDragStart, htmlId]);

  return (
    <div
      data-position={position}
      data-open={open}
      data-parentid={parentId}
      data-id={folder._id}
      data-type="folder"
      className="tw-relative tw-flex tw-flex-col"
    >
      {folder.name !== "Dossier Racine" && (
        <span
          data-visible={parentIsOpen ? "true" : "false"}
          className={[
            "tw-relative tw-inline-flex tw-max-w-full tw-justify-between tw-text-ellipsis tw-whitespace-nowrap tw-py-2 tw-pl-4",
            `before:tw-pointer-events-none before:tw-absolute before:tw-right-0 before:tw-top-0 before:tw-h-full before:tw-bg-${color}`,
            `before:-tw-left-${level * 10}`,
            movable ? "" : "unmovable",
          ].join(" ")}
        >
          <div className="tw-flex tw-w-full tw-justify-between tw-overflow-hidden">
            <div className="tw-flex tw-flex-1 tw-items-center tw-overflow-hidden tw-pr-5">
              <small
                className={`hover:tw-scale-110 tw-transition tw-mr-1 tw-inline-block tw-w-3 tw-cursor-pointer tw-text-${color}`}
                onClick={() => {
                  if (open) {
                    setOpenedFolderIds(openedFolderIds.filter((id) => id !== folder._id));
                  } else {
                    setOpenedFolderIds([...openedFolderIds, folder._id]);
                  }
                }}
              >
                {/* open ? arrow down : arrow right */}
                {open ? "\u25BC" : "\u25B6"}
              </small>
              <button
                type="button"
                onClick={() => {
                  if (folder.movable === false) return;
                  const notRootFolder = folder as FolderForTree;
                  onFolderClick(notRootFolder);
                }}
                className={["tw-inline-flex tw-flex-1 tw-gap-x-2 tw-overflow-hidden", movable ? "!tw-cursor-pointer" : "!tw-cursor-default"].join(
                  " "
                )}
              >
                <span>{open ? "📂" : "📁"}</span>
                <span className="tw-truncate">{folder.name}</span>
                {!movable ? (
                  <span className="tw-opacity-50" title="Ce dossier est configuré par défaut. Il ne peut pas être déplacé ou renommé.">
                    🔒
                  </span>
                ) : null}
                <span>({folder.children?.length || 0})</span>
              </button>
            </div>
            <Informations item={folder} />
          </div>
        </span>
      )}
      {/* Folder's children */}
      <div
        ref={gridRef}
        id={`child-container-${folder._id || "root"}`}
        className={["tw-flex tw-flex-col", level >= 0 ? "tw-pl-10" : "", !open ? "tw-hidden" : ""].join(" ")}
      >
        {!folder.children?.length && !!open && (
          <p
            data-id="empty-folder"
            className={[
              "unmovable tw-mb-1 tw-block tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-py-px tw-text-left tw-text-xs tw-text-gray-400",
            ].join(" ")}
          >
            <span>Dossier vide</span>
          </p>
        )}
        {folder.children?.map((child, index) => {
          if (child.type === "folder") {
            child = child as FolderForTree;
            return (
              <Branch
                key={child._id}
                folder={child}
                htmlId={htmlId}
                parentId={child.parentId || folder._id}
                position={child.position || index}
                movable={child.movable}
                level={level + 1}
                initShowOpen={false}
                onListChange={onListChange}
                onDragStart={onDragStart}
                onDocumentClick={onDocumentClick}
                onFolderClick={onFolderClick}
                openedFolderIds={openedFolderIds}
                setOpenedFolderIds={setOpenedFolderIds}
                color={color}
                debug={debug}
              />
            );
          }
          child = child as DocumentForTree;
          return (
            <DocumentRow
              key={child._id}
              document={child}
              parentId={child.parentId || folder._id}
              position={child.position || index}
              level={level + 1}
              onDocumentClick={onDocumentClick}
              parentIsOpen={open}
              color={color}
              debug={debug}
            />
          );
        })}
      </div>
    </div>
  );
}

interface DocumentRowProps {
  document: DocumentForTree;
  level: number;
  position: number;
  parentIsOpen: boolean;
  parentId: DocumentOrFolderId;
  onDocumentClick: (document: DocumentForTree) => void;
  color: "main" | "blue-900";
  debug: boolean;
}

function DocumentRow({ document, level, parentIsOpen, position, parentId, color, onDocumentClick, debug }: DocumentRowProps) {
  const organisation = useRecoilValue(organisationAuthentifiedState);

  return (
    <div
      data-visible={parentIsOpen ? "true" : "false"}
      key={document._id}
      data-position={position}
      data-parentid={parentId}
      data-id={document._id}
      className={[
        "tw-relative tw-flex tw-justify-between tw-text-ellipsis tw-whitespace-nowrap tw-pl-4 tw-text-gray-800",
        `before:tw-pointer-events-none before:tw-absolute before:tw-right-0 before:tw-top-0 before:tw-h-full before:tw-bg-${color}`,
        `before:-tw-left-${level * 10}`,
        document.group ? "unmovable" : "",
      ].join(" ")}
    >
      <div className="tw-flex tw-w-full tw-justify-between tw-overflow-hidden">
        <button
          type="button"
          onClick={() => onDocumentClick?.(document)}
          className="tw-inline-flex tw-flex-1 tw-flex-col tw-py-2 tw-pr-5 tw-text-left"
        >
          <div className="tw-inline-flex tw-flex-1 tw-overflow-hidden tw-text-left tw-max-w-full">
            {!!organisation.groupsEnabled && !!document.group && (
              <span className="tw-mr-2 tw-text-xl" aria-label="Document familial" title="Document familial">
                👪
              </span>
            )}
            <span>📃</span>
            <span className="tw-ml-2 tw-truncate">{document.name}</span>
          </div>
          {document.type === "document" && debug && (
            <div className="tw-inline-flex tw-flex-1 tw-flex-col tw-text-left tw-max-w-full tw-pl-10">
              <>
                <p className="tw-block m-0 tw-shrink-0 tw-grow tw-basis-0 tw-text-wrap tw-text-xs tw-text-gray-400">
                  {JSON.stringify(document, null, 2)}
                </p>
              </>
            </div>
          )}
        </button>
        <Informations item={document} />
      </div>
      {/* <p className={`tw-m-0 tw-border-l tw-py-2 tw-text-xs tw-opacity-60 tw-border-${color} tw-flex-shrink-0 tw-flex-grow-0 tw-basis-10 tw-px-2`}>
        Créé par <UserName id={document.createdBy} />
      </p> */}
    </div>
  );
}

function Informations({ item }: { item: Item | FolderForTree | RootForTree; debug?: boolean }) {
  if (item.type === "folder") {
    if (["root", "treatment", "consultation"].includes(item._id)) return null;
  }
  return (
    <div style={informationsStyle} className="tw-flex tw-shrink-0 tw-items-center tw-text-xs tw-text-gray-600">
      <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">
        <UserName id={item.createdBy} />
      </p>
      <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">{formatDateTimeWithNameOfDay(item.createdAt)}</p>
      {/* <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">Info 3</p> */}
      {/* <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">Info 4</p> */}
    </div>
  );
}

const buildFolderTree = (items: Item[] | Folder[], rootFolderName: "Dossier Racine" | "👪 Documents familiaux") => {
  const rootFolderItem: Folder = {
    _id: "root",
    name: rootFolderName,
    position: 0,
    parentId: "NA", // for type safety easiness purpose
    type: "folder",
    createdAt: new Date(),
    createdBy: "we do not care",
    movable: false,
  };

  const findChildren = (folder: Item | Folder): FolderChildren => {
    const children = items
      .filter((item: Item) => item.parentId === folder._id)
      .sort((a, b) => {
        /*
        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description
        compareFn(a, b) return value	sort order
        > 0	sort a after b, e.g. [b, a]
        < 0	sort a before b, e.g. [a, b]
        === 0	keep original order of a and b
        */
        if (!a.position && a.position !== 0) return 1;
        if (!b.position && b.position !== 0) return -1;
        // all the non movable should be first
        if (!!a.movable && b.movable === false) return 1;
        if (a.movable === false && !!b.movable) return -1;

        return a.position - b.position;
      })
      .map((item) => {
        if (item.type === "folder") {
          return {
            ...item,
            parentId: item.parentId || "root",
            children: findChildren(item),
          } as FolderForTree;
        }
        return {
          ...item,
          parentId: item.parentId || "root",
        } as DocumentForTree;
      });
    return children;
  };
  const rootChildren = findChildren(rootFolderItem);
  const rootForTree: RootForTree = {
    ...rootFolderItem,
    children: rootChildren,
  };
  return rootForTree;
};

type ItemState = {
  _id?: DocumentOrFolderId;
  position?: number;
  parentId?: DocumentOrFolderId;
};

const findChildrenRecursive = async (folder: HTMLDivElement, allItems: ItemState[], uniqueIds: Record<DocumentOrFolderId, boolean>) => {
  const childrenContainer = folder.querySelector(`#child-container-${folder.dataset.id}`);
  if (childrenContainer === null) return;
  for (const [index, child] of Object.entries(Array.from(childrenContainer.children))) {
    const childElement = child as HTMLDivElement;
    if (childElement.dataset.id === "empty-folder") continue;
    if (childElement.dataset.id === "family-documents") continue;
    if (uniqueIds[childElement.dataset.id]) continue;
    uniqueIds[childElement.dataset.id] = true;
    const updatedChild = {
      position: Number(index) + 1,
      parentId: folder.dataset.id,
      _id: childElement.dataset.id,
    };
    allItems.push(updatedChild);
    if (childElement.dataset.type === "folder") findChildrenRecursive(childElement, allItems, uniqueIds);
  }
};

const getElementsNewState = (root: HTMLDivElement) => {
  const allItems: ItemState[] = [];
  const uniqueIds: Record<DocumentOrFolderId, boolean> = {}; // to make sure we don't save duplicates
  findChildrenRecursive(root, allItems, uniqueIds);
  return allItems;
};
