import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useHistory } from 'react-router-dom';
import { userState, organisationAuthentifiedState } from '../recoil/auth';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';
import { formatDateTimeWithNameOfDay } from '../services/date';
import { FullScreenIcon } from '../scenes/person/components/FullScreenIcon';
import UserName from './UserName';
import type { DocumentWithLinkedItem, Document, FileMetadata, FolderWithLinkedItem } from '../types/document';
import API from '../services/api';
import { download, viewBlobInNewWindow } from '../utils';
import type { UUIDV4 } from '../types/uuid';
import PersonName from './PersonName';
import { capture } from '../services/sentry';
import { toast } from 'react-toastify';
import DocumentsOrganizer from './DocumentsOrganizer';

interface DocumentsModuleProps {
  documents: Array<DocumentWithLinkedItem | FolderWithLinkedItem>;
  title?: string;
  personId: UUIDV4;
  showPanel?: boolean;
  withDocumentOrganizer?: boolean;
  showAssociatedItem?: boolean;
  canToggleGroupCheck?: boolean;
  onDeleteDocument: (document: DocumentWithLinkedItem) => Promise<boolean>;
  onSubmitDocument: (document: DocumentWithLinkedItem) => Promise<void>;
  onAddDocuments: (documents: Document[]) => Promise<void>;
  color?: 'main' | 'blue-900';
}

export function DocumentsModule({
  documents = [],
  title = 'Documents',
  personId,
  showPanel = false,
  withDocumentOrganizer = false,
  canToggleGroupCheck = false,
  showAssociatedItem = true,
  onDeleteDocument,
  onSubmitDocument,
  onAddDocuments,
  color = 'main',
}: DocumentsModuleProps) {
  if (!onDeleteDocument) throw new Error('onDeleteDocument is required');
  if (!onSubmitDocument) throw new Error('onSubmitDocument is required');
  const [documentToEdit, setDocumentToEdit] = useState<DocumentWithLinkedItem | null>(null);
  const [fullScreen, setFullScreen] = useState(false);

  const onlyDocuments = useMemo(() => documents.filter((d) => d.type === 'document'), [documents]) as DocumentWithLinkedItem[];

  return (
    <>
      {!!showPanel ? (
        <div className="tw-relative">
          <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-items-center tw-bg-white tw-p-3">
            <h4 className="tw-flex-1 tw-text-xl">Documents {onlyDocuments.length ? `(${onlyDocuments.length})` : ''}</h4>
            <div className="tw-flex tw-items-center tw-gap-2">
              <label
                aria-label="Ajouter des documents"
                className={`tw-text-md tw-mb-0 tw-h-8 tw-w-8 tw-rounded-full tw-font-bold tw-text-white tw-transition hover:tw-scale-125 tw-bg-${color} tw-inline-flex tw-items-center tw-justify-center`}>
                ＋
                <AddDocumentInput onAddDocuments={onAddDocuments} personId={personId} />
              </label>
              {Boolean(documents.length) && (
                <button
                  title="Passer les documents en plein écran"
                  className={`tw-h-6 tw-w-6 tw-rounded-full tw-text-${color} tw-transition hover:tw-scale-125`}
                  onClick={() => setFullScreen(true)}>
                  <FullScreenIcon />
                </button>
              )}
            </div>
          </div>
          <DocumentTable
            withClickableLabel
            documents={onlyDocuments}
            color={color}
            onDisplayDocument={setDocumentToEdit}
            onAddDocuments={onAddDocuments}
            personId={personId}
          />
        </div>
      ) : (
        <DocumentTable
          showAddDocumentButton
          documents={onlyDocuments}
          color={color}
          onDisplayDocument={setDocumentToEdit}
          onAddDocuments={onAddDocuments}
          personId={personId}
        />
      )}
      {!!documentToEdit && (
        <DocumentModal
          document={documentToEdit}
          key={documentToEdit.name}
          personId={personId}
          onClose={() => setDocumentToEdit(null)}
          onDelete={onDeleteDocument}
          onSubmit={onSubmitDocument}
          canToggleGroupCheck={canToggleGroupCheck}
          color={color}
          showAssociatedItem={showAssociatedItem}
        />
      )}
      <DocumentsFullScreen
        open={!!fullScreen}
        documents={withDocumentOrganizer ? documents : onlyDocuments}
        personId={personId}
        onDisplayDocument={setDocumentToEdit}
        onAddDocuments={onAddDocuments}
        onClose={() => setFullScreen(false)}
        withDocumentOrganizer={withDocumentOrganizer}
        title={title}
        color={color}
      />
    </>
  );
}

