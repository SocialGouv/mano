import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import ExclamationMarkButton from './tailwind/ExclamationMarkButton';
import TagTeam from './TagTeam';
import { currentTeamState, organisationState, userState, usersState } from '../recoil/auth';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';
import { formatDateTimeWithNameOfDay } from '../services/date';
import SelectUser from './SelectUser';
import { FullScreenIcon } from '../scenes/person/components/FullScreenIcon';
import DatePicker from './DatePicker';
import { outOfBoundariesDate } from '../services/date';
import AutoResizeTextarea from './AutoresizeTextArea';

/*
3 components:
- CommentsPanel for Person Summary / Person Medical File
- CommentsTable when
  - expanding the CommentsPanel (full screen)
  - reading a Consultation/Treatment/Action
- CommentModal for creating/editing a comment

*/

/**
 * @param {Object} props
 * @param {Array} props.comments
 * @param {String} props.title
 * @param {Boolean} props.showPanel
 * @param {Boolean} props.canToggleGroupCheck
 * @param {Boolean} props.canToggleUrgentCheck
 * @param {Function} props.onDeleteComment
 * @param {Function} props.onSubmitComment
 */

export function CommentsModule({
  comments = [],
  title = 'Commentaires',
  type, // 'person' | 'action' | 'passage' | 'rencontre' | 'medicalfile' | 'consultation' | 'treatment'
  person = null,
  action = null,
  showPanel = false,
  canToggleGroupCheck = false,
  canToggleUrgentCheck = false,
  onDeleteComment,
  onSubmitComment,
}) {
  if (!onDeleteComment) throw new Error('onDeleteComment is required');
  if (!onSubmitComment) throw new Error('onSubmitComment is required');
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [commentToEdit, setCommentToEdit] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <>
      {!!showPanel ? (
        <div className="tw-relative">
          <div className="tw-sticky tw-top-0 tw-z-50 tw-flex tw-bg-white tw-p-3">
            <h4 className="tw-flex-1 tw-text-xl">Commentaires {comments.length ? `(${comments.length})` : ''}</h4>
            <div className="flex-col tw-flex tw-items-center tw-gap-2">
              <button
                aria-label="Ajouter un commentaire"
                className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-main tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
                onClick={() => setModalCreateOpen(true)}>
                ＋
              </button>
              {Boolean(comments.length) && (
                <button className="tw-h-6 tw-w-6 tw-rounded-full tw-text-main tw-transition hover:tw-scale-125" onClick={() => setFullScreen(true)}>
                  <FullScreenIcon />
                </button>
              )}
            </div>
          </div>
          <CommentsTable comments={comments} onEditComment={setCommentToEdit} onAddComment={() => setModalCreateOpen(true)} />
        </div>
      ) : (
        <CommentsTable showAddCommentButton comments={comments} onEditComment={setCommentToEdit} onAddComment={() => setModalCreateOpen(true)} />
      )}
      {!!modalCreateOpen && (
        <CommentModal
          isNewComment={true}
          onClose={() => setModalCreateOpen(false)}
          onDelete={onDeleteComment}
          onSubmit={onSubmitComment}
          canToggleGroupCheck={canToggleGroupCheck}
          canToggleUrgentCheck={canToggleUrgentCheck}
          type={type}
          person={person}
          action={action}
        />
      )}
      {!!commentToEdit && (
        <CommentModal
          comment={commentToEdit}
          isNewComment={false}
          onClose={() => setCommentToEdit(null)}
          onDelete={onDeleteComment}
          onSubmit={onSubmitComment}
          canToggleGroupCheck={canToggleGroupCheck}
          canToggleUrgentCheck={canToggleUrgentCheck}
          type={type}
          person={person}
          action={action}
        />
      )}
      <CommentsFullScreen
        open={!!fullScreen}
        comments={comments}
        onEditComment={setCommentToEdit}
        onAddComment={() => setModalCreateOpen(true)}
        onClose={() => setFullScreen(false)}
        title={title}
      />
    </>
  );
}

