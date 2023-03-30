import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import ConsultationModal from '../../../components/ConsultationModal';
import { organisationState, usersState, userState } from '../../../recoil/auth';
import { consultationsState, prepareConsultationForEncryption } from '../../../recoil/consultations';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../../../recoil/medicalFiles';
import { arrayOfitemsGroupedByConsultationSelector } from '../../../recoil/selectors';
import { prepareTreatmentForEncryption, treatmentsState } from '../../../recoil/treatments';
import API from '../../../services/api';
import { formatDateTimeWithNameOfDay } from '../../../services/date';
import { capture } from '../../../services/sentry';
import DocumentModal from './PersonDocumentModal';
import TreatmentModal from './TreatmentModal';

const PersonDocumentsMedical = ({ person }) => {
  const [documentToEdit, setDocumentToEdit] = useState(null);

  const user = useRecoilValue(userState);
  const [resetFileInputKey, setResetFileInputKey] = useState(0); // to be able to use file input multiple times
  const users = useRecoilValue(usersState);
  const organisation = useRecoilValue(organisationState);

  const allConsultations = useRecoilValue(arrayOfitemsGroupedByConsultationSelector);
  const setAllConsultations = useSetRecoilState(consultationsState);
  const [allTreatments, setAllTreatments] = useRecoilState(treatmentsState);
  const [allMedicalFiles, setAllMedicalFiles] = useRecoilState(medicalFileState);
  const [consultation, setConsultation] = useState(false);
  const [treatment, setTreatment] = useState(false);

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
      {documentToEdit && (
        <DocumentModal
          groupsDisabled
          onDelete={async (document) => {
            if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
            await API.delete({ path: document.downloadPath ?? `/person/${document.person ?? person._id}/document/${document.file.filename}` });

            if (document.type === 'treatment') {
              const treatmentResponse = await API.put({
                path: `/treatment/${document.treatment._id}`,
                body: prepareTreatmentForEncryption({
                  ...document.treatment,
                  documents: document.treatment.documents.filter((d) => d._id !== document._id),
                }),
              });
              if (treatmentResponse.ok) {
                const newTreatment = treatmentResponse.data;
                setAllTreatments((allTreatments) =>
                  allTreatments.map((t) => {
                    if (t._id === document.treatment._id) return newTreatment;
                    return t;
                  })
                );
                toast.success('Document supprimé');
              } else {
                toast.error('Erreur lors de la suppression du document, vous pouvez contactez le support');
                capture('Error while deleting treatment document', { treatment: document.treatment, document });
              }
            } else if (document.type === 'consultation') {
              const consultationResponse = await API.put({
                path: `/consultation/${document.consultation._id}`,
                body: prepareConsultationForEncryption(organisation.consultations)({
                  ...document.consultation,
                  documents: document.consultation.documents.filter((d) => d._id !== document._id),
                }),
              });
              if (consultationResponse.ok) {
                const newConsultation = consultationResponse.data;
                setAllConsultations((allConsultations) =>
                  allConsultations.map((c) => {
                    if (c._id === document.consultation._id) return newConsultation;
                    return c;
                  })
                );
                toast.success('Document supprimé');
              } else {
                toast.error('Erreur lors de la suppression du document, vous pouvez contactez le support');
                capture('Error while deleting consultation document', { consultation: document.consultation, document });
              }
            } else {
              const medicalFileResponse = await API.put({
                path: `/medical-file/${medicalFile._id}`,
                body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
                  ...medicalFile,
                  documents: medicalFile.documents.filter((d) => d._id !== document._id),
                }),
              });
              if (medicalFileResponse.ok) {
                const newMedicalFile = medicalFileResponse.decryptedData;
                setAllMedicalFiles((allMedicalFiles) =>
                  allMedicalFiles.map((m) => {
                    if (m._id === medicalFile._id) return newMedicalFile;
                    return m;
                  })
                );
                toast.success('Document supprimé');
              } else {
                toast.error('Erreur lors de la suppression du document, vous pouvez contactez le support');
                capture('Error while deleting medical file document', { medicalFile, document });
              }
            }
            setDocumentToEdit(null);
          }}
          document={documentToEdit}
          person={person}
          onClose={() => setDocumentToEdit(null)}
          key={documentToEdit._id}>
          {documentToEdit.type === 'treatment' ? (
            <button
              onClick={() => {
                setTreatment(documentToEdit.treatment);
                setDocumentToEdit(null);
              }}
              className="button-classic">
              Voir le traitement associé
            </button>
          ) : documentToEdit.type === 'consultation' ? (
            <button
              onClick={() => {
                setConsultation(documentToEdit.consultation);
                setDocumentToEdit(null);
              }}
              className="button-classic">
              Voir la consultation associé
            </button>
          ) : null}
        </DocumentModal>
      )}
      {consultation && (
        <ConsultationModal
          consultation={consultation}
          onClose={() => {
            setConsultation(false);
          }}
          personId={person._id}
        />
      )}
      {treatment && (
        <TreatmentModal
          treatment={treatment}
          onClose={() => {
            setTreatment(false);
          }}
          person={person}
        />
      )}
      <div className="tw-sticky tw-top-0 tw-z-50 tw-flex tw-bg-white tw-p-3">
        <h4 className="tw-flex-1 tw-text-xl">Documents {documents?.length ? `(${documents?.length})` : ''}</h4>
        <label
          aria-label="Ajouter un document"
          className="tw-text-md tw-h-8 tw-w-8 tw-cursor-pointer tw-rounded-full tw-bg-blue-900 tw-text-center tw-font-bold tw-leading-8 tw-text-white tw-transition hover:tw-scale-125">
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
              const medicalFileResponse = await API.put({
                path: `/medical-file/${medicalFile._id}`,
                body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
                  ...medicalFile,
                  documents: [
                    ...(medicalFile.documents || []),
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
              if (medicalFileResponse.ok) {
                const newMedicalFile = medicalFileResponse.decryptedData;
                setAllMedicalFiles((allMedicalFiles) =>
                  allMedicalFiles.map((m) => {
                    if (m._id === medicalFile._id) return newMedicalFile;
                    return m;
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
                <p className="tw-m-0 tw-flex tw-items-center tw-overflow-hidden tw-font-bold">{doc.name}</p>
                <div className="tw-flex tw-text-xs">
                  <div className="tw-flex-1 tw-grow">
                    <p className="tw-m-0 tw-mt-1">{formatDateTimeWithNameOfDay(doc.createdAt)}</p>
                    <p className="tw-m-0">Créé par {users.find((e) => e._id === doc.createdBy)?.name}</p>
                  </div>
                  {doc.type && (
                    <div>
                      <div className="tw-rounded tw-border tw-border-blue-900 tw-bg-blue-900/10 tw-px-1">
                        {doc.type === 'treatment' ? 'Traitement' : doc.type === 'consultation' ? 'Consultation' : ''}
                      </div>
                    </div>
                  )}
                </div>
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
