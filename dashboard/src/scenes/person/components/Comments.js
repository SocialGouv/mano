import { useMemo } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'react-toastify';
import { CommentsModule } from '../../../components/CommentsGeneric';
import { commentsState, prepareCommentForEncryption } from '../../../recoil/comments';
import API from '../../../services/api';
import { organisationState } from '../../../recoil/auth';
import { groupsState } from '../../../recoil/groups';

export default function Comments({ person }) {
  const organisation = useRecoilValue(organisationState);
  const groups = useRecoilValue(groupsState);
  const setComments = useSetRecoilState(commentsState);
  const comments = useMemo(
    () => [...(person?.comments || [])].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [person]
  );
  const canToggleGroupCheck = useMemo(
    () => !!organisation.groupsEnabled && !!person._id && groups.find((group) => group.persons.includes(person._id)),
    [groups, person._id, organisation.groupsEnabled]
  );

  return (
    <div className="tw-relative">
      <CommentsModule
        comments={comments}
        personId={person._id}
        typeForNewComment="person"
        canToggleGroupCheck={canToggleGroupCheck}
        canToggleUrgentCheck
        showPanel
        onDeleteComment={async (comment) => {
          window.sessionStorage.removeItem('currentComment');
          await API.delete({ path: `/comment/${comment._id}` });
          setComments((comments) => comments.filter((c) => c._id !== comment._id));
          toast.success('Commentaire supprimé !');
        }}
        onSubmitComment={async (comment, isNewComment) => {
          if (isNewComment) {
            const response = await API.post({
              path: '/comment',
              body: prepareCommentForEncryption(comment),
            });
            if (response.ok) {
              toast.success('Commentaire enregistré');
              setComments((comments) => [response.decryptedData, ...comments]);
            } else {
              toast.error(response.error);
            }
          } else {
            const response = await API.put({
              path: `/comment/${comment._id}`,
              body: prepareCommentForEncryption(comment),
            });
            if (response.ok) {
              toast.success('Commentaire enregistré');
              setComments((comments) => comments.map((c) => (c._id === comment._id ? response.decryptedData : c)));
            } else {
              toast.error(response.error);
            }
          }
        }}
      />
    </div>
  );
}
