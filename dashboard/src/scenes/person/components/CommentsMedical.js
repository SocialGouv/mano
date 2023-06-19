import React, { useMemo, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import ConsultationModal from '../../../components/ConsultationModal';
import { medicalFileState } from '../../../recoil/medicalFiles';
import { arrayOfitemsGroupedByConsultationSelector } from '../../../recoil/selectors';
import { treatmentsState } from '../../../recoil/treatments';
import TreatmentModal from './TreatmentModal';
import { CommentsModule } from '../../../components/CommentsGeneric';

const CommentsMedical = ({ person }) => {
  const allConsultations = useRecoilValue(arrayOfitemsGroupedByConsultationSelector);
  const allTreatments = useRecoilValue(treatmentsState);
  const [allMedicalFiles, setAllMedicalFiles] = useRecoilState(medicalFileState);
  const [consultation, setConsultation] = useState(false);
  const [treatment, setTreatment] = useState(false);

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
    const otherComments = medicalFile?.comments || [];
    return [...treatmentsComments, ...consultationsComments, ...otherComments].sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );
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
        typeForNewComment="medical-file"
        color="blue-900"
        showPanel
        onDeleteComment={(comment) => {
          setAllMedicalFiles((medicalFiles) => {
            return medicalFiles.map((_medicalFile) => {
              if (_medicalFile._id !== medicalFile._id) return _medicalFile;
              return {
                ..._medicalFile,
                comments: _medicalFile.comments.filter((c) => c._id !== comment._id),
              };
            });
          });
        }}
        onSubmitComment={(comment, isNewComment) => {
          setAllMedicalFiles((medicalFiles) => {
            return medicalFiles.map((_medicalFile) => {
              if (_medicalFile._id !== medicalFile._id) return _medicalFile;
              return {
                ..._medicalFile,
                comments: isNewComment
                  ? [{ ...comment, _id: uuidv4() }, ...(_medicalFile.comments || [])]
                  : _medicalFile.comments.map((c) => (c._id === comment._id ? comment : c)),
              };
            });
          });
        }}
      />
    </div>
  );
};

export default CommentsMedical;
