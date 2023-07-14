import { useCallback, useEffect, useRef, useState } from 'react';
import SortableJS from 'sortablejs';
import type { DocumentWithLinkedItem, DocumentOrFolderId, FolderWithLinkedItem, Folder, LinkedItemType } from '../types/document';

type Item = DocumentWithLinkedItem | FolderWithLinkedItem;
type FolderChildren = Array<FolderForTree | DocumentForTree>;

interface DocumentForTree extends DocumentWithLinkedItem {
  lineIndex: number;
}
interface FolderForTree extends FolderWithLinkedItem {
  children: FolderChildren;
  lineIndex: number;
}

interface RootForTree extends Folder {
  children: FolderChildren;
  lineIndex: number;
}

interface DocumentsOrganizerProps {
  items: Item[];
  onSave: (newOrder: Item[]) => Promise<boolean>;
  onFolderClick: (folder: FolderForTree) => void;
  onDocumentClick: (document: DocumentForTree) => void;
  initialRootStructure?: LinkedItemType[];
}

export default function DocumentsOrganizer({ items, initialRootStructure, onSave, onFolderClick, onDocumentClick }: DocumentsOrganizerProps) {
  const [lastUpdatedItems, setLastUpdatedItems] = useState(items);
  const documentsTree = buildFolderTree(lastUpdatedItems, initialRootStructure);
  const itemsRef = useRef(items);
  useEffect(() => {
    if (JSON.stringify(itemsRef.current) === JSON.stringify(items)) return;
    itemsRef.current = items;
    setLastUpdatedItems(items);
  }, [items]);

  // reloadTreeKey to prevent error `Failed to execute 'removeChild' on 'Node'` from sortablejs after updating messy tree
  const [reloadTreeKey, setReloadeTreeKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const onListChange = useCallback(async () => {
    console.log('onListChange');
    if (!rootRef.current) return;
    setIsSaving(true);
    const elementsNewState = getElementsNewState(rootRef.current.children[0] as HTMLDivElement);
    const newOrder = elementsNewState.map((newItem) => {
      const originalItem = items.find((original) => original._id === newItem._id);
      if (!originalItem) throw new Error('Item not found');
      return {
        ...originalItem,
        position: newItem.position,
        parentId: newItem.parentId,
      } as Item;
    });
    console.log('newOrder', newOrder);
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
          level={0}
          lineIndex={0}
          key={JSON.stringify(items)}
          onListChange={onListChange}
          initShowOpen
          onFolderClick={onFolderClick}
          onDocumentClick={onDocumentClick}
          dir="ltr"
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
  lineIndex: number;
  position?: number;
  parentId: DocumentOrFolderId;
  initShowOpen: boolean;
  onListChange: () => void;
  onFolderClick: (folder: FolderForTree) => void;
  onDocumentClick: (document: DocumentForTree) => void;
  dir?: 'ltr' | 'rtl';
}

function Branch({
  folder,
  level,
  lineIndex,
  position,
  parentId,
  onListChange,
  onFolderClick,
  onDocumentClick,
  initShowOpen = false,
  dir = 'ltr',
}: BranchProps) {
  const [open, setIsOpen] = useState(initShowOpen);

  const gridRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<SortableJS>();
  useEffect(() => {
    if (!gridRef.current) return;
    sortableRef.current = SortableJS.create(gridRef.current, { animation: 150, group: 'shared', onEnd: onListChange });
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
          className={[
            'tw-inline-block tw-max-w-full tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-py-2',
            `tw-pl-${level * horizontalSpacing + 4}`,
            Boolean(lineIndex % 2) ? 'tw-bg-main tw-bg-opacity-0' : 'tw-bg-main tw-bg-opacity-5',
          ].join(' ')}>
          <small className="tw-mr-1 tw-inline-block tw-w-3 tw-cursor-pointer tw-text-main" onClick={() => setIsOpen(!open)}>
            {open ? '\u25BC' : '\u25B6'}
          </small>
          <button
            type="button"
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
          </button>
        </span>
      )}
      <div ref={gridRef} id={`child-container-${folder._id || 'root'}`} className={`tw-flex tw-flex-col ${!open ? 'tw-hidden' : ''}`}>
        {folder.children?.map((child, index) => {
          if (child.type === 'folder') {
            child = child as FolderForTree;
            return (
              <Branch
                parentId={child.parentId || folder._id}
                position={child.position || index}
                key={child._id}
                lineIndex={child.lineIndex}
                folder={child}
                level={level + 1}
                initShowOpen={false}
                onListChange={onListChange}
                onFolderClick={onFolderClick}
                onDocumentClick={onDocumentClick}
              />
            );
          }
          child = child as DocumentForTree;
          return (
            <DocumentRow
              parentId={child.parentId || folder._id}
              position={child.position || index}
              key={child._id}
              lineIndex={child.lineIndex}
              document={child}
              level={level + 1}
              onDocumentClick={onDocumentClick}
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
  lineIndex: number;
  position: number;
  parentId: DocumentOrFolderId;
  onDocumentClick: (document: DocumentForTree) => void;
}

function DocumentRow({ document, level, lineIndex, position, parentId, onDocumentClick }: DocumentRowProps) {
  return (
    <button
      type="button"
      key={document._id}
      data-position={position}
      data-parentid={parentId}
      data-id={document._id}
      onClick={() => onDocumentClick(document)}
      className={[
        'tw-block tw-cursor-pointer tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-py-2 tw-text-left tw-text-gray-800',
        Boolean(lineIndex % 2) ? 'tw-bg-main tw-bg-opacity-0' : 'tw-bg-main tw-bg-opacity-5',
        `tw-pl-${level * horizontalSpacing + 4}`,
      ].join(' ')}>
      {'📃 '} <span>{document.name}</span>
    </button>
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
    // lineIndex: 0,
  };
  let lineIndex = 0;
  const findChildren = (folder: Item): FolderChildren => {
    const children = items
      .filter((item: Item) => item.parentId === folder._id)
      .sort((a, b) => {
        if (!a.position) return 1;
        if (!b.position) return -1;
        return a.position - b.position;
      })
      .map((item) => {
        lineIndex++;
        if (item.type === 'folder') {
          return {
            ...item,
            parentId: item.parentId || 'root',
            children: findChildren(item),
            lineIndex,
          } as FolderForTree;
        }
        return {
          ...item,
          parentId: item.parentId || 'root',
          lineIndex,
        } as DocumentForTree;
      });
    return children;
  };
  const rootChildren = findChildren(rootFolderItem as Item);
  const rootForTree: RootForTree = {
    ...rootFolderItem,
    lineIndex: 0,
    children: rootChildren,
  };
  return rootForTree;
};

type ItemState = {
  _id?: DocumentOrFolderId;
  position?: number;
  parentId?: DocumentOrFolderId;
  initShowOpen?: boolean;
};

const findChildrenRecursive = async (folder: HTMLDivElement, allItems: ItemState[]) => {
  const childrenContainer = folder.querySelector(`#child-container-${folder.dataset.id}`);
  if (childrenContainer === null) return;
  for (const [index, child] of Object.entries(Array.from(childrenContainer.children))) {
    const childElement = child as HTMLDivElement;
    const updatedChild = {
      position: Number(index) + 1,
      parentId: folder.dataset.id,
      _id: childElement.dataset.id,
      initShowOpen: childElement.dataset.open === 'false' ? false : true,
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