interface DocumentsFullScreenProps {
  open: boolean;
  withDocumentOrganizer: boolean;
  documents: Array<DocumentWithLinkedItem | FolderWithLinkedItem>;
  personId: UUIDV4;
  onAddDocuments: (documents: Document[]) => Promise<void>;
  onDisplayDocument: (document: DocumentWithLinkedItem) => void;
  onClose: () => void;
  title: string;
  color: 'main' | 'blue-900';
}

function DocumentsFullScreen({
  open,
  withDocumentOrganizer,
  personId,
  documents,
  onClose,
  title,
  color,
  onDisplayDocument,
  onAddDocuments,
}: DocumentsFullScreenProps) {
  return (
    <ModalContainer open={open} size="prose" onClose={onClose}>
      <ModalHeader title={title} />
      <ModalBody>
        {withDocumentOrganizer ? (
          <DocumentsOrganizer items={documents} onSave={console.log} onFolderClick={console.log} onDocumentClick={console.log} />
        ) : (
          <DocumentTable
            documents={documents as DocumentWithLinkedItem[]}
            onDisplayDocument={onDisplayDocument}
            onAddDocuments={onAddDocuments}
            withClickableLabel
            color={color}
            personId={personId}
          />
        )}
      </ModalBody>
      <ModalFooter>
        <button type="button" name="cancel" className="button-cancel" onClick={onClose}>
          Fermer
        </button>
        <label aria-label="Ajouter des documents" className={`button-submit mb-0 !tw-bg-${color}`}>
          ＋ Ajouter des documents
          <AddDocumentInput onAddDocuments={onAddDocuments} personId={personId} />
        </label>
      </ModalFooter>
    </ModalContainer>
  );
}

interface DocumentTableProps {
  documents: DocumentWithLinkedItem[];
  personId: UUIDV4;
  onAddDocuments: (documents: Document[]) => Promise<void>;
  onDisplayDocument: (document: DocumentWithLinkedItem) => void;
  color: 'main' | 'blue-900';
  showAddDocumentButton?: boolean;
  withClickableLabel?: boolean;
}

