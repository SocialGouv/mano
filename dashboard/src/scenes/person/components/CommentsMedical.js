import React, { useMemo } from 'react';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../../../recoil/medicalFiles';
import { CommentsModule } from '../../../components/CommentsGeneric';
import API from '../../../services/api';

const CommentsMedical = ({ person }) => {
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const setAllMedicalFiles = useSetRecoilState(medicalFileState);

  const medicalFile = person.medicalFile;
  const commentsMedical = useMemo(
    () => [...(person?.commentsMedical || [])].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [person]
  );

  console.log('commentsMedical', commentsMedical);
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
          console.log('comment', comment, isNewComment);
          console.log('medicalFile', medicalFile);
          const newMedicalFile = {
            ...medicalFile,
            comments: isNewComment
              ? [{ ...comment, _id: uuidv4() }, ...(medicalFile.comments || [])]
              : medicalFile.comments.map((c) => {
                  if (c._id === comment._id) {
                    console.log('FOUND IT', c._id);
                    return comment;
                  }
                  return c;
                }),
          };
          // optimistic UI
          console.log('newMedicalFile', newMedicalFile);
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
          console.log('response', response.decryptedData);
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