export function CommentsFullScreen({ open, comments, onClose, title, onEditComment, onAddComment }) {
  return (
    <ModalContainer open={open} size="full" onClose={onClose}>
      <ModalHeader title={title} />
      <ModalBody>
        <CommentsTable comments={comments} onEditComment={onEditComment} onAddComment={onAddComment} />
      </ModalBody>
      <ModalFooter>
        <button type="button" name="cancel" className="button-cancel" onClick={onClose}>
          Fermer
        </button>
        <button type="button" className="button-submit" onClick={onAddComment}>
          ＋ Ajouter un commentaire
        </button>
      </ModalFooter>
    </ModalContainer>
  );
}

export function CommentsTable({ comments, onEditComment, onAddComment, showAddCommentButton }) {
  const users = useRecoilValue(usersState);
  const organisation = useRecoilValue(organisationState);

  if (!comments.length) {
    return (
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-6">
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
          Aucun commentaire pour le moment
        </div>
        <button type="button" className="button-submit" onClick={onAddComment}>
          ＋ Ajouter un commentaire
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="tw-my-1.5 tw-flex tw-justify-center">
        <button type="button" className="button-submit" onClick={onAddComment}>
          ＋ Ajouter un commentaire
        </button>
      </div>
      <table className="table table-striped">
        <tbody className="small">
          {(comments || []).map((comment) => {
            if (!comment.type) throw new Error('type is required');
            if (comment.type === 'person' && !comment.person) throw new Error('person is required');
            if (comment.type === 'action' && !comment.action) throw new Error('action is required');
            return (
              <tr key={comment._id}>
                <td
                  onClick={() => {
                    onEditComment(comment);
                  }}>
                  <div className="tw-flex tw-items-center tw-justify-between">
                    <div className="tw-flex tw-flex-col tw-gap-2">
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
                    </div>
                    <div className="tw-flex tw-gap-2">
                      {comment.type && (
                        <div>
                          <div className="tw-rounded tw-border tw-border-blue-900 tw-bg-blue-900/10 tw-px-1">
                            {comment.type === 'treatment' && 'Traitement'}
                            {comment.type === 'consultation' && 'Consultation'}
                            {comment.type === 'action' && 'Action'}
                            {comment.type === 'passage' && 'Passage'}
                            {comment.type === 'rencontre' && 'Rencontre'}
                          </div>
                        </div>
                      )}
                      <div className="tw-max-w-fit">
                        <TagTeam teamId={comment.team} />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function CommentModal({ comment = {}, isNewComment, onClose, onDelete, onSubmit, canToggleGroupCheck, canToggleUrgentCheck, type, action, person }) {
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);

  return (
    <>
      <ModalContainer
        open
        onClose={() => {
          window.sessionStorage.removeItem('currentComment');
          onClose();
        }}
        size="lg">
        <ModalHeader toggle={onClose} title={isNewComment ? 'Créer un commentaire' : 'Éditer le commentaire'} />
        <Formik
          initialValues={{ urgent: false, group: false, ...comment, comment: comment.comment || window.sessionStorage.getItem('currentComment') }}
          onSubmit={async (body, actions) => {
            if (!body.user && !isNewComment) return toast.error("L'utilisateur est obligatoire");
            if (!body.date && !isNewComment) return toast.error('La date est obligatoire');
            if (!body.comment) return toast.error('Le commentaire est obligatoire');
            if (!isNewComment && (!body.date || outOfBoundariesDate(body.date)))
              return toast.error('La date de création est hors limites (entre 1900 et 2100)');

            const commentBody = {
              comment: body.comment,
              urgent: body.urgent || false,
              group: body.group || false,
              user: body.user || user._id,
              date: body.date || new Date(),
              team: body.team || currentTeam._id,
              organisation: organisation._id,
            };

            if (comment._id) commentBody._id = comment._id;
            if (action) commentBody.action = action;
            if (person) commentBody.person = person;
            if (type) commentBody.type = type;

            await onSubmit(commentBody, isNewComment);

            actions.setSubmitting(false);
            window.sessionStorage.removeItem('currentComment');
            onClose();
          }}>
          {({ values, handleChange, isSubmitting, handleSubmit }) => (
            <React.Fragment>
              <ModalBody className="tw-px-4 tw-py-2">
                <div className="tw-flex tw-w-full tw-flex-col tw-gap-6">
                  {!isNewComment && (
                    <div className="tw-flex tw-gap-8">
                      <div className="tw-flex tw-flex-1 tw-flex-col">
                        <label htmlFor="user">Créé par</label>
                        <SelectUser
                          inputId="user"
                          isDisabled={isNewComment}
                          value={values.user || user._id}
                          onChange={(userId) => handleChange({ target: { value: userId, name: 'user' } })}
                        />
                      </div>
                      <div className="tw-flex tw-flex-1 tw-flex-col">
                        <label htmlFor="date">Créé le / Concerne le</label>
                        <DatePicker
                          required
                          withTime
                          id="date"
                          defaultValue={(values.date || values.createdAt) ?? new Date()}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}
                  <div className="tw-flex tw-flex-1 tw-flex-col">
                    <label htmlFor="comment">Commentaire</label>
                    <div className="tw-block tw-w-full tw-overflow-hidden tw-rounded tw-border tw-border-gray-300 tw-text-base tw-transition-all">
                      <AutoResizeTextarea
                        id="comment"
                        name="comment"
                        placeholder="Tapez votre commentaire ici..."
                        value={values.comment || ''}
                        rows={3}
                        onChange={(e) => {
                          window.sessionStorage.setItem('currentComment', e.target.value);
                          handleChange(e);
                        }}
                      />
                    </div>
                  </div>
                  {(!!canToggleUrgentCheck || !!canToggleGroupCheck) && (
                    <div className="tw-flex tw-gap-8">
                      {!!canToggleUrgentCheck && (
                        <div className="tw-flex tw-flex-1 tw-flex-col">
                          <label htmlFor="create-comment-urgent">
                            <input
                              type="checkbox"
                              id="create-comment-urgent"
                              className="tw-mr-2"
                              name="urgent"
                              checked={values.urgent}
                              onChange={handleChange}
                            />
                            Commentaire prioritaire <br />
                            <small className="text-muted">Ce commentaire sera mis en avant par rapport aux autres</small>
                          </label>
                        </div>
                      )}
                      {!!canToggleGroupCheck && (
                        <div className="tw-flex tw-flex-1 tw-flex-col">
                          <label htmlFor="create-comment-for-group">
                            <input
                              type="checkbox"
                              className="tw-mr-2"
                              id="create-comment-for-group"
                              name="group"
                              checked={values.group}
                              onChange={handleChange}
                            />
                            Commentaire familial <br />
                            <small className="text-muted">Ce commentaire sera valable pour chaque membre de la famille</small>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <button
                  type="button"
                  name="cancel"
                  className="button-cancel"
                  onClick={() => {
                    window.sessionStorage.removeItem('currentComment');
                    onClose();
                  }}>
                  Annuler
                </button>
                {!isNewComment && (
                  <button
                    type="button"
                    className="button-destructive"
                    disabled={isSubmitting}
                    onClick={async () => {
                      if (!window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return;
                      window.sessionStorage.removeItem('currentComment');
                      await onDelete();
                      onClose();
                    }}>
                    Supprimer
                  </button>
                )}
                <button type="submit" onClick={handleSubmit} className="button-submit" disabled={isSubmitting}>
                  Enregistrer
                </button>
              </ModalFooter>
            </React.Fragment>
          )}
        </Formik>
      </ModalContainer>
    </>
  );
}
