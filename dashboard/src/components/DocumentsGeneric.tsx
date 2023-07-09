import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import PersonName from './PersonName';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';
import { organisationState, usersState } from '../recoil/auth';
import { groupsState } from '../recoil/groups';
import { personsState, usePreparePersonForEncryption } from '../recoil/persons';
import API from '../services/api';
import { formatDateTimeWithNameOfDay } from '../services/date';
import { download, viewBlobInNewWindow } from '../utils';
import type { Document } from '../types/document';
import type { UUIDV4 } from '../types/uuid';
import type { PersonInstance } from '../types/person';
import UserName from './UserName';

type DocumentModalProps = {
  document: Document;
  onClose: () => void;
  personId: UUIDV4;
  onDelete: (document: Document) => void;
  onChangeName: (name: string) => Promise<void>;
  color?: string;
};

export function DocumentModal({ document, onClose, personId, onDelete, onChangeName, color = 'main' }: DocumentModalProps) {
  const initialName = useMemo(() => document.name, [document.name]);
  const [name, setName] = useState(initialName);
  const [isUpdating, setIsUpdating] = useState(false);
  const canSave = useMemo(() => name !== initialName, [name, initialName]);
  const [isEditing, setIsEditing] = useState(false);

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
                await onChangeName(name);
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

          <small className="tw-pt-4 tw-opacity-60">
            Créé par <UserName id={document.createdBy} /> le {formatDateTimeWithNameOfDay(document.createdAt)}
          </small>
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
            onDelete(document);
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
            Modifier le nom
          </button>
        )}
      </ModalFooter>
    </ModalContainer>
  );
}
