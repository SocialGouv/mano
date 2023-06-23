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
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const [allMedicalFiles, setAllMedicalFiles] = useRecoilState(medicalFileState);

  const medicalFile = useMemo(() => (allMedicalFiles || []).find((m) => m.person === person._id), [allMedicalFiles, person._id]);
  const commentsMedical = useMemo(
    () => [...(person?.commentsMedical || [])].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [person]
  );

  return (
    <div className="tw-relative">
      <CommentsModule
        comments={commentsMedical}
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
