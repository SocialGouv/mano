import { UUIDV4 } from "./uuid";

export type LinkedItemType = "medical-file" | "consultation" | "treatment" | "person" | "action";

export type LinkedItem = {
  _id: UUIDV4;
  type: LinkedItemType;
};

export type FileMetadata = {
  originalname: string;
  filename: string;
  size: number;
  encoding: string;
  mimetype: string;
};

export type DocumentOrFolderId = string;
export interface Document {
  _id: DocumentOrFolderId;
  name: string;
  group: boolean | undefined;
  encryptedEntityKey: string;
  createdAt: Date;
  createdBy: UUIDV4;
  downloadPath: string;
  file: FileMetadata;
  // for tree
  parentId: DocumentOrFolderId | undefined;
  position: number | undefined;
  movable?: boolean;
  // type is always equal to 'document'
  type: "document";
}

export interface Folder {
  _id: DocumentOrFolderId;
  name: string;
  createdAt: Date;
  createdBy: UUIDV4;
  parentId: DocumentOrFolderId | undefined;
  position: number | undefined;
  movable?: boolean;
  // type is always equal to 'folder'
  type: "folder";
}

export interface DocumentWithLinkedItem extends Document {
  linkedItem: LinkedItem;
}

export interface FolderWithLinkedItem extends Folder {
  linkedItem: LinkedItem;
}
