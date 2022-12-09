import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import ExclamationMarkButton from '../../../components/tailwind/ExclamationMarkButton';
import TagTeam from '../../../components/TagTeam';
import { organisationState, usersState } from '../../../recoil/auth';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../../components/tailwind/Modal';
import { formatDateTimeWithNameOfDay } from '../../../services/date';
import CommentModal from './CommentModal';

export default function Comments({ person }) {
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [commentToEdit, setCommentToEdit] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);
  const comments = useMemo(
    () => [...(person?.comments || [])].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [person]
  );

  return (
    <>
      <div className="tw-relative">
        <div className="tw-sticky tw-top-0 tw-z-50 tw-flex tw-bg-white tw-p-3">
          <h4 className="tw-flex-1">Commentaires {comments.length ? `(${comments.length})` : ''}</h4>
          <div className="flex-col tw-flex tw-items-center tw-gap-2">
            <button
              aria-label="Ajouter un commentaire"
              className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-main tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
              onClick={() => setModalCreateOpen(true)}>
              ＋
            </button>
            {Boolean(comments.length) && (
              <button className="tw-h-6 tw-w-6 tw-rounded-full tw-text-main tw-transition hover:tw-scale-125" onClick={() => setFullScreen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path
                    fillRule="evenodd"
                    d="M15 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.56l-3.97 3.97a.75.75 0 11-1.06-1.06l3.97-3.97h-2.69a.75.75 0 01-.75-.75zm-12 0A.75.75 0 013.75 3h4.5a.75.75 0 010 1.5H5.56l3.97 3.97a.75.75 0 01-1.06 1.06L4.5 5.56v2.69a.75.75 0 01-1.5 0v-4.5zm11.47 11.78a.75.75 0 111.06-1.06l3.97 3.97v-2.69a.75.75 0 011.5 0v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h2.69l-3.97-3.97zm-4.94-1.06a.75.75 0 010 1.06L5.56 19.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 011.5 0v2.69l3.97-3.97a.75.75 0 011.06 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {!comments.length && (
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
              <path d="M3 20l1.3 -3.9a9 8 0 1 1 3.4 2.9l-4.7 1"></path>
              <line x1={12} y1={12} x2={12} y2="12.01"></line>
              <line x1={8} y1={12} x2={8} y2="12.01"></line>
              <line x1={16} y1={12} x2={16} y2="12.01"></line>
            </svg>
            Aucun commentaire
          </div>
        )}
        <ModalContainer open={!!fullScreen} size="full" onClose={() => setFullScreen(false)}>
          <ModalHeader title={`Commentaires de  ${person?.name} (${comments.length})`}></ModalHeader>
          <ModalBody>
            <CommentsTable comments={comments} setCommentToEdit={setCommentToEdit} />
          </ModalBody>
          <ModalFooter>
            <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
              Fermer
            </button>
            <button type="button" className="button-submit" onClick={() => setModalCreateOpen(true)}>
              ＋ Ajouter un commentaire
            </button>
          </ModalFooter>
        </ModalContainer>
        <CommentsTable comments={comments} setCommentToEdit={setCommentToEdit} />
      </div>
      {!!modalCreateOpen && <CommentModal isNewComment={true} person={person} onClose={() => setModalCreateOpen(false)} />}
      {!!commentToEdit && <CommentModal comment={commentToEdit} person={person} isNewComment={false} onClose={() => setCommentToEdit(null)} />}
    </>
  );
}

const CommentsTable = ({ comments, setCommentToEdit }) => {
  const users = useRecoilValue(usersState);
  const organisation = useRecoilValue(organisationState);

  return (
    <table className="table table-striped">
      <tbody className="small">
        {(comments || []).map((comment) => {
          return (
            <tr key={comment._id}>
              <td
                onClick={() => {
                  setCommentToEdit(comment);
                }}>
                <div className="tw-mb-4 tw-flex tw-items-center tw-align-middle">
                  {!!comment.urgent && <ExclamationMarkButton className="tw-mr-4" />}
                  <div className="tw-text-xs">{formatDateTimeWithNameOfDay(comment.date || comment.createdAt)}</div>
                </div>
                <div className="tw-flex tw-items-start">
                  {!!organisation.groupsEnabled && !!comment.group && (
                    <span className="tw-mr-2 tw-text-xl" aria-label="Commentaire familial" title="Commentaire familial">
                      👪
                    </span>
                  )}
                  <div className="tw-break-words">
                    {(comment.comment || '').split('\n').map((e, i) => (
                      <p key={e + i}>{e}</p>
                    ))}
                  </div>
                </div>
                <div className="small">Créé par {users.find((e) => e._id === comment.user)?.name}</div>
                <div className="tw-max-w-fit">
                  <TagTeam teamId={comment.team} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
