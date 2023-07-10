import { useMemo } from 'react';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { organisationState, userState } from '../../../recoil/auth';
import { consultationsState, prepareConsultationForEncryption } from '../../../recoil/consultations';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../../../recoil/medicalFiles';
import { arrayOfitemsGroupedByConsultationSelector } from '../../../recoil/selectors';
import { prepareTreatmentForEncryption, treatmentsState } from '../../../recoil/treatments';
import API from '../../../services/api';
import { capture } from '../../../services/sentry';
import { DocumentsModule } from '../../../components/DocumentsGeneric';

const PersonDocumentsMedical = ({ person }) => {
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);

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
          linkedItem: {
            item: treatment,
            type: 'treatment',
          },
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
          linkedItem: {
            item: consultation,
            type: 'consultation',
          },
        };
      }
    }

    const otherDocs = {};
    for (const document of medicalFile?.documents || []) {
      otherDocs[document._id] = {
        ...document,
        linkedItem: {
          item: medicalFile,
          type: 'medical-file',
        },
      };
    }
    return [...Object.values(ordonnances), ...Object.values(consultationsDocs), ...Object.values(otherDocs)].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [personConsultations, medicalFile, treatments, user._id]);

  const documents = allMedicalDocuments;

  return (
    <DocumentsModule
      showPanel
      documents={documents}
      color="blue-900"
      personId={person._id}
      onDeleteDocument={async (document) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
        await API.delete({ path: document.downloadPath ?? `/person/${document.person ?? person._id}/document/${document.file.filename}` });

        if (document.linkedItem.type === 'treatment') {
          const treatment = document.linkedItem.item;
          const treatmentResponse = await API.put({
            path: `/treatment/${treatment._id}`,
            body: prepareTreatmentForEncryption({
              ...treatment,
              documents: treatment.documents.map((d) => d._id !== document._id),
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
          } else {
            toast.error('Erreur lors de la suppression du document, vous pouvez contactez le support');
            capture('Error while deleting treatment document', { treatment, document });
          }
        }
        if (document.linkedItem.type === 'consultation') {
          const consultation = document.linkedItem.item;

          const consultationResponse = await API.put({
            path: `/consultation/${consultation._id}`,
            body: prepareConsultationForEncryption(organisation.consultations)({
              ...consultation,
              documents: consultation.documents.filter((d) => d._id !== document._id),
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
          } else {
            toast.error('Erreur lors de la suppression du document, vous pouvez contactez le support');
            capture('Error while deleting consultation document', { consultation, document });
          }
        }
        if (document.linkedItem.type === 'medical-file') {
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
      }}
      onSubmitDocument={async (document) => {
        if (document.linkedItem.type === 'treatment') {
          const treatment = document.linkedItem.item;
          const treatmentResponse = await API.put({
            path: `/treatment/${treatment._id}`,
            body: prepareTreatmentForEncryption({
              ...treatment,
              documents: treatment.documents.map((d) => {
                if (d._id === document._id) return document;
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
        if (document.linkedItem.type === 'consultation') {
          const consultation = document.linkedItem.item;

          const consultationResponse = await API.put({
            path: `/consultation/${consultation._id}`,
            body: prepareConsultationForEncryption(organisation.consultations)({
              ...consultation,
              documents: consultation.documents.map((d) => {
                if (d._id === document._id) return document;
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
        if (document.linkedItem.type === 'medical-file') {
          const medicalFileResponse = await API.put({
            path: `/medical-file/${medicalFile._id}`,
            body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
              ...medicalFile,
              documents: medicalFile.documents.map((d) => {
                if (d._id === document._id) return document;
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
      onAddDocuments={async (documents) => {
        const medicalFileResponse = await API.put({
          path: `/medical-file/${medicalFile._id}`,
          body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
            ...medicalFile,
            documents: [...(medicalFile.documents || []), ...documents],
          }),
        });
        if (medicalFileResponse.ok) {
          toast.success('Documents enregistrés !');
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
