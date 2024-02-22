import React, { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useHistory, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import ExclamationMarkButton from './tailwind/ExclamationMarkButton';
import TagTeam from './TagTeam';
import { currentTeamState, organisationState, userState, usersState } from '../recoil/auth';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';
import { dayjsInstance, formatDateTimeWithNameOfDay } from '../services/date';
import SelectUser from './SelectUser';
import { FullScreenIcon } from '../assets/icons/FullScreenIcon';
import DatePicker from './DatePicker';
import { outOfBoundariesDate } from '../services/date';
import AutoResizeTextarea from './AutoresizeTextArea';
import UserName from './UserName';
import CustomFieldDisplay from './CustomFieldDisplay';

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
 * @param {String} props.typeForNewComment (person|action|passage|rencontre|medical-file|consultation|treatment)
 * @param {String} props.personId
 * @param {String} props.actionId
 * @param {Boolean} props.showPanel
 * @param {Boolean} props.canToggleGroupCheck
 * @param {Boolean} props.canToggleUrgentCheck
 * @param {Function} props.onDeleteComment
 * @param {Function} props.onSubmitComment
 * @param {String} props.color (main|blue-900)
 */

export function CommentsModule({
  comments = [],
  title = 'Commentaires',
  typeForNewComment, // person|action|passage|rencontre|medical-file|consultation|treatment
  personId = null,
  actionId = null,
  showPanel = false,
  canToggleGroupCheck = false,
  canToggleUrgentCheck = false,
  onDeleteComment,
  onSubmitComment,
  color = 'main', // main|blue-900
}) {
  if (!typeForNewComment) throw new Error('typeForNewComment is required');
  if (!onDeleteComment) throw new Error('onDeleteComment is required');
  if (!onSubmitComment) throw new Error('onSubmitComment is required');
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [commentToDisplay, setCommentToDisplay] = useState(null);
  const [commentToEdit, setCommentToEdit] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <>
      {!!showPanel ? (
        <div className="tw-relative">
          <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-bg-white tw-p-3 tw-shadow-sm">
            <h4 className="tw-flex-1 tw-text-xl">Commentaires {comments.length ? `(${comments.length})` : ''}</h4>
            <div className="flex-col tw-flex tw-items-center tw-gap-2">
              <button
                aria-label="Ajouter un commentaire"
                className={`tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-${color} tw-font-bold tw-text-white tw-transition hover:tw-scale-125`}
                onClick={() => setModalCreateOpen(true)}>
                ＋
              </button>
              {Boolean(comments.length) && (
                <button
                  title="Passer les commentaires en plein écran"
                  className={`tw-h-6 tw-w-6 tw-rounded-full tw-text-${color} tw-transition hover:tw-scale-125`}
                  onClick={() => setFullScreen(true)}>
                  <FullScreenIcon />
                </button>
              )}
            </div>
          </div>
          <CommentsTable
            withClickableLabel
            comments={comments}
            color={color}
            onDisplayComment={setCommentToDisplay}
            onEditComment={setCommentToEdit}
            onAddComment={() => setModalCreateOpen(true)}
          />
        </div>
      ) : (
        <CommentsTable
          showAddCommentButton
          comments={comments}
          color={color}
          onDisplayComment={setCommentToDisplay}
          onEditComment={setCommentToEdit}
          onAddComment={() => setModalCreateOpen(true)}
        />
      )}
      {!!modalCreateOpen && (
        <CommentModal
          isNewComment={true}
          onClose={() => setModalCreateOpen(false)}
          onDelete={onDeleteComment}
          onSubmit={onSubmitComment}
          typeForNewComment={typeForNewComment}
          canToggleGroupCheck={canToggleGroupCheck}
          canToggleUrgentCheck={canToggleUrgentCheck}
          personId={personId}
          actionId={actionId}
          color={color}
        />
      )}
      {!!commentToEdit && (
        <CommentModal
          comment={commentToEdit}
          isNewComment={false}
          onClose={() => setCommentToEdit(null)}
          onDelete={onDeleteComment}
          onSubmit={onSubmitComment}
          typeForNewComment={typeForNewComment}
          canToggleGroupCheck={canToggleGroupCheck}
          canToggleUrgentCheck={canToggleUrgentCheck}
          personId={personId}
          actionId={actionId}
          color={color}
        />
      )}
      {!!commentToDisplay && (
        <CommentDisplay
          comment={commentToDisplay}
          onClose={() => setCommentToDisplay(null)}
          onEditComment={() => {
            setCommentToDisplay(null);
            setCommentToEdit(commentToDisplay);
          }}
          canToggleGroupCheck={canToggleGroupCheck}
          canToggleUrgentCheck={canToggleUrgentCheck}
          color={color}
        />
      )}
      <CommentsFullScreen
        open={!!fullScreen}
        comments={comments}
        onDisplayComment={setCommentToDisplay}
        onAddComment={() => setModalCreateOpen(true)}
        onClose={() => setFullScreen(false)}
        title={title}
        color={color}
      />
    </>
  );
}