function DocumentTable({
  documents,
  onDisplayDocument,
  personId,
  color,
  showAddDocumentButton,
  withClickableLabel,
  onAddDocuments,
}: DocumentTableProps) {
  const organisation = useRecoilValue(organisationAuthentifiedState);

  if (!documents.length) {
    return (
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-6 tw-pb-6">
        <div className="tw-mt-8 tw-mb-2 tw-w-full tw-text-center tw-text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="tw-mx-auto tw-h-16 tw-w-16 tw-text-gray-200"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          Aucun document pour le moment
        </div>
        <label aria-label="Ajouter des documents" className={`button-submit mb-0 !tw-bg-${color}`}>
          ＋ Ajouter des documents
          <AddDocumentInput onAddDocuments={onAddDocuments} personId={personId} />
        </label>
      </div>
    );
  }

  return (
    <>
      {showAddDocumentButton && (
        <div className="tw-my-1.5 tw-flex tw-justify-center tw-self-center">
          <label aria-label="Ajouter des documents" className={`button-submit mb-0 !tw-bg-${color}`}>
            ＋ Ajouter des documents
            <AddDocumentInput onAddDocuments={onAddDocuments} personId={personId} />
          </label>
        </div>
      )}
      <table className="tw-w-full tw-table-fixed">
        <tbody className="tw-text-sm">
          {(documents || []).map((doc, index) => {
            console.log(doc);
            return (
              <tr
                key={doc._id}
                data-test-id={doc.downloadPath}
                aria-label={`Document ${doc.name}`}
                className={[
                  'tw-w-full tw-border-t tw-border-zinc-200 tw-bg-blue-900',
                  Boolean(index % 2) ? 'tw-bg-opacity-0' : 'tw-bg-opacity-5',
                ].join(' ')}
                onClick={() => {
                  onDisplayDocument(doc);
                }}>
                <td className="tw-p-3">
                  <p className="tw-m-0 tw-flex tw-items-center tw-overflow-hidden tw-font-bold">
                    <p className="tw-m-0 tw-flex tw-items-center tw-overflow-hidden tw-font-bold">
                      {!!organisation.groupsEnabled && !!doc.group && (
                        <span className="tw-mr-2 tw-text-xl" aria-label="Commentaire familial" title="Commentaire familial">
                          👪
                        </span>
                      )}
                    </p>
                    {doc.name}
                  </p>
                  {!!organisation.groupsEnabled && !!doc.group && personId !== doc.linkedItem.item._id && (
                    <p className="tw--xs tw-m-0 tw-mt-1">
                      Ce document est lié à <PersonName item={{ person: doc.linkedItem.item._id }} />
                    </p>
                  )}
                  <div className="tw-flex tw-text-xs">
                    <div className="tw-flex-1 tw-grow">
                      <p className="tw-m-0 tw-mt-1">{formatDateTimeWithNameOfDay(doc.createdAt)}</p>
                      <p className="tw-m-0">
                        Créé par <UserName id={doc.createdBy} />
                      </p>
                    </div>
                    {!!withClickableLabel && !['medical-file', 'person'].includes(doc.linkedItem?.type) && (
                      <div>
                        <div className="tw-rounded tw-border tw-border-blue-900 tw-bg-blue-900/10 tw-px-1">
                          {doc.linkedItem.type === 'treatment' && 'Traitement'}
                          {doc.linkedItem.type === 'consultation' && 'Consultation'}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

interface AddDocumentInputProps {
  personId: string;
  onAddDocuments: (documents: Document[]) => Promise<void>;
}

function AddDocumentInput({ personId, onAddDocuments }: AddDocumentInputProps) {
  const [resetFileInputKey, setResetFileInputKey] = useState(0); // to be able to use file input multiple times
  const user = useRecoilValue(userState);

  return (
    <input
      type="file"
      multiple
      key={resetFileInputKey}
      name="file"
      className="tw-hidden"
      onChange={async (e) => {
        if (!e.target.files?.length) return;
        const docsResponses = [];
        for (let i = 0; i < e.target.files.length; i++) {
          const fileToUpload = e.target.files[i] as any;
          const docResponse = await API.upload({
            path: `/person/${personId}/document`,
            file: fileToUpload,
          });
          if (!docResponse.ok || !docResponse.data) {
            capture('Error uploading document', { extra: { docResponse } });
            toast.error(`Une erreur est survenue lors de l'envoi du document ${fileToUpload?.filename}`);
            return;
          }
          const fileUploaded = docResponse.data as FileMetadata;
          toast.success(`Document ${fileUploaded.originalname} ajouté !`);
          const document: Document = {
            _id: fileUploaded.filename,
            name: fileUploaded.originalname,
            encryptedEntityKey: docResponse.encryptedEntityKey,
            createdAt: new Date(),
            createdBy: user?._id ?? '',
            downloadPath: `/person/${personId}/document/${fileUploaded.filename}`,
            file: fileUploaded,
            group: false,
            parentId: 'root',
            position: undefined,
            type: 'document',
          };
          docsResponses.push(document);
        }
        onAddDocuments(docsResponses);
        setResetFileInputKey((k) => k + 1);
      }}
    />
  );
}

type DocumentModalProps = {
  document: DocumentWithLinkedItem;
  personId: UUIDV4;
  onClose: () => void;
  onSubmit: (document: DocumentWithLinkedItem) => Promise<void>;
  onDelete: (document: DocumentWithLinkedItem) => Promise<boolean>;
  canToggleGroupCheck: boolean;
  showAssociatedItem: boolean;
  color: string;
};

function DocumentModal({ document, onClose, personId, onDelete, onSubmit, showAssociatedItem, canToggleGroupCheck, color }: DocumentModalProps) {
  const initialName = useMemo(() => document.name, [document.name]);
  const [name, setName] = useState(initialName);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const canSave = useMemo(() => isEditing && name !== initialName, [name, initialName, isEditing]);
  const history = useHistory();

  return (
    <ModalContainer open className="[overflow-wrap:anywhere]" size="prose">
      <ModalHeader title={name} />
      <ModalBody className="tw-pb-4">
        <div className="tw-flex tw-w-full tw-flex-col tw-justify-between tw-gap-4 tw-px-8 tw-py-4">
          {isEditing ? (
            <form
              id="edit-document-form"
              className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsUpdating(true);
                await onSubmit({ ...document, name });
                setIsUpdating(false);
                setIsEditing(false);
              }}>
              <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-blue-900'} htmlFor="create-consultation-name">
                Nom (facultatif)
              </label>
              <input className="tailwindui" id="create-consultation-name" name="name" value={name} onChange={(e) => setName(e.target.value)} />
            </form>
          ) : (
            <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-gap-2">
              <button
                type="button"
                className={`button-submit !tw-bg-${color}`}
                onClick={async () => {
                  const file = await API.download({
                    path: document.downloadPath ?? `/person/${personId}/document/${document.file.filename}`,
                    encryptedEntityKey: document.encryptedEntityKey,
                  });
                  download(file, name);
                  onClose();
                }}>
                Télécharger
              </button>
              <button
                type="button"
                className={`button-submit !tw-bg-${color}`}
                onClick={async () => {
                  // Open a new window or tab immediately

                  const file = await API.download({
                    path: document.downloadPath ?? `/person/${personId}/document/${document.file.filename}`,
                    encryptedEntityKey: document.encryptedEntityKey,
                  });
                  const url = URL.createObjectURL(file);

                  try {
                    const fileURL = await viewBlobInNewWindow(url);
                    window.open(fileURL, '_blank');
                  } catch (error) {
                    console.log(error);
                  }
                  // Create a blob URL from the File object
                }}>
                Ouvrir dans une nouvelle fenêtre
              </button>
            </div>
          )}
          {!!canToggleGroupCheck && (
            <div>
              <label htmlFor="document-for-group">
                <input
                  type="checkbox"
                  className="tw-mr-2"
                  id="document-for-group"
                  name="group"
                  defaultChecked={document.group}
                  value={document?.group ? 'true' : 'false'}
                  onChange={async () => {
                    await onSubmit({ ...document, group: !document.group });
                    setIsUpdating(false);
                    setIsEditing(false);
                  }}
                />
                Document familial
                <br />
                <small className="tw-block tw-text-gray-500">Ce document sera visible pour toute la famille</small>
              </label>
              {!!document.group && personId !== document.linkedItem.item._id && (
                <small className="tw-block tw-text-gray-500">
                  Note: Ce document est lié à <PersonName item={{ person: document.linkedItem.item._id }} />
                </small>
              )}
            </div>
          )}
          <small className="tw-pt-4 tw-opacity-60">
            Créé par <UserName id={document.createdBy} /> le {formatDateTimeWithNameOfDay(document.createdAt)}
          </small>
          {!!showAssociatedItem && document?.linkedItem?.type === 'treatment' && (
            <button
              onClick={() => {
                const searchParams = new URLSearchParams(history.location.search);
                searchParams.set('treatmentId', document.linkedItem.item._id);
                history.push(`?${searchParams.toString()}`);
                onClose();
              }}
              className="button-classic">
              Voir le traitement associé
            </button>
          )}
          {!!showAssociatedItem && document?.linkedItem?.type === 'consultation' && (
            <button
              onClick={() => {
                const searchParams = new URLSearchParams(history.location.search);
                searchParams.set('consultationId', document.linkedItem.item._id);
                history.push(`?${searchParams.toString()}`);
                onClose();
              }}
              className="button-classic">
              Voir la consultation associée
            </button>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          name="cancel"
          className="button-cancel"
          disabled={isUpdating}
          onClick={() => {
            onClose();
          }}>
          Fermer
        </button>
        <button
          type="button"
          className="button-destructive"
          disabled={isUpdating}
          onClick={async () => {
            if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
            const ok = await onDelete(document);
            if (ok) onClose();
          }}>
          Supprimer
        </button>
        {(isEditing || canSave) && (
          <button title="Sauvegarder ce document" type="submit" className="button-submit !tw-bg-blue-900" form="edit-document-form">
            Sauvegarder
          </button>
        )}
        {!isEditing && (
          <button
            title="Modifier le nom de ce document"
            type="button"
            className={`button-submit !tw-bg-${color}`}
            disabled={isUpdating}
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(true);
            }}>
            Modifier
          </button>
        )}
      </ModalFooter>
    </ModalContainer>
  );
}
