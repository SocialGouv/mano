import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SortableJS from 'sortablejs';
import type { DocumentWithLinkedItem, DocumentOrFolderId, FolderWithLinkedItem, Folder, LinkedItemType } from '../types/document';
// import UserName from './UserName';
import { useRecoilValue } from 'recoil';
import { organisationAuthentifiedState } from '../recoil/auth';
import UserName from './UserName';
import { formatDateTimeWithNameOfDay } from '../services/date';

type Item = DocumentWithLinkedItem | FolderWithLinkedItem;

interface DocumentForTree extends DocumentWithLinkedItem {}
interface FolderForTree extends FolderWithLinkedItem {
  children: FolderChildren;
}

interface RootForTree extends Folder {
  children: FolderChildren;
}

type FolderChildren = Array<FolderForTree | DocumentForTree | RootForTree>;

interface DocumentsOrganizerProps {
  items: Item[];
  onSave: (newOrder: Item[]) => Promise<boolean>;
  onFolderClick: (folder: FolderForTree) => void;
  onDocumentClick: (document: DocumentForTree) => void;
  initialRootStructure?: LinkedItemType[];
  color: 'main' | 'blue-900';
}

const modalWidth = window.innerWidth * 0.9;
const informationsWidth = modalWidth * 0.4;
const informationsStyle = { flexBasis: informationsWidth };