function CommentsFullScreen({ open, comments, onClose, title, color, onDisplayComment, onAddComment }) {
  return (
    <ModalContainer open={open} size="prose" onClose={onClose}>
      <ModalHeader title={title} />
      <ModalBody>
        <CommentsTable comments={comments} onDisplayComment={onDisplayComment} onAddComment={onAddComment} withClickableLabel color={color} />
      </ModalBody>
      <ModalFooter>
        <button type="button" name="cancel" className="button-cancel" onClick={onClose}>
          Fermer
        </button>
        <button type="button" className={`button-submit !tw-bg-${color}`} onClick={onAddComment}>
          ＋ Ajouter un commentaire
        </button>
      </ModalFooter>
    </ModalContainer>
  );
}

function CommentsTable({ comments, onDisplayComment, onEditComment, onAddComment, color, showAddCommentButton, withClickableLabel }) {
  const users = useRecoilValue(usersState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const history = useHistory();
  const location = useLocation();

  if (!comments.length) {
    return (
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-6">
        <div className="tw-mt-8 tw-mb-2 tw-w-full tw-text-center tw-text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="tw-mx-auto tw-h-16 tw-w-16 tw-text-gray-200"
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
        <button type="button" className={`button-submit !tw-bg-${color}`} onClick={onAddComment}>
          ＋ Ajouter un commentaire
        </button>
      </div>
    );
  }

  return (
    <>
      {showAddCommentButton && (
        <div className="tw-my-1.5 tw-flex tw-justify-center tw-self-center">
          <button type="button" className={`button-submit !tw-bg-${color}`} onClick={onAddComment}>
            ＋ Ajouter un commentaire
          </button>
        </div>
      )}
      <table className="table">
        <tbody className="small">
          {(comments || []).map((comment, i) => {
            if (!comment.type) throw new Error('type is required');
            return (
              <tr key={comment._id} className={[`tw-bg-${color} tw-w-full`, i % 2 ? 'tw-bg-opacity-0' : 'tw-bg-opacity-5'].join(' ')}>
                <td
                  onClick={() => {
                    const searchParams = new URLSearchParams(location.search);
                    switch (comment.type) {
                      case 'action':
                      case 'person':
                      case 'medical-file':
                        onDisplayComment(comment);
                        break;
                      case 'passage':
                        history.push(`/person/${comment.person}?passageId=${comment.passage}`);
                        break;
                      case 'rencontre':
                        history.push(`/person/${comment.person}?rencontreId=${comment.rencontre}`);
                        break;
                      case 'consultation':
                        if (searchParams.get('consultationId') === comment.consultation._id) {
                          if (comment.user === user._id) onEditComment(comment);
                          break;
                        }
                        searchParams.set('consultationId', comment.consultation._id);
                        history.push(`?${searchParams.toString()}`);
                        break;
                      case 'treatment':
                        if (searchParams.get('treatmentId') === comment.treatment._id) {
                          if (comment.user === user._id) onEditComment(comment);
                          break;
                        }
                        searchParams.set('treatmentId', comment.treatment._id);
                        history.push(`?${searchParams.toString()}`);
                        break;
                      default:
                        break;
                    }
                  }}>
                  <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-prose tw-flex-col tw-gap-2 tw-overflow-hidden">
                    <div className="tw-mb-4 tw-flex tw-items-center tw-align-middle">
                      {!!comment.urgent && <ExclamationMarkButton className="tw-mr-4" />}
                      <div className="tw-text-xs tw-opacity-50">{formatDateTimeWithNameOfDay(comment.date || comment.createdAt)}</div>
                    </div>
                    <div className="tw-flex tw-w-full tw-flex-shrink tw-items-start">
                      {!!organisation.groupsEnabled && !!comment.group && (
                        <span className="tw-mr-2 tw-text-xl" aria-label="Commentaire familial" title="Commentaire familial">
                          👪
                        </span>
                      )}
                      <div className="[overflow-wrap:anywhere]">
                        {(comment.comment || '').split('\n').map((e, i) => (
                          <p key={e + i} className="tw-mb-0">
                            {e}
                          </p>
                        ))}
                      </div>
                      {!!withClickableLabel && ['treatment', 'consultation', 'action', 'passage', 'rencontre'].includes(comment.type) && (
                        <button
                          type="button"
                          className="tw-ml-auto tw-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            const searchParams = new URLSearchParams(location.search);
                            switch (comment.type) {
                              case 'action':
                                searchParams.set('actionId', comment.action);
                                history.push(`?${searchParams.toString()}`);
                                break;
                              case 'person':
                                history.push(`/person/${comment.person}`);
                                break;
                              case 'passage':
                                history.push(`/person/${comment.person}?passageId=${comment.passage}`);
                                break;
                              case 'rencontre':
                                history.push(`/person/${comment.person}?rencontreId=${comment.rencontre}`);
                                break;
                              case 'consultation':
                                searchParams.set('consultationId', comment.consultation._id);
                                history.push(`?${searchParams.toString()}`);
                                break;
                              case 'treatment':
                                searchParams.set('treatmentId', comment.treatment._id);
                                history.push(`?${searchParams.toString()}`);
                                break;
                              case 'medical-file':
                                history.push(`/person/${comment.person}?tab=Dossier+Médical`);
                                break;
                              default:
                                break;
                            }
                          }}>
                          <div className="tw-rounded tw-border tw-border-blue-900 tw-bg-blue-900/10 tw-px-1">
                            {comment.type === 'treatment' && 'Traitement'}
                            {comment.type === 'consultation' && 'Consultation'}
                            {comment.type === 'action' && 'Action'}
                            {comment.type === 'passage' && 'Passage'}
                            {comment.type === 'rencontre' && 'Rencontre'}
                          </div>
                        </button>
                      )}
                    </div>
                    <div className="small tw-flex tw-items-end tw-justify-between">
                      <p className="tw-mb-0 tw-basis-1/2 tw-opacity-50">Créé par {users.find((e) => e._id === comment.user)?.name}</p>
                      <div className="tw-max-w-fit tw-basis-1/2">
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

function CommentDisplay({ comment, onClose, onEditComment, canToggleUrgentCheck, canToggleGroupCheck, color = 'main' }) {
  const user = useRecoilValue(userState);

  const isEditable = useMemo(() => {
    if (comment.user === user?._id) return true;
    return false;
  }, [comment, user]);

  return (
    <>
      <ModalContainer open size="3xl">
        <ModalHeader toggle={onClose} title="Commentaire" />
        <ModalBody className="tw-px-4 tw-py-2">
          <div className="tw-flex tw-w-full tw-flex-col tw-gap-6">
            <div className="tw-my-2 tw-flex tw-gap-8">
              <div className="tw-basis-1/2 [overflow-wrap:anywhere]">
                <div className="tw-text-sm tw-font-semibold tw-text-gray-600">Créé par</div>
                <UserName id={comment.user} />
              </div>
              <div className="tw-basis-1/2 [overflow-wrap:anywhere]">
                <div className="tw-text-sm tw-font-semibold tw-text-gray-600">Créé le / Concerne le</div>
                <div>
                  <CustomFieldDisplay type="date" value={comment.date || comment.createdAt} />
                </div>
              </div>
            </div>
            <div className="tw-flex tw-flex-1 tw-flex-col">
              <div className="tw-basis-full [overflow-wrap:anywhere]">
                <div className="tw-text-sm tw-font-semibold tw-text-gray-600">Commentaire</div>
                <div>
                  <CustomFieldDisplay type="textarea" value={comment.comment} />
                </div>
              </div>
            </div>
            {(!!canToggleUrgentCheck || !!canToggleGroupCheck) && (
              <div className="tw-flex tw-gap-8">
                {!!canToggleUrgentCheck && !!comment.urgent && (
                  <div className="tw-flex tw-flex-1 tw-flex-col">
                    <label htmlFor="create-comment-urgent">
                      Commentaire prioritaire <br />
                      <small className="text-muted">Ce commentaire sera mis en avant par rapport aux autres</small>
                    </label>
                  </div>
                )}
                {!!canToggleGroupCheck && (
                  <div className="tw-flex tw-flex-1 tw-flex-col">
                    <label htmlFor="create-comment-for-group">
                      <input type="checkbox" className="tw-mr-2" id="create-comment-for-group" name="group" checked={comment.group} disabled />
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
              onClose();
            }}>
            Fermer
          </button>
          <button type="submit" onClick={onEditComment} className={`button-submit !tw-bg-${color}`} disabled={!isEditable}>
            Modifier
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
}

function CommentModal({
  comment = {},
  isNewComment,
  onClose,
  onDelete,
  onSubmit,
  canToggleGroupCheck,
  canToggleUrgentCheck,
  typeForNewComment,
  actionId,
  personId,
  color,
}) {
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);

  const isEditable = useMemo(() => {
    if (isNewComment) return true;
    if (comment.user === user?._id) return true;
    return false;
  }, [comment.user, isNewComment, user]);

  return (
    <>
      <ModalContainer
        open
        onClose={() => {
          window.sessionStorage.removeItem('currentComment');
          onClose();
        }}
        size="3xl">
        <ModalHeader toggle={onClose} title={isNewComment ? 'Créer un commentaire' : 'Éditer le commentaire'} />
        <Formik
          initialValues={{ urgent: false, group: false, ...comment, comment: comment.comment || window.sessionStorage.getItem('currentComment') }}
          onSubmit={async (body, actions) => {
            if (!body.date && !isNewComment) return toast.error('La date est obligatoire');
            if (!body.comment) return toast.error('Le commentaire est obligatoire');
            if (!isNewComment && (!body.date || outOfBoundariesDate(body.date)))
              return toast.error('La date de création est hors limites (entre 1900 et 2100)');

            const commentBody = {
              comment: body.comment,
              urgent: body.urgent || false,
              group: body.group || false,
              user: user._id,
              date: body.date || new Date(),
              team: body.team || currentTeam._id,
              organisation: organisation._id,
              type: comment.type ?? typeForNewComment,
              action: actionId ?? body.action,
              person: personId ?? body.person,
            };

            if (comment._id) commentBody._id = comment._id;
            if (commentBody.type === 'action' && !commentBody.action) throw new Error('action is required');
            if (commentBody.type === 'person' && !commentBody.person) throw new Error('person is required');
            if (!isNewComment && comment.user !== user._id) {
              commentBody.comment = `${commentBody.comment}\n\nModifié par ${user.name} le ${dayjsInstance().format('DD/MM/YYYY à HH:mm')}`;
            }

            await onSubmit(commentBody, isNewComment);

            actions.setSubmitting(false);
            window.sessionStorage.removeItem('currentComment');
            onClose();
          }}>
          {({ values, handleChange, isSubmitting, handleSubmit }) => (
            <React.Fragment>
              <ModalBody className="tw-px-4 tw-py-2">
                <div className="tw-flex tw-w-full tw-flex-col tw-gap-6">
                  <div className="tw-flex tw-gap-8">
                    <div className="tw-flex tw-flex-1 tw-flex-col">
                      <label htmlFor="user">Créé par</label>
                      <SelectUser
                        inputId="user"
                        isDisabled={true}
                        value={values.user || user._id}
                        onChange={(userId) => handleChange({ target: { value: userId, name: 'user' } })}
                      />
                    </div>
                    <div className="tw-flex tw-flex-1 tw-flex-col">
                      <label htmlFor="date">Créé le / Concerne le</label>
                      <DatePicker
                        required
                        withTime
                        disabled={!isEditable}
                        id="date"
                        defaultValue={(values.date || values.createdAt) ?? new Date()}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="tw-flex tw-flex-1 tw-flex-col">
                    <label htmlFor="comment">Commentaire</label>
                    <div className="tw-block tw-w-full tw-overflow-hidden tw-rounded tw-border tw-border-gray-300 tw-text-base tw-transition-all">
                      <AutoResizeTextarea
                        id="comment"
                        name="comment"
                        placeholder="Tapez votre commentaire ici..."
                        value={values.comment || ''}
                        rows={7}
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
                    disabled={isSubmitting || !isEditable}
                    onClick={async () => {
                      if (!window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return;
                      window.sessionStorage.removeItem('currentComment');
                      await onDelete(comment);
                      onClose();
                    }}>
                    Supprimer
                  </button>
                )}
                <button type="submit" onClick={handleSubmit} className={`button-submit !tw-bg-${color}`} disabled={isSubmitting}>
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
