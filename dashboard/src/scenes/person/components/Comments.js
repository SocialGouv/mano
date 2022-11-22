import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import ExclamationMarkButton from '../../../components/ExclamationMarkButton';
import TagTeam from '../../../components/TagTeam';
import { usersState } from '../../../recoil/auth';
import { formatDateTimeWithNameOfDay } from '../../../services/date';
import CommentModal from './CommentModal';

export default function Comments({ person }) {
  const users = useRecoilValue(usersState);
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [commentToEdit, setCommentToEdit] = useState(null);
  const comments = useMemo(
    () => [...(person?.comments || [])].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [person]
  );
  return (
    <div className="tw-relative">
      {modalCreateOpen && <CommentModal isNewComment={true} person={person} onClose={() => setModalCreateOpen(false)} />}
      {modalEditOpen && <CommentModal comment={commentToEdit} person={person} isNewComment={false} onClose={() => setModalEditOpen(false)} />}
      <div className="tw-sticky tw-top-0 tw-z-50 tw-flex tw-bg-white tw-p-3">
        <h4 className="tw-flex-1">Commentaires</h4>
        <div>
          <button
            className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-main tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
            onClick={() => setModalCreateOpen(true)}>
            ＋
          </button>
        </div>
      </div>

      {!comments.length && <div className="tw-mt-8 tw-w-full tw-text-center tw-text-gray-300">Aucun commentaire</div>}

      <table className="table table-striped">
        <tbody className="small">
          {(comments || []).map((comment) => {
            return (
              <tr>
                <td
                  onClick={() => {
                    setModalEditOpen(true);
                    setCommentToEdit(comment);
                  }}>
                  <div className="tw-mb-4 tw-flex tw-items-center tw-align-middle">
                    {!!comment.urgent && <ExclamationMarkButton className="tw-mr-4" />}
                    <div className="tw-text-xs">{formatDateTimeWithNameOfDay(comment.date || comment.createdAt)}</div>
                  </div>
                  <div style={{ overflowWrap: 'anywhere' }}>
                    {(comment.comment || '').split('\n').map((e) => (
                      <p>{e}</p>
                    ))}
                  </div>
                  <div className="small">Créé par {users.find((e) => e._id === comment.user)?.name}</div>
                  <div>
                    <TagTeam teamId={comment.team} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
