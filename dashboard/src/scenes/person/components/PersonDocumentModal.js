import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import PersonName from '../../../components/PersonName';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../../components/tailwind/Modal';
import { organisationState, usersState, userState } from '../../../recoil/auth';
import { groupsState } from '../../../recoil/groups';
import { personsState, usePreparePersonForEncryption } from '../../../recoil/persons';
import API from '../../../services/api';
import { formatDateTimeWithNameOfDay } from '../../../services/date';
import { capture } from '../../../services/sentry';
import { download } from '../../../utils';

export default function DocumentModal({ document, onClose, person }) {
  const users = useRecoilValue(usersState);
  const preparePersonForEncryption = usePreparePersonForEncryption();
  const setPersons = useSetRecoilState(personsState);

  const groups = useRecoilValue(groupsState);
  const organisation = useRecoilValue(organisationState);

  const canToggleGroupCheck = useMemo(
    () => !!organisation.groupsEnabled && groups.find((group) => group.persons.includes(person._id)),
    [groups, person._id, organisation.groupsEnabled]
  );

  return (
    <ModalContainer open className="[overflow-wrap:anywhere]">
      <ModalHeader title={document.name} />
      <ModalBody>
        <div className="tw-flex tw-w-full tw-flex-col tw-justify-between tw-gap-4 tw-px-8">
          <small className="tw-opacity-60">
            Créé par {users.find((e) => e._id === document.createdBy)?.name} le {formatDateTimeWithNameOfDay(document.createdAt)}
          </small>
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
        <button type="button" name="cancel" className="button-cancel" onClick={() => onClose()}>
          Fermer
        </button>
        <button
          type="button"
          className="button-destructive"
          onClick={async () => {
            if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
            const _person = !document.person ? person : document.personPopulated;
            await API.delete({ path: document.downloadPath ?? `/person/${document.person ?? person._id}/document/${document.file.filename}` });
            const personResponse = await API.put({
              path: `/person/${_person._id}`,
              body: preparePersonForEncryption({
                ..._person,
                documents: _person.documents.filter((d) => d._id !== document._id),
              }),
            });
            if (personResponse.ok) {
              const newPerson = personResponse.decryptedData;
              setPersons((persons) =>
                persons.map((p) => {
                  if (p._id === _person._id) return newPerson;
                  return p;
                })
              );
            }
            onClose();
          }}>
          Supprimer
        </button>
        <button
          type="button"
          className="button-submit"
          onClick={async () => {
            const file = await API.download({
              path: document.downloadPath ?? `/person/${document.person ?? person._id}/document/${document.file.filename}`,
              encryptedEntityKey: document.encryptedEntityKey,
            });
            download(file, document.name);
            onClose();
          }}>
          Télécharger
        </button>
      </ModalFooter>
    </ModalContainer>
  );
}
