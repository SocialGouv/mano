import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { useHistory } from 'react-router-dom';
import { organisationState, usersState, userState } from '../../../recoil/auth';
import { consultationsState, prepareConsultationForEncryption } from '../../../recoil/consultations';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../../../recoil/medicalFiles';
import { arrayOfitemsGroupedByConsultationSelector } from '../../../recoil/selectors';
import { prepareTreatmentForEncryption, treatmentsState } from '../../../recoil/treatments';
import API from '../../../services/api';
import { formatDateTimeWithNameOfDay } from '../../../services/date';
import { capture } from '../../../services/sentry';
import DocumentModal from './DocumentModal';

const PersonDocumentsMedical = ({ person }) => {
  const [documentToEdit, setDocumentToEdit] = useState(null);

  const user = useRecoilValue(userState);
  const [resetFileInputKey, setResetFileInputKey] = useState(0); // to be able to use file input multiple times
  const users = useRecoilValue(usersState);
  const organisation = useRecoilValue(organisationState);
  const history = useHistory();

  const allConsultations = useRecoilValue(arrayOfitemsGroupedByConsultationSelector);
  const setAllConsultations = useSetRecoilState(consultationsState);
  const [allTreatments, setAllTreatments] = useRecoilState(treatmentsState);
  const [allMedicalFiles, setAllMedicalFiles] = useRecoilState(medicalFileState);

  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);

  const personConsultations = useMemo(() => (allConsultations || []).filter((c) => c.person === person._id), [allConsultations, person._id]);

  const treatments = useMemo(() => (allTreatments || []).filter((t) => t.person === person._id), [allTreatments, person._id]);

  const medicalFile = useMemo(() => (allMedicalFiles || []).find((m) => m.person === person._id), [allMedicalFiles, person._id]);

  const allMedicalDocuments = useMemo(() => {
    const ordonnances = {};
    for (const treatment of treatments) {
      for (const document of treatment.documents || []) {
        ordonnances[document._id] = {
          ...document,
          type: 'treatment',
          treatment,
        };
      }
    }

    const consultationsDocs = {};
    for (const consultation of personConsultations) {
      if (!!consultation?.onlyVisibleBy?.length) {
        if (!consultation.onlyVisibleBy.includes(user._id)) continue;
      }
      for (const document of consultation.documents || []) {
        consultationsDocs[document._id] = {
          ...document,
          type: 'consultation',
          consultation,
        };
      }
    }

    const otherDocs = {};
    for (const document of medicalFile?.documents || []) {
      otherDocs[document._id] = {
        ...document,
        type: 'medical-file',
      };
    }
    return [...Object.values(ordonnances), ...Object.values(consultationsDocs), ...Object.values(otherDocs)].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [personConsultations, medicalFile?.documents, treatments, user._id]);

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
          color="blue-900"
          document={documentToEdit}
          person={person}
          onClose={() => setDocumentToEdit(null)}
          key={documentToEdit._id}
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
                const newTreatment = treatmentResponse.decryptedData;
                debugger;
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
                const newConsultation = consultationResponse.decryptedData;
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
          onChangeName={async (newName) => {
            const medicalFileResponse = await API.put({
              path: `/medical-file/${medicalFile._id}`,
              body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
                ...medicalFile,
                documents: medicalFile.documents.map((doc) => {
                  if (doc._id === documentToEdit._id) {
                    return {
                      ...doc,
                      name: newName,
                    };
                  }
                  return doc;
                }),
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
              toast.success('Document mis à jour !');
            }
          }}>
          {documentToEdit.type === 'treatment' ? (
            <button
              onClick={() => {
                const searchParams = new URLSearchParams(history.location.search);
                searchParams.set('treatmentId', documentToEdit.treatment);
                history.push(`?${searchParams.toString()}`);
                setDocumentToEdit(null);
              }}
              className="button-classic">
              Voir le traitement associé
            </button>
          ) : documentToEdit.type === 'consultation' ? (
            <button
              onClick={() => {
                history.push(`?consultationId=${documentToEdit.consultation}`);
                setDocumentToEdit(null);
              }}
              className="button-classic">
              Voir la consultation associée
            </button>
          ) : null}
        </DocumentModal>
      )}
      <div className="tw-sticky tw-top-0 tw-z-50 tw-flex tw-bg-white tw-p-3">
        <h4 className="tw-flex-1 tw-text-xl">Documents {documents?.length ? `(${documents?.length})` : ''}</h4>
        <label
          aria-label="Ajouter des documents"
          className="tw-text-md tw-h-8 tw-w-8 tw-cursor-pointer tw-rounded-full tw-bg-blue-900 tw-text-center tw-font-bold tw-leading-8 tw-text-white tw-transition hover:tw-scale-125">
          ＋
          <input
            type="file"
            multiple
            key={resetFileInputKey}
            name="file"
            className="tw-hidden"
            onChange={async (e) => {
              if (!e.target.files?.length) return;
              let medicalFileToUpdate = medicalFile;
              for (let i = 0; i < e.target.files.length; i++) {
                const fileToUpload = e.target.files[i];
                const docResponse = await API.upload({
                  path: `/person/${person._id}/document`,
                  file: fileToUpload,
                });
                if (!docResponse.ok || !docResponse.data) {
                  capture('Error uploading document', { extra: { docResponse } });
                  toast.error(`Une erreur est survenue lors de l'envoi du document ${fileToUpload?.filename}`);
                  return;
                }
                setResetFileInputKey((k) => k + 1);
                const { data: fileUploaded, encryptedEntityKey } = docResponse;
                const medicalFileResponse = await API.put({
                  path: `/medical-file/${medicalFileToUpdate._id}`,
                  body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
                    ...medicalFileToUpdate,
                    documents: [
                      ...(medicalFileToUpdate.documents || []),
                      {
                        _id: fileUploaded.filename,
                        name: fileUploaded.originalname,
                        encryptedEntityKey,
                        createdAt: new Date(),
                        createdBy: user._id,
                        downloadPath: `/person/${person._id}/document/${fileUploaded.filename}`,
                        file: fileUploaded,
                      },
                    ],
                  }),
                });
                if (medicalFileResponse.ok) {
                  medicalFileToUpdate = medicalFileResponse.decryptedData;
                  toast.success(`Document ${fileUploaded.originalname} ajouté !`);
                }
              }
              setAllMedicalFiles((allMedicalFiles) =>
                allMedicalFiles.map((m) => {
                  if (m._id === medicalFileToUpdate._id) return medicalFileToUpdate;
                  return m;
                })
              );
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
              className={['tw-w-full tw-border-t tw-border-zinc-200 tw-bg-blue-900', Boolean(index % 2) ? 'tw-bg-opacity-0' : 'tw-bg-opacity-5'].join(
                ' '
              )}
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
