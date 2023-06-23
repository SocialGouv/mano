import React, { useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../../../recoil/medicalFiles';
import { arrayOfitemsGroupedByConsultationSelector } from '../../../recoil/selectors';
import { treatmentsState } from '../../../recoil/treatments';
import { CommentsModule } from '../../../components/CommentsGeneric';
import { userState } from '../../../recoil/auth';
import API from '../../../services/api';

const CommentsMedical = ({ person }) => {
  const allConsultations = useRecoilValue(arrayOfitemsGroupedByConsultationSelector);
  const allTreatments = useRecoilValue(treatmentsState);
  const user = useRecoilValue(userState);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const [allMedicalFiles, setAllMedicalFiles] = useRecoilState(medicalFileState);

  const personConsultations = useMemo(() => (allConsultations || []).filter((c) => c.person === person._id), [allConsultations, person._id]);

  const treatments = useMemo(() => (allTreatments || []).filter((t) => t.person === person._id), [allTreatments, person._id]);

  const medicalFile = useMemo(() => (allMedicalFiles || []).find((m) => m.person === person._id), [allMedicalFiles, person._id]);

  const allMedicalComments = useMemo(() => {
    const treatmentsComments =
      treatments
        ?.map((treatment) => treatment.comments?.map((comment) => ({ ...comment, type: 'treatment', treatment, person })))
        .filter(Boolean)
        .flat() || [];
    const consultationsComments =
      personConsultations
        ?.filter((consultation) => {
          if (!consultation?.onlyVisibleBy?.length) return true;
          return consultation.onlyVisibleBy.includes(user._id);
        })
        .map((consultation) => consultation.comments?.map((comment) => ({ ...comment, type: 'consultation', consultation, person })))
        .filter(Boolean)
        .flat() || [];
    const otherComments = medicalFile?.comments?.map((comment) => ({ ...comment, type: 'medical-file', person })) || [];
    return [...treatmentsComments, ...consultationsComments, ...otherComments].sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );
  }, [personConsultations, medicalFile?.comments, treatments, user._id]);

  const comments = allMedicalComments;

  return (
    <div className="tw-relative">
      <CommentsModule
        comments={comments}
        typeForNewComment="medical-file"
        color="blue-900"
        showPanel
        onDeleteComment={async (comment) => {
          const newMedicalFile = {
            ...medicalFile,
            comments: medicalFile.comments.filter((c) => c._id !== comment._id),
          };
          // optimistic UI
          setAllMedicalFiles((medicalFiles) => {
            return medicalFiles.map((_medicalFile) => {
              if (_medicalFile._id !== medicalFile._id) return _medicalFile;
              return newMedicalFile;
            });
          });
          const response = await API.put({
            path: `/medical-file/${medicalFile._id}`,
            body: prepareMedicalFileForEncryption(customFieldsMedicalFile)(newMedicalFile),
          });
          if (!response.ok) return;
          setAllMedicalFiles((medicalFiles) => {
            return medicalFiles.map((_medicalFile) => {
              if (_medicalFile._id !== medicalFile._id) return _medicalFile;
              return response.decryptedData;
            });
          });
        }}
        onSubmitComment={async (comment, isNewComment) => {
          const newMedicalFile = {
            ...medicalFile,
            comments: isNewComment
              ? [{ ...comment, _id: uuidv4() }, ...(medicalFile.comments || [])]
              : medicalFile.comments.map((c) => (c._id === comment._id ? comment : c)),
          };
          // optimistic UI
          setAllMedicalFiles((medicalFiles) => {
            return medicalFiles.map((_medicalFile) => {
              if (_medicalFile._id !== medicalFile._id) return _medicalFile;
              return newMedicalFile;
            });
          });
          const response = await API.put({
            path: `/medical-file/${medicalFile._id}`,
            body: prepareMedicalFileForEncryption(customFieldsMedicalFile)(newMedicalFile),
          });
          if (!response.ok) return;
          setAllMedicalFiles((medicalFiles) => {
            return medicalFiles.map((_medicalFile) => {
              if (_medicalFile._id !== medicalFile._id) return _medicalFile;
              return response.decryptedData;
            });
          });
        }}
      />
    </div>
  );
};

export default CommentsMedical;
