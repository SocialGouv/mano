import { useCallback, useEffect, useRef, useState } from 'react';
import SortableJS from 'sortablejs';
import type { DocumentWithLinkedItem, DocumentOrFolderId, FolderWithLinkedItem, Folder } from '../types/document';

type Item = DocumentWithLinkedItem | FolderWithLinkedItem;
type FolderChildren = Array<FolderForTree | DocumentForTree>;

interface DocumentForTree extends DocumentWithLinkedItem {}
interface FolderForTree extends FolderWithLinkedItem {
  children: FolderChildren;
}

interface RootForTree extends Folder {
  children: FolderChildren;
}

interface DocumentsOrganizerProps {
  items: Item[];
  onSave: (newOrder: Item[]) => void;
  onFolderClick: (folder: FolderForTree) => void;
  onDocumentClick: (document: DocumentForTree) => void;
}

export default function DocumentsOrganizer({ items, onSave, onFolderClick, onDocumentClick }: DocumentsOrganizerProps) {
  const documentsTree = buildFolderTree(items);

  // reloadTreeKey to prevent error `Failed to execute 'removeChild' on 'Node'` from sortablejs after updating messy tree
  const [reloadTreeKey, setReloadeTreeKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const onListChange = useCallback(async () => {
    if (!rootRef.current) return;
    console.log('CALLING ONLISTCHANGE');
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
    setReloadeTreeKey((k) => k + 1);
    onSave(newOrder);
    setReloadeTreeKey((k) => k + 1);
    setIsSaving(false);
  }, [items, onSave]);

  return (
    <>
      {/* TODO find a way for tailwind to not filter margins from compiling,
       because things like `ml-${level}` are not compiled */}
      <div className="dir-ltr dir-ltr ml-13 ml-15 ml-2 ml-3 ml-4 ml-5 ml-6 ml-7 ml-8 ml-9 ml-10 ml-11 ml-12 ml-14 ml-16 hidden"></div>
      <div ref={rootRef} key={reloadTreeKey} className="dir-rtl overflow-auto px-2 pt-2 pb-10">
        <Branch
          parentId="root"
          position={0}
          folder={documentsTree}
          level={0}
          key={JSON.stringify(items)}
          onListChange={onListChange}
          initShowOpen
          onFolderClick={onFolderClick}
          onDocumentClick={onDocumentClick}
          className="dir-ltr"
        />
      </div>
      {!!isSaving && (
        <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-gray-500 opacity-25">
          {/* <Loader color="#bbbbbb" size={40} /> */}
        </div>
      )}
    </>
  );
}

const horizontalSpacing = 2;

interface BranchProps {
  folder: FolderForTree | RootForTree;
  level: number;
  position?: number;
  parentId: DocumentOrFolderId;
  initShowOpen: boolean;
  onListChange: () => void;
  onFolderClick: (folder: FolderForTree) => void;
  onDocumentClick: (document: DocumentForTree) => void;
  className?: string;
}

function Branch({
  folder,
  level,
  position,
  parentId,
  onListChange,
  onFolderClick,
  onDocumentClick,
  initShowOpen = false,
  className = '',
}: BranchProps) {
  const [open, setIsOpen] = useState(initShowOpen);

  const gridRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<SortableJS>();
  useEffect(() => {
    if (!gridRef.current) return;
    console.log('CALLING SORTABLE');
    sortableRef.current = SortableJS.create(gridRef.current, { animation: 150, group: 'shared', onEnd: onListChange });
  }, [onListChange]);

  return (
    <div
      data-position={position}
      data-open={open}
      data-parentid={parentId}
      data-id={folder._id}
      data-type="folder"
      style={{ marginLeft: `${level * horizontalSpacing}rem` }}
      className={['tw-flex tw-flex-col', className].filter(Boolean).join(' ')}>
      <span className="tw-text-warmGray-500 tw-inline-block tw-max-w-full tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap">
        <small className="mr-1 inline-block w-3 cursor-pointer text-trueGray-400" onClick={() => setIsOpen(!open)}>
          {open ? '\u25BC' : '\u25B6'}
        </small>
        <button
          type="button"
          onClick={() => {
            if (folder._id === 'root') return;
            const notRootFolder = folder as FolderForTree;
            onFolderClick(notRootFolder);
          }}
          className="inline cursor-pointer text-warmGray-500">
          {folder.name ? (
            `${open ? '📂' : '📁'} ${folder.name} (${folder.children?.length || 0})`
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="-mt-2 inline h-6 w-6 cursor-pointer"
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
      <div ref={gridRef} id={`child-container-${folder._id || 'root'}`} className={`flex flex-col ${!open ? 'hidden' : ''}`}>
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
  position: number;
  parentId: DocumentOrFolderId;
  onDocumentClick: (document: DocumentForTree) => void;
}

function DocumentRow({ document, level, position, parentId, onDocumentClick }: DocumentRowProps) {
  return (
    <button
      type="button"
      key={document._id}
      data-position={position}
      data-parentid={parentId}
      data-id={document._id}
      onClick={() => onDocumentClick(document)}
      className={`block cursor-pointer  overflow-hidden text-ellipsis whitespace-nowrap text-warmGray-500 ml-${level * horizontalSpacing}`}>
      {'📃 '} <span>{document.name}</span>
    </button>
  );
}

const buildFolderTree = (items: Item[]) => {
  const rootFolder = {
    _id: 'root',
    name: 'Documents',
    // children: [],
    position: 0,
    parentId: 'NA', // for type safety easiness purpose
    type: 'folder',
  };
  const findChildren = (folder: Item): FolderChildren => {
    const children = items
      .filter((item: Item) => item.parentId === folder._id)
      .map((item) => {
        if (item.type === 'folder') {
          return {
            ...item,
            parentId: item.parentId || 'root',
            children: findChildren(item),
          } as FolderForTree;
        }
        return {
          ...item,
          parentId: item.parentId || 'root',
        } as DocumentForTree;
      });
    return children;
  };
  const rootChildren = findChildren(rootFolder as Item);
  return {
    ...rootFolder,
    children: rootChildren,
  };
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
