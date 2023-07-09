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
import type { Person } from '../types/person';

type DocumentModalProps = {
  document: Document;
  onClose: () => void;
  person: Person;
  children?: React.ReactNode;
  onDelete: (document: Document) => void;
  onChangeName: (name: string) => Promise<void>;
  groupsDisabled?: boolean;
  color?: string;
};

export function DocumentModal({
  document,
  onClose,
  person,
  children,
  onDelete,
  onChangeName,
  groupsDisabled = false,
  color = 'main',
}: DocumentModalProps) {
  const users = useRecoilValue(usersState);
  const preparePersonForEncryption = usePreparePersonForEncryption();
  const setPersons = useSetRecoilState(personsState);

  const groups = useRecoilValue(groupsState);
  const organisation = useRecoilValue(organisationState);

  const canToggleGroupCheck = useMemo(
    () => !groupsDisabled && !!organisation.groupsEnabled && groups.find((group) => group.persons.includes(person._id)),
    [groups, person._id, organisation.groupsEnabled, groupsDisabled]
  );

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
                    path: document.downloadPath ?? `/person/${document.person ?? person._id}/document/${document.file.filename}`,
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
                    path: document.downloadPath ?? `/person/${document.person ?? person._id}/document/${document.file.filename}`,
                    encryptedEntityKey: document.encryptedEntityKey,
                  });
                  const url = URL.createObjectURL(file);

                  try {
                    const fileURL = await viewBlobInNewWindow(url);
                    window.open(fileURL, '_blank');
                  } catch (error) {
                    alert('Notice', error);
                  }
                  // Create a blob URL from the File object
                }}>
                Ouvrir dans une nouvelle fenêtre
              </button>
            </div>
          )}

          <small className="tw-pt-4 tw-opacity-60">
            Créé par {users.find((e) => e._id === document.createdBy)?.name} le {formatDateTimeWithNameOfDay(document.createdAt)}
          </small>
          {children}
          {!!canToggleGroupCheck && (
            <div>
              <label htmlFor="document-for-group">
                <input
                  type="checkbox"
                  className="tw-mr-2"
                  id="document-for-group"
                  name="group"
                  defaultChecked={document.group}
                  value={document.group}
                  onChange={async () => {
                    const _person = !document.person ? person : document.personPopulated;
                    const isAttachedToAnotherPerson = _person._id !== person._id;
                    const personResponse = await API.put({
                      path: `/person/${_person._id}`,
                      body: preparePersonForEncryption({
                        ..._person,
                        documents: _person.documents.map((_document) =>
                          document._id === _document._id ? { ..._document, group: !_document.group } : _document
                        ),
                      }),
                    });
                    if (personResponse.ok) {
                      toast.success('Document mis à jour !');
                      const newPerson = personResponse.decryptedData;
                      setPersons((persons) =>
                        persons.map((p) => {
                          if (p._id === _person._id) return newPerson;
                          return p;
                        })
                      );
                      if (isAttachedToAnotherPerson) onClose();
                    }
                  }}
                />
                Document familial
                <br />
                <small className="tw-block tw-text-gray-500">Ce document sera visible pour toute la famille</small>
              </label>
              {!!document.personPopulated && (
                <small className="tw-block tw-text-gray-500">
                  Note: Ce document est lié à <PersonName item={document} />
                </small>
              )}
            </div>
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