export default function DocumentsOrganizer({ items, initialRootStructure, onSave, onFolderClick, onDocumentClick, color }: DocumentsOrganizerProps) {
  const [openedFolderIds, setOpenedFolderIds] = useState<DocumentOrFolderId[]>(['root']);

  const itemsRef = useRef(items);
  const documentsTree = useMemo(() => {
    if (JSON.stringify(itemsRef.current) === JSON.stringify(items)) {
      return buildFolderTree(itemsRef.current, initialRootStructure);
    }
    itemsRef.current = items;
    return buildFolderTree(items, initialRootStructure);
  }, [items, initialRootStructure]);

  useEffect(() => {
    // we want to keep alternate line colors
    let elements = document.querySelectorAll('[data-visible="true"]');
    for (let i = 0; i < elements.length; i++) {
      if (i % 2 === 0) {
        elements[i].classList.add('before:tw-bg-opacity-0');
        elements[i].classList.remove('before:tw-bg-opacity-5');
      } else {
        elements[i].classList.add('before:tw-bg-opacity-5');
        elements[i].classList.remove('before:tw-bg-opacity-0');
      }
    }
  }, [documentsTree, openedFolderIds]);

  // reloadTreeKey to prevent error `Failed to execute 'removeChild' on 'Node'` from sortablejs after updating messy tree
  const [reloadTreeKey, setReloadeTreeKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const onListChange = useCallback(
    async (save: boolean) => {
      if (!rootRef.current) return;
      setIsSaving(true);
      const elementsNewState = getElementsNewState(rootRef.current.children[0] as HTMLDivElement);
      const newOrder = elementsNewState.map((newItem) => {
        const originalItem = items.find((original) => original._id === newItem._id);
        if (!originalItem) throw new Error(`Item not found: ${newItem._id}`);
        return {
          ...originalItem,
          position: newItem.position,
          parentId: newItem.parentId,
        } as Item;
      });
      // setReloadeTreeKey((k) => k + 1);
      if (save) onSave(newOrder);
      // setReloadeTreeKey((k) => k + 1);
      setIsSaving(false);
    },
    [items, onSave]
  );

  return (
    <>
      <div className="tw-flex tw-w-full tw-border tw-border-gray-100 tw-py-1 tw-text-xs tw-text-gray-400">
        <p className="tw-m-0 tw-grow tw-pl-4">Nom</p>
        <div style={informationsStyle} className="tw-flex tw-shrink-0 tw-items-center">
          <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">Créé par</p>
          <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">Créé le</p>
          {/* <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">Type</p> */}
          {/* <p className="m-0 tw-shrink-0 tw-grow tw-basis-0 tw-overflow-hidden tw-truncate">Taille</p> */}
        </div>
      </div>
      <div id="person-documents" ref={rootRef} key={reloadTreeKey} className="tw-min-h-1/2 tw-overflow-x-hidden tw-pb-10 tw-text-gray-800">
        <Branch
          key={JSON.stringify(items)}
          parentId="root"
          position={0}
          folder={documentsTree}
          level={-1} // -1 because root is not displayed and we want all the root items to be stuck to the left
          initShowOpen
          onListChange={onListChange}
          onFolderClick={onFolderClick}
          onDocumentClick={onDocumentClick}
          openedFolderIds={openedFolderIds}
          setOpenedFolderIds={setOpenedFolderIds}
          color={color}
        />
      </div>
      {!!isSaving && (
        <div className="tw-pointer-events-none tw-absolute tw-top-0 tw-left-0 tw-h-full tw-w-full tw-bg-gray-500 tw-opacity-25">
          {/* <Loader color="#bbbbbb" size={40} /> */}
        </div>
      )}
    </>
  );
}

interface BranchProps {
  folder: FolderForTree | RootForTree;
  level: number;
  position: number;
  parentId: DocumentOrFolderId;
  initShowOpen: boolean;
  onListChange: (save: boolean) => void;
  onFolderClick: (folder: FolderForTree) => void;
  onDocumentClick: (document: DocumentForTree) => void;
  setOpenedFolderIds: (ids: DocumentOrFolderId[]) => void;
  openedFolderIds: DocumentOrFolderId[];
  color: 'main' | 'blue-900';
}

function Branch({
  folder,
  level,
  position,
  parentId,
  onListChange,
  onFolderClick,
  onDocumentClick,
  setOpenedFolderIds,
  openedFolderIds,
  initShowOpen,
  color,
}: BranchProps) {
  const open = initShowOpen || openedFolderIds.includes(folder._id);
  const parentIsOpen = openedFolderIds.includes(parentId);
  const gridRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<SortableJS>();
  useEffect(() => {
    if (!gridRef.current) return;
    sortableRef.current = SortableJS.create(gridRef.current, {
      animation: 150,
      group: 'person-documents',
      invertSwap: true,
      // swapThreshold: 0.5,
      filter: '.shared-documents', // 'shared-documents' class is not draggable
      onEnd: () => onListChange(true),
    });
  }, [onListChange]);

  const cantMove = ['Dossier Racine', 'Documents familiaux'].includes(folder.name);

  return (
    <div
      data-position={position}
      data-open={open}
      data-parentid={parentId}
      data-id={folder._id}
      data-type="folder"
      className="tw-relative tw-flex tw-flex-col">
      {folder.name !== 'Dossier Racine' && (
        <span
          data-visible={parentIsOpen ? 'true' : 'false'}
          className={[
            'tw-relative tw-inline-flex tw-max-w-full tw-justify-between tw-text-ellipsis tw-whitespace-nowrap tw-py-2 tw-pl-4',
            `before:tw-bg-${color} before:tw-pointer-events-none before:tw-absolute before:tw-right-0 before:tw-top-0 before:tw-h-full before:tw-bg-main`,
            `before:-tw-left-${level * 10}`,
            cantMove ? 'shared-documents' : '',
          ].join(' ')}>
          <div className="tw-flex tw-w-full tw-justify-between tw-overflow-hidden">
            <div className="tw-flex tw-flex-1 tw-items-center tw-overflow-hidden tw-pr-5">
              <small
                className={`tw-mr-1 tw-inline-block tw-w-3 tw-cursor-pointer tw-text-${color}`}
                onClick={() => {
                  if (open) {
                    setOpenedFolderIds(openedFolderIds.filter((id) => id !== folder._id));
                  } else {
                    setOpenedFolderIds([...openedFolderIds, folder._id]);
                  }
                }}>
                {open ? '\u25BC' : '\u25B6'}
              </small>
              <button
                type="button"
                onClick={() => {
                  if (folder._id === 'root') return;
                  const notRootFolder = folder as FolderForTree;
                  onFolderClick(notRootFolder);
                }}
                className="tw-inline-flex tw-flex-1 tw-gap-x-2 tw-overflow-hidden">
                <span>{open ? '📂' : '📁'}</span>
                <span className="tw-truncate">{folder.name}</span>
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
        id={`child-container-${folder._id || 'root'}`}
        className={[
          'tw-flex tw-flex-col',
          level >= 0 ? 'tw-pl-10' : '',
          !open ? 'tw-hidden' : '',
          //  lol
        ].join(' ')}>
        {!folder.children?.length && !!open && (
          <p
            data-id="empty-folder"
            className={[
              'tw-mb-1 tw-block tw-cursor-pointer tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-py-px tw-text-left tw-text-xs tw-text-gray-400',
            ].join(' ')}>
            <span>Dossier vide</span>
          </p>
        )}
        {folder.children?.map((child, index) => {
          if (child.type === 'folder') {
            child = child as FolderForTree;
            return (
              <Branch
                key={child._id}
                folder={child}
                parentId={child.parentId || folder._id}
                position={child.position || index}
                level={level + 1}
                initShowOpen={false}
                onListChange={onListChange}
                onDocumentClick={onDocumentClick}
                onFolderClick={onFolderClick}
                openedFolderIds={openedFolderIds}
                setOpenedFolderIds={setOpenedFolderIds}
                color={color}
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
  color: 'main' | 'blue-900';
}

function DocumentRow({ document, level, parentIsOpen, position, parentId, color, onDocumentClick }: DocumentRowProps) {
  const organisation = useRecoilValue(organisationAuthentifiedState);

  return (
    <div
      data-visible={parentIsOpen ? 'true' : 'false'}
      key={document._id}
      data-position={position}
      data-parentid={parentId}
      data-id={document._id}
      className={[
        'tw-relative tw-flex tw-justify-between tw-text-ellipsis tw-whitespace-nowrap tw-pl-4 tw-text-gray-800',
        `before:tw-bg-${color}  before:tw-pointer-events-none before:tw-absolute before:tw-right-0 before:tw-top-0 before:tw-h-full before:tw-bg-main`,
        `before:-tw-left-${level * 10}`,
        !!document.group ? 'shared-documents' : '',
      ].join(' ')}>
      <div className="tw-flex tw-w-full tw-justify-between tw-overflow-hidden">
        <button
          type="button"
          onClick={() => onDocumentClick(document)}
          className="tw-inline-flex tw-flex-1 tw-overflow-hidden tw-py-2 tw-pr-5 tw-text-left">
          {!!organisation.groupsEnabled && !!document.group && (
            <span className="tw-mr-2 tw-text-xl" aria-label="Document familial" title="Document familial">
              👪
            </span>
          )}
          <span>📃</span>
          <span className="tw-ml-2 tw-truncate">{document.name}</span>
        </button>
        <Informations item={document} />
      </div>
      {/* <p className={`tw-m-0 tw-border-l tw-py-2 tw-text-xs tw-opacity-60 tw-border-${color} tw-flex-shrink-0 tw-flex-grow-0 tw-basis-10 tw-px-2`}>
        Créé par <UserName id={document.createdBy} />
      </p> */}
    </div>
  );
}

function Informations({ item }: { item: Item | FolderForTree | RootForTree }) {
  const modalWidth = useRef(window.innerWidth * 0.9);
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

const buildFolderTree = (items: Item[], initialRootStructure?: LinkedItemType[]) => {
  const rootFolderItem = {
    _id: 'root',
    name: 'Dossier Racine',
    position: 0,
    createdAt: new Date(),
    createdBy: 'we do not care',
    parentId: 'NA', // for type safety easiness purpose
    type: 'folder',
    // children: [],
  };

  const groupedDocuments = items
    .filter((item) => {
      if (item.type !== 'document') return false;
      const document = item as DocumentWithLinkedItem;
      return !!document.group;
    })
    .map((item) => {
      return {
        ...item,
        parentId: item.parentId || 'grouped-documents',
      } as DocumentForTree;
    });

  const ungroupedDocuments = items.filter((item) => {
    if (item.type !== 'document') return true;
    const document = item as DocumentWithLinkedItem;
    return !document.group;
  });

  const findChildren = (folder: Item, isRoot: boolean): FolderChildren => {
    const children = ungroupedDocuments
      .filter((item: Item) => item.parentId === folder._id)
      .sort((a, b) => {
        if (!a.position) return 1;
        if (!b.position) return -1;
        return a.position - b.position;
      })
      .map((item) => {
        if (item.type === 'folder') {
          return {
            ...item,
            parentId: item.parentId || 'root',
            children: findChildren(item, false),
          } as FolderForTree;
        }
        return {
          ...item,
          parentId: item.parentId || 'root',
        } as DocumentForTree;
      });
    if (!isRoot) return children;
    if (!groupedDocuments.length) return children;
    return [
      ...children,
      {
        _id: 'grouped-documents',
        name: '👪 Documents familiaux',
        position: children.length, // always at the end
        createdAt: new Date(),
        children: groupedDocuments,
        createdBy: 'we do not care',
        parentId: 'root',
        type: 'folder',
      },
    ];
  };
  const rootChildren = findChildren(rootFolderItem as Item, true);
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

const findChildrenRecursive = async (folder: HTMLDivElement, allItems: ItemState[]) => {
  const childrenContainer = folder.querySelector(`#child-container-${folder.dataset.id}`);
  if (childrenContainer === null) return;
  for (const [index, child] of Object.entries(Array.from(childrenContainer.children))) {
    const childElement = child as HTMLDivElement;
    if (childElement.dataset.id === 'empty-folder') continue;
    if (childElement.dataset.id === 'grouped-documents') continue;
    const updatedChild = {
      position: Number(index) + 1,
      parentId: folder.dataset.id,
      _id: childElement.dataset.id,
    };
    allItems.push(updatedChild);
    if (childElement.dataset.type === 'folder') findChildrenRecursive(childElement, allItems);
  }
};

const getElementsNewState = (root: HTMLDivElement) => {
  const allItems: ItemState[] = [];
  findChildrenRecursive(root, allItems);
  return allItems;
};
