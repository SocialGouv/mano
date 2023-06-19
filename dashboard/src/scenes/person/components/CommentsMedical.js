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
import { CommentsModule } from '../../../components/CommentsGeneric';

const CommentsMedical = ({ person }) => {
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

  const allMedicalComments = useMemo(() => {
    const treatmentsComments =
      treatments
        ?.map((treatment) => treatment.comments?.map((doc) => ({ ...doc, type: 'treatment', treatment })))
        .filter(Boolean)
        .flat() || [];
    const consultationsComments =
      personConsultations
        ?.map((consultation) => consultation.comments?.map((doc) => ({ ...doc, type: 'consultation', consultation })))
        .filter(Boolean)
        .flat() || [];
    const otherDocs = medicalFile?.comments || [];
    return [...treatmentsComments, ...consultationsComments, ...otherDocs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [personConsultations, medicalFile?.comments, treatments]);

  const comments = allMedicalComments;

  return (
    <div className="tw-relative">
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
      <CommentsModule
        comments={comments}
        showPanel
        onDeleteComment={(comment) => {
          handleChange({
            currentTarget: {
              value: values.comments.filter((c) => c._id !== comment._id),
              name: 'comments',
            },
          });
        }}
        onSubmitComment={(comment, isNewComment) => {
          handleChange({
            currentTarget: {
              value: isNewComment
                ? [...values.comments, { ...comment, _id: uuidv4() }]
                : values.comments.map((c) => (c._id === comment._id ? comment : c)),
              name: 'comments',
            },
          });
        }}
      />
    </div>
  );
};

export default CommentsMedical;
