import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useLocalStorage } from 'react-use';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { modalConfirmState } from '../../../components/ModalConfirm';
import PersonName from '../../../components/PersonName';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../../components/tailwind/Modal';
import { sortActionsOrConsultations } from '../../../recoil/actions';
import { currentTeamState, organisationState, usersState, userState } from '../../../recoil/auth';
import { consultationsState } from '../../../recoil/consultations';
import { groupsState } from '../../../recoil/groups';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../../../recoil/medicalFiles';
import { flattenedCustomFieldsPersonsSelector, personFieldsSelector, personsState, usePreparePersonForEncryption } from '../../../recoil/persons';
import { arrayOfitemsGroupedByConsultationSelector } from '../../../recoil/selectors';
import { treatmentsState } from '../../../recoil/treatments';
import API from '../../../services/api';
import { formatDateTimeWithNameOfDay } from '../../../services/date';
import { capture } from '../../../services/sentry';
import useSearchParamState from '../../../services/useSearchParamState';
import { download } from '../../../utils';
import DocumentModal from './PersonDocumentModal';

const PersonDocumentsMedical = ({ person }) => {
  const [documentToEdit, setDocumentToEdit] = useState(null);

  const user = useRecoilValue(userState);
  const setPersons = useSetRecoilState(personsState);
  const [resetFileInputKey, setResetFileInputKey] = useState(0); // to be able to use file input multiple times
  const users = useRecoilValue(usersState);
  const organisation = useRecoilValue(organisationState);
  const preparePersonForEncryption = usePreparePersonForEncryption();

  const allConsultations = useRecoilValue(arrayOfitemsGroupedByConsultationSelector);
  const [allTreatments] = useRecoilState(treatmentsState);
  const [allMedicalFiles, setAllMedicalFiles] = useRecoilState(medicalFileState);

  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);

  const personConsultations = useMemo(() => (allConsultations || []).filter((c) => c.person === person._id), [allConsultations, person._id]);

  const treatments = useMemo(() => (allTreatments || []).filter((t) => t.person === person._id), [allTreatments, person._id]);

  const medicalFile = useMemo(() => (allMedicalFiles || []).find((m) => m.person === person._id), [allMedicalFiles, person._id]);

  useEffect(() => {
    if (!medicalFile) {
      (async () => {
        const response = await API.post({
          path: '/medical-file',
          body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({ person: person._id, documents: [], organisation: organisation._id }),
        });
        if (!response.ok) return;
        setAllMedicalFiles((medicalFiles) => [...medicalFiles, response.decryptedData]);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicalFile]);

  const allMedicalDocuments = useMemo(() => {
    const ordonnances =
      treatments
        ?.map((treatment) => treatment.documents?.map((doc) => ({ ...doc, type: 'treatment', treatment })))
        .filter(Boolean)
        .flat() || [];
    const consultationsDocs =
      personConsultations
        ?.map((consultation) => consultation.documents?.map((doc) => ({ ...doc, type: 'consultation', consultation })))
        .filter(Boolean)
        .flat() || [];
    const otherDocs = medicalFile?.documents || [];
    return [...ordonnances, ...consultationsDocs, ...otherDocs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [personConsultations, medicalFile?.documents, treatments]);

  const documents = allMedicalDocuments;

  // below there is `Note: Ce document est lié à <PersonName item={document} />`
  // if the user clicks on the person name, we need to hide the DocumentModal
  useEffect(() => {
    setDocumentToEdit(null);
  }, [person._id]);

  return (
    <div className="tw-relative">
      {documentToEdit && <DocumentModal document={documentToEdit} person={person} onClose={() => setDocumentToEdit(null)} key={documentToEdit._id} />}
      <div className="tw-sticky tw-top-0 tw-z-50 tw-flex tw-bg-white tw-p-3">
        <h4 className="tw-flex-1 tw-text-xl">Documents {documents?.length ? `(${documents?.length})` : ''}</h4>
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
              console.log('uploaded file', docResponse);
              if (!docResponse.ok || !docResponse.data) {
                capture('Error uploading document', { extra: { docResponse } });
                toast.error("Une erreur est survenue lors de l'envoi du document");
                return;
              }
              setResetFileInputKey((k) => k + 1);
              const { data: file, encryptedEntityKey } = docResponse;
              const personResponse = await API.put({
                path: `/person/${person._id}`,
                body: preparePersonForEncryption({
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
      <table className="tw-w-full tw-table-fixed">
        <tbody className="tw-text-sm">
          {(documents || []).map((doc, index) => (
            <tr
              key={doc._id}
              data-test-id={doc.downloadPath}
              aria-label={`Document ${doc.name}`}
              className={['tw-w-full tw-border-t tw-border-zinc-200', Boolean(index % 2) ? '' : 'tw-bg-zinc-100'].join(' ')}
              onClick={() => {
                setDocumentToEdit(doc);
              }}>
              <td className="tw-p-3">
                <p className="tw-m-0 tw-flex tw-items-center tw-overflow-hidden tw-font-bold">
                  {!!organisation.groupsEnabled && !!doc.group && (
                    <span className="tw-mr-2 tw-text-xl" aria-label="Commentaire familial" title="Commentaire familial">
                      👪
                    </span>
                  )}
                  {doc.name}
                </p>
                {!!organisation.groupsEnabled && !!doc.group && !!doc.personPopulated && (
                  <p className="tw--xs tw-m-0 tw-mt-1">
                    Ce document est lié à <PersonName item={doc} />
                  </p>
                )}
                <p className="tw-m-0 tw-mt-1 tw-text-xs">{formatDateTimeWithNameOfDay(doc.createdAt)}</p>
                <p className="tw-m-0 tw-text-xs">Créé par {users.find((e) => e._id === doc.createdBy)?.name}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!documents?.length && (
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

export default PersonDocumentsMedical;
