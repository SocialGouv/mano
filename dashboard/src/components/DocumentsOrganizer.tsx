import { useCallback, useEffect, useRef, useState } from 'react';
import SortableJS from 'sortablejs';
import type { DocumentWithLinkedItem, DocumentOrFolderId, FolderWithLinkedItem, Folder, LinkedItemType } from '../types/document';
// import UserName from './UserName';
import { useRecoilValue } from 'recoil';
import { organisationAuthentifiedState } from '../recoil/auth';

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

export default function DocumentsOrganizer({ items, initialRootStructure, onSave, onFolderClick, onDocumentClick, color }: DocumentsOrganizerProps) {
  const [openedFolderIds, setOpenedFolderIds] = useState<DocumentOrFolderId[]>([]);
  const [lastUpdatedItems, setLastUpdatedItems] = useState(items);
  const documentsTree = buildFolderTree(lastUpdatedItems, initialRootStructure);
  const itemsRef = useRef(items);
  useEffect(() => {
    if (JSON.stringify(itemsRef.current) === JSON.stringify(items)) return;
    itemsRef.current = items;
    setLastUpdatedItems(items);
  }, [items]);

  useEffect(() => {
    let elements = document.querySelectorAll('[data-visible="true"]');
    for (let i = 0; i < elements.length; i++) {
      if (i % 2 === 0) {
        elements[i].classList.add('tw-bg-opacity-0');
        elements[i].classList.remove('tw-bg-opacity-5');
      } else {
        elements[i].classList.add('tw-bg-opacity-5');
        elements[i].classList.remove('tw-bg-opacity-0');
      }
    }
  }, [documentsTree]);

  // reloadTreeKey to prevent error `Failed to execute 'removeChild' on 'Node'` from sortablejs after updating messy tree
  const [reloadTreeKey, setReloadeTreeKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const onListChange = useCallback(async () => {
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
    setReloadeTreeKey((k) => k + 1);
    onSave(newOrder);
    itemsRef.current = newOrder;
    setLastUpdatedItems(newOrder);
    setReloadeTreeKey((k) => k + 1);
    setIsSaving(false);
  }, [items, onSave]);

  return (
    <>
      {/* TODO find a way for tailwind to not filter margins from compiling,
       because things like `ml-${level}` are not compiled */}
      <div dir="ltr" className="tw-hidden"></div>
      <div ref={rootRef} key={reloadTreeKey} dir="rtl" className="tw-min-h-1/2 tw-overflow-auto tw-pb-10">
        <Branch
          parentId="root"
          position={0}
          folder={documentsTree}
          level={-1}
          key={JSON.stringify(items)}
          onListChange={onListChange}
          initShowOpen
          onFolderClick={onFolderClick}
          onDocumentClick={onDocumentClick}
          openedFolderIds={openedFolderIds}
          setOpenedFolderIds={setOpenedFolderIds}
          dir="ltr"
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

const horizontalSpacing = 10;

interface BranchProps {
  folder: FolderForTree | RootForTree;
  level: number;
  position?: number;
  parentId: DocumentOrFolderId;
  initShowOpen: boolean;
  onListChange: () => void;
  onFolderClick: (folder: FolderForTree) => void;
  onDocumentClick: (document: DocumentForTree) => void;
  setOpenedFolderIds: (ids: DocumentOrFolderId[]) => void;
  openedFolderIds: DocumentOrFolderId[];
  dir?: 'ltr' | 'rtl';
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
  dir = 'ltr',
}: BranchProps) {
  const open = initShowOpen || openedFolderIds.includes(folder._id);

  const gridRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<SortableJS>();
  useEffect(() => {
    if (!gridRef.current) return;
    sortableRef.current = SortableJS.create(gridRef.current, {
      animation: 150,
      group: 'shared',
      filter: '.shared-data', // 'shared-data' class is not draggable
      onEnd: onListChange,
    });
  }, [onListChange]);

  return (
    <div
      data-position={position}
      data-open={open}
      data-parentid={parentId}
      data-id={folder._id}
      data-type="folder"
      dir={dir}
      className="tw-flex tw-flex-col">
      {folder.name !== 'Dossier Racine' && (
        <span
          data-visible="true"
          className={[
            'tw-inline-block tw-max-w-full tw-flex-col tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-py-2',
            `tw-bg-${color} tw-pl-${level * horizontalSpacing + 4}`,
            folder.name.includes('Documents familiaux') ? 'shared-data' : '',
          ].join(' ')}>
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
          <div
            // type="button"
            onClick={() => {
              if (folder._id === 'root') return;
              const notRootFolder = folder as FolderForTree;
              onFolderClick(notRootFolder);
            }}
            className="tw-inline tw-cursor-pointer tw-text-gray-800">
            {folder.name ? (
              `${open ? '📂' : '📁'} ${folder.name} (${folder.children?.length || 0})`
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="-tw-mt-2 tw-inline tw-h-6 tw-w-6 tw-cursor-pointer"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            )}
          </div>
        </span>
      )}
      <div ref={gridRef} id={`child-container-${folder._id || 'root'}`} className={`tw-flex tw-flex-col ${!open ? 'tw-hidden' : ''}`}>
        {!folder.children?.length && !!open && (
          <p
            data-id="empty-folder"
            className={[
              'tw-mb-1 tw-block tw-cursor-pointer tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-py-px tw-text-left tw-text-xs tw-text-gray-400',
              `tw-pl-${(level + 1) * horizontalSpacing + 4}`,
            ].join(' ')}>
            <span>Dossier vide</span>
          </p>
        )}
        {folder.children?.map((child, index) => {
          if (child.type === 'folder') {
            child = child as FolderForTree;
            return (
              <Branch
                parentId={child.parentId || folder._id}
                position={child.position || index}
                key={child._id}
                folder={child}
                level={level + 1}
                initShowOpen={false}
                onListChange={onListChange}
                onFolderClick={onFolderClick}
                setOpenedFolderIds={setOpenedFolderIds}
                openedFolderIds={openedFolderIds}
                onDocumentClick={onDocumentClick}
                color={color}
              />
            );
          }
          child = child as DocumentForTree;
          return (
            <DocumentRow
              parentIsOpen={open}
              parentId={child.parentId || folder._id}
              position={child.position || index}
              key={child._id}
              document={child}
              level={level + 1}
              onDocumentClick={onDocumentClick}
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
        'tw-flex tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-text-gray-800',
        `tw-bg-${color} tw-pl-${level * horizontalSpacing + 4}`,
        !!document.group ? 'shared-data' : '',
      ].join(' ')}>
      <button type="button" onClick={() => onDocumentClick(document)} className="tw-inline-block tw-grow tw-py-2 tw-text-left">
        {!!organisation.groupsEnabled && !!document.group && (
          <span className="tw-mr-2 tw-text-xl" aria-label="Document familial" title="Document familial">
            👪
          </span>
        )}
        {'📃 '} <span>{document.name}</span>
      </button>
      {/* <p className={`tw-m-0 tw-border-l tw-py-2 tw-text-xs tw-opacity-60 tw-border-${color} tw-flex-shrink-0 tw-flex-grow-0 tw-basis-10 tw-px-2`}>
        Créé par <UserName id={document.createdBy} />
      </p> */}
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
  const groupedDocuments = items.filter((item) => {
    if (item.type !== 'document') return false;
    const document = item as DocumentWithLinkedItem;
    return !!document.group;
  });
  const ungroupedDocuments = items.filter((item) => {
    if (item.type !== 'document') return true;
    const document = item as DocumentWithLinkedItem;
    return !document.group;
  });
  if (groupedDocuments.length) {
  }
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
        position: children.length,
        createdAt: new Date(),
        children: groupedDocuments.map((item) => {
          return {
            ...item,
            parentId: item.parentId || 'grouped-documents',
          } as DocumentForTree;
        }),
        createdBy: 'we do not care',
        parentId: 'NA', // for type safety easiness purpose
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
