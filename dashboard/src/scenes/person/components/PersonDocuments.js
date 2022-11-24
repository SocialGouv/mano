import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import ButtonCustom from '../../../components/ButtonCustom';
import { usersState, userState } from '../../../recoil/auth';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
} from '../../../recoil/persons';
import useApi from '../../../services/api';
import { formatDateTimeWithNameOfDay } from '../../../services/date';
import { capture } from '../../../services/sentry';
import { download } from '../../../utils';

const PersonDocuments = ({ person }) => {
  const [openModal, setOpenModal] = useState(false);
  const API = useApi();
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const user = useRecoilValue(userState);
  const setPersons = useSetRecoilState(personsState);
  const [resetFileInputKey, setResetFileInputKey] = useState(0); // to be able to use file input multiple times
  const users = useRecoilValue(usersState);

  return (
    <div className="tw-relative">
      {openModal && <DocumentModal document={openModal} person={person} onClose={() => setOpenModal(false)} />}
      <div className="tw-sticky tw-top-0 tw-z-50 tw-flex tw-bg-white tw-p-3">
        <h4 className="tw-flex-1 tw-text-xl">Documents</h4>
        <label
          aria-label="Ajouter un document"
          className="tw-text-md tw-h-8 tw-w-8 tw-cursor-pointer tw-rounded-full tw-bg-main tw-text-center tw-font-bold tw-leading-8 tw-text-white tw-transition hover:tw-scale-125">
          ＋
          <input
            type="file"
            key={resetFileInputKey}
            name="file"
            className="tw-hidden"
            onChange={async (e) => {
              const docResponse = await API.upload({
                path: `/person/${person._id}/document`,
                file: e.target.files[0],
              });
              if (!docResponse.ok || !docResponse.data) {
                capture('Error uploading document', { extra: { docResponse } });
                toast.error("Une erreur est survenue lors de l'envoi du document");
                return;
              }
              setResetFileInputKey((k) => k + 1);
              const { data: file, encryptedEntityKey } = docResponse;
              const personResponse = await API.put({
                path: `/person/${person._id}`,
                body: preparePersonForEncryption(
                  customFieldsPersonsMedical,
                  customFieldsPersonsSocial
                )({
                  ...person,
                  documents: [
                    ...(person.documents || []),
                    {
                      _id: file.filename,
                      name: file.originalname,
                      encryptedEntityKey,
                      createdAt: new Date(),
                      createdBy: user._id,
                      downloadPath: `/person/${person._id}/document/${file.filename}`,
                      file,
                    },
                  ],
                }),
              });
              if (personResponse.ok) {
                const newPerson = personResponse.decryptedData;
                setPersons((persons) =>
                  persons.map((p) => {
                    if (p._id === person._id) return newPerson;
                    return p;
                  })
                );
                toast.success('Document ajouté !');
              }
            }}
          />
        </label>
      </div>
      <table className="table table-striped">
        <tbody className="small">
          {(person.documents || []).map((doc) => (
            <tr
              key={doc._id}
              onClick={() => {
                setOpenModal(doc);
              }}>
              <td>
                <div>
                  <b>{doc.name}</b>
                </div>
                <div>{formatDateTimeWithNameOfDay(doc.createdAt)}</div>
                <div className="small">Créé par {users.find((e) => e._id === doc.createdBy)?.name}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!person.documents?.length && (
        <div className="tw-mt-8 tw-w-full tw-text-center tw-text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="tw-mx-auto tw-mb-2 tw-h-16 tw-w-16 tw-text-gray-200"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
            <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>
          </svg>
          Aucun document
        </div>
      )}
    </div>
  );
};

function DocumentModal({ document, onClose, person }) {
  const users = useRecoilValue(usersState);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const setPersons = useSetRecoilState(personsState);
  const API = useApi();
  return (
    <Modal
      isOpen={true}
      toggle={() => {
        onClose();
      }}
      size="lg"
      backdrop="static">
      <ModalHeader toggle={() => onClose()}>{document.name}</ModalHeader>
      <ModalBody>
        <div>Créé par {users.find((e) => e._id === document.createdBy)?.name}</div>
        <div>Créé le {formatDateTimeWithNameOfDay(document.createdAt)}</div>

        <div className="tw-mt-4 tw-flex tw-justify-end tw-gap-2">
          <ButtonCustom
            type="button"
            color="danger"
            onClick={async () => {
              if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
              await API.delete({ path: document.downloadPath ?? `/person/${person._id}/document/${document.file.filename}` });
              const personResponse = await API.put({
                path: `/person/${person._id}`,
                body: preparePersonForEncryption(
                  customFieldsPersonsMedical,
                  customFieldsPersonsSocial
                )({
                  ...person,
                  documents: person.documents.filter((d) => d._id !== document._id),
                }),
              });
              if (personResponse.ok) {
                const newPerson = personResponse.decryptedData;
                setPersons((persons) =>
                  persons.map((p) => {
                    if (p._id === person._id) return newPerson;
                    return p;
                  })
                );
              }
              onClose();
            }}
            title={'Supprimer'}
          />
          <ButtonCustom
            type="button"
            onClick={async () => {
              const file = await API.download({
                path: document.downloadPath ?? `/person/${person._id}/document/${document.file.filename}`,
                encryptedEntityKey: document.encryptedEntityKey,
              });
              download(file, document.name);
              onClose();
            }}
            title={'Télécharger'}
          />
        </div>
      </ModalBody>
    </Modal>
  );
}

export default PersonDocuments;
