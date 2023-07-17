import { useMemo } from 'react';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { organisationAuthentifiedState, userAuthentifiedState } from '../../../recoil/auth';
import { consultationsState, prepareConsultationForEncryption } from '../../../recoil/consultations';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../../../recoil/medicalFiles';
import { arrayOfitemsGroupedByConsultationSelector } from '../../../recoil/selectors';
import { prepareTreatmentForEncryption, treatmentsState } from '../../../recoil/treatments';
import API, { encryptItem } from '../../../services/api';
import { capture } from '../../../services/sentry';
import { DocumentsModule } from '../../../components/DocumentsGeneric';
import type { PersonPopulated } from '../../../types/person';
import type { DocumentWithLinkedItem, FolderWithLinkedItem, Document, Folder } from '../../../types/document';
import type { MedicalFileInstance } from '../../../types/medicalFile';
import type { ConsultationInstance } from '../../../types/consultation';
import { useDataLoader } from '../../../components/DataLoader';

interface PersonDocumentsProps {
  person: PersonPopulated;
}

const PersonDocumentsMedical = ({ person }: PersonDocumentsProps) => {
  const user = useRecoilValue(userAuthentifiedState);
  const organisation = useRecoilValue(organisationAuthentifiedState);

  const allConsultations = useRecoilValue<ConsultationInstance[]>(arrayOfitemsGroupedByConsultationSelector);
  const setAllConsultations = useSetRecoilState(consultationsState);
  const [allTreatments, setAllTreatments] = useRecoilState(treatmentsState);
  const [allMedicalFiles, setAllMedicalFiles] = useRecoilState(medicalFileState);

  const { refresh } = useDataLoader();

  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);

  const personConsultations = useMemo(() => (allConsultations || []).filter((c) => c.person === person._id), [allConsultations, person._id]);

  const treatments = useMemo(() => (allTreatments || []).filter((t) => t.person === person._id), [allTreatments, person._id]);

  const medicalFile: MedicalFileInstance | undefined = useMemo(
    () => (allMedicalFiles || []).find((m) => m.person === person._id),
    [allMedicalFiles, person._id]
  );

  const allMedicalDocuments = useMemo(() => {
    // ordonnaces is an object of DocumentWithLinkedItem
    // define ordannace typed
    const ordonnances: Record<string, DocumentWithLinkedItem | FolderWithLinkedItem> = {};
    for (const treatment of treatments) {
      for (const document of treatment.documents || []) {
        ordonnances[document._id] = {
          ...document,
          type: document.type ?? 'document', // or 'folder'
          linkedItem: {
            _id: treatment._id,
            type: 'treatment',
          },
        } as DocumentWithLinkedItem;
      }
    }

    const consultationsDocs: Record<string, DocumentWithLinkedItem | FolderWithLinkedItem> = {};
    for (const consultation of personConsultations) {
      if (!!consultation?.onlyVisibleBy?.length) {
        if (!consultation.onlyVisibleBy.includes(user._id)) continue;
      }
      for (const document of consultation.documents || []) {
        consultationsDocs[document._id] = {
          ...document,
          type: document.type ?? 'document', // or 'folder'
          linkedItem: {
            _id: consultation._id,
            type: 'consultation',
          },
        };
      }
    }

    const otherDocs: Record<string, DocumentWithLinkedItem | FolderWithLinkedItem> = {};
    if (medicalFile) {
      for (const document of medicalFile?.documents || []) {
        otherDocs[document._id] = {
          ...document,
          type: document.type ?? 'document', // or 'folder'
          linkedItem: {
            _id: medicalFile._id,
            type: 'medical-file',
          },
        };
      }
    }
    return [...Object.values(ordonnances), ...Object.values(consultationsDocs), ...Object.values(otherDocs)].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [personConsultations, medicalFile, treatments, user._id]);

  return (
    <DocumentsModule
      showPanel
      initialRootStructure={['medical-file', 'consultation', 'treatment']}
      documents={allMedicalDocuments}
      color="blue-900"
      title={`Documents médicaux de ${person.name} (${allMedicalDocuments.length})`}
      personId={person._id}
      onDeleteDocument={async (documentOrFolder) => {
        if (documentOrFolder.type === 'document') {
          const document = documentOrFolder as DocumentWithLinkedItem;
          await API.delete({ path: document.downloadPath ?? `/person/${person._id}/document/${document.file.filename}` });
        }
        if (documentOrFolder.linkedItem.type === 'treatment') {
          const treatment = allTreatments.find((t) => t._id === documentOrFolder.linkedItem._id);
          if (!treatment) return false;
          const treatmentResponse = await API.put({
            path: `/treatment/${treatment._id}`,
            body: prepareTreatmentForEncryption({
              ...treatment,
              documents: treatment.documents.filter((d) => d._id !== documentOrFolder._id),
            }),
          });
          if (treatmentResponse.ok) {
            const newTreatment = treatmentResponse.decryptedData;
            setAllTreatments((allTreatments) =>
              allTreatments.map((t) => {
                if (t._id === treatment._id) return newTreatment;
                return t;
              })
            );
            toast.success('Document supprimé');
            return true;
          } else {
            toast.error('Erreur lors de la suppression du document, vous pouvez contactez le support');
            capture('Error while deleting treatment document', { treatment, document });
          }
        }
        if (documentOrFolder.linkedItem.type === 'consultation') {
          const consultation = allConsultations.find((c) => c._id === documentOrFolder.linkedItem._id);
          if (!consultation) return false;
          const consultationResponse = await API.put({
            path: `/consultation/${consultation._id}`,
            body: prepareConsultationForEncryption(organisation.consultations)({
              ...consultation,
              documents: consultation.documents.filter((d) => d._id !== documentOrFolder._id),
            }),
          });
          if (consultationResponse.ok) {
            const newConsultation = consultationResponse.decryptedData;
            setAllConsultations((allConsultations) =>
              allConsultations.map((c) => {
                if (c._id === consultation._id) return newConsultation;
                return c;
              })
            );
            toast.success('Document supprimé');
            return true;
          } else {
            toast.error('Erreur lors de la suppression du document, vous pouvez contactez le support');
            capture('Error while deleting consultation document', { consultation, document });
          }
        }
        if (documentOrFolder.linkedItem.type === 'medical-file') {
          if (!medicalFile?._id) return false;
          const medicalFileResponse = await API.put({
            path: `/medical-file/${medicalFile._id}`,
            body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
              ...medicalFile,
              documents: medicalFile.documents.filter((d) => d._id !== documentOrFolder._id),
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
            return true;
          } else {
            toast.error('Erreur lors de la suppression du document, vous pouvez contactez le support');
            capture('Error while deleting medical file document', { medicalFile, document });
          }
        }
        return false;
      }}
      onSubmitDocument={async (documentOrFolder) => {
        if (documentOrFolder.linkedItem.type === 'treatment') {
          const treatment = allTreatments.find((t) => t._id === documentOrFolder.linkedItem._id);
          if (!treatment) return;
          const treatmentResponse = await API.put({
            path: `/treatment/${treatment._id}`,
            body: prepareTreatmentForEncryption({
              ...treatment,
              documents: treatment.documents.map((d) => {
                if (d._id === documentOrFolder._id) {
                  // remove linkedItem from document
                  const { linkedItem, ...rest } = documentOrFolder;
                  const document = rest as Document | Folder;
                  return document;
                }
                return d;
              }),
            }),
          });
          if (treatmentResponse.ok) {
            const newTreatment = treatmentResponse.decryptedData;
            setAllTreatments((allTreatments) =>
              allTreatments.map((t) => {
                if (t._id === treatment._id) return newTreatment;
                return t;
              })
            );
            toast.success('Document mis à jour');
          } else {
            toast.error('Erreur lors de la mise à jour du document, vous pouvez contactez le support');
            capture('Error while updating treatment document', { treatment, document });
          }
        }
        if (documentOrFolder.linkedItem.type === 'consultation') {
          const consultation = allConsultations.find((c) => c._id === documentOrFolder.linkedItem._id);
          if (!consultation) return;
          const consultationResponse = await API.put({
            path: `/consultation/${consultation._id}`,
            body: prepareConsultationForEncryption(organisation.consultations)({
              ...consultation,
              documents: consultation.documents.map((d) => {
                if (d._id === documentOrFolder._id) {
                  // remove linkedItem from document
                  const { linkedItem, ...rest } = documentOrFolder;
                  const document = rest as Document | Folder;
                  return document;
                }
                return d;
              }),
            }),
          });
          if (consultationResponse.ok) {
            const newConsultation = consultationResponse.decryptedData;
            setAllConsultations((allConsultations) =>
              allConsultations.map((c) => {
                if (c._id === consultation._id) return newConsultation;
                return c;
              })
            );
            toast.success('Document mis à jour');
          } else {
            toast.error('Erreur lors de la mise à jour du document, vous pouvez contactez le support');
            capture('Error while updating consultation document', { consultation, document });
          }
        }
        if (documentOrFolder.linkedItem.type === 'medical-file') {
          if (!medicalFile?._id) return;
          const medicalFileResponse = await API.put({
            path: `/medical-file/${medicalFile._id}`,
            body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
              ...medicalFile,
              documents: medicalFile.documents.map((d) => {
                if (d._id === documentOrFolder._id) {
                  // remove linkedItem from document
                  const { linkedItem, ...rest } = documentOrFolder;
                  const document = rest as Document | Folder;
                  return document;
                }
                return d;
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
            toast.success('Document mis à jour');
          } else {
            toast.error('Erreur lors de la mise à jour du document, vous pouvez contactez le support');
            capture('Error while updating medical file document', { medicalFile, document });
          }
        }
      }}
      onSaveNewOrder={async (nextDocuments, type) => {
        try {
          const groupedById: any = {};
          for (const document of nextDocuments) {
            if (!groupedById[document.linkedItem._id]) groupedById[document.linkedItem._id] = [];
            groupedById[document.linkedItem._id].push(document);
          }
          if (!type) throw new Error('Type is required');
          if (type === 'treatment') {
            const treatmentsToUpdate = await Promise.all(
              Object.keys(groupedById)
                .map((treatmentId) => {
                  const treatment = allTreatments.find((t) => t._id === treatmentId);
                  if (!treatment) throw new Error('Treatment not found');
                  return prepareTreatmentForEncryption({
                    ...treatment,
                    documents: groupedById[treatmentId],
                  });
                })
                .map(encryptItem)
            );
            const treatmentsResponse = await API.put({
              path: '/treatment/documents-reorder',
              body: treatmentsToUpdate,
            });
            if (treatmentsResponse.ok) {
              toast.success('Documents mis à jour');
              refresh();
              return true;
            } else {
              toast.error('Erreur lors de la mise à jour des documents, vous pouvez contactez le support');
              capture('Error while updating treatment documents order', { nextDocuments, type });
            }
            return false;
          }
          if (type === 'consultation') {
            const consultationsToUpdate = await Promise.all(
              Object.keys(groupedById)
                .map((consultationId) => {
                  const consultation = allConsultations.find((c) => c._id === consultationId);
                  if (!consultation) throw new Error('Consultation not found');
                  const nextConsultation = prepareConsultationForEncryption(organisation.consultations)({
                    ...consultation,
                    documents: groupedById[consultationId],
                  });
                  return nextConsultation;
                })
                .map(encryptItem)
            );
            console.log({ consultationsToUpdate });
            const consultationsResponse = await API.put({
              path: '/consultation/documents-reorder',
              body: consultationsToUpdate,
            });
            if (consultationsResponse.ok) {
              toast.success('Documents mis à jour');
              refresh();
              return true;
            } else {
              toast.error('Erreur lors de la mise à jour des documents, vous pouvez contactez le support');
              capture('Error while updating consultation documents order', { nextDocuments, type });
            }
            return false;
          }
          if (type === 'medical-file') {
            if (!medicalFile?._id) throw new Error('Medical file not found');
            const medicalFileResponse = await API.put({
              path: `/medical-file/${medicalFile._id}`,
              body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
                ...medicalFile,
                documents: groupedById[medicalFile._id],
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
              toast.success('Documents mis à jour');
              return true;
            } else {
              toast.error('Erreur lors de la mise à jour des documents, vous pouvez contactez le support');
              capture('Error while updating medical file documents reorder', { nextDocuments, type });
            }
            return false;
          }
          return false;
        } catch (e) {
          toast.error('Erreur lors de la mise à jour des documents, vous pouvez contactez le support');
          capture('Error while updating documents order', { nextDocuments, type });
        }
        return false;
      }}
      onAddDocuments={async (nextDocuments) => {
        if (!medicalFile?._id) return;
        const medicalFileResponse = await API.put({
          path: `/medical-file/${medicalFile._id}`,
          body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
            ...medicalFile,
            documents: [...(medicalFile.documents || []), ...nextDocuments],
          }),
        });
        if (medicalFileResponse.ok) {
          if (nextDocuments.filter((d) => d.type === 'document').length > 1) toast.success('Documents enregistrés !');
          if (nextDocuments.filter((d) => d.type === 'folder').length > 0) toast.success('Dossier créé !');
          setAllMedicalFiles((allMedicalFiles) =>
            allMedicalFiles.map((m) => {
              if (m._id === medicalFile._id) return medicalFileResponse.decryptedData;
              return m;
            })
          );
        }
      }}
    />
  );
};

export default PersonDocumentsMedical;
