import React, { useMemo, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { Input, Col, Row, FormGroup, Label } from 'reactstrap';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import ExclamationMarkButton from '../../../components/tailwind/ExclamationMarkButton';
import TagTeam from '../../../components/TagTeam';
import { currentTeamState, organisationState, userState, usersState } from '../../../recoil/auth';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../../components/tailwind/Modal';
import { formatDateTimeWithNameOfDay } from '../../../services/date';
import SelectUser from '../../../components/SelectUser';
import CommentModal from './CommentModal';
import { FullScreenIcon } from './FullScreenIcon';
import API from '../../../services/api';
import DatePicker from '../../../components/DatePicker';
import { outOfBoundariesDate } from '../../../services/date';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../../components/tailwind/Modal';

export function CommentsPanel({ person }) {
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

export function CommentsTable({ comments, setCommentToEdit }) {
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
}

function CommentModal({ comment = {}, isNewComment, onClose, person }) {
  const user = useRecoilValue(userState);
  const groups = useRecoilValue(groupsState);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const setComments = useSetRecoilState(commentsState);

  const canToggleGroupCheck = useMemo(
    () => !!organisation.groupsEnabled && !!person._id && groups.find((group) => group.persons.includes(person._id)),
    [groups, person._id, organisation.groupsEnabled]
  );

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

            if (isNewComment) {
              const response = await API.post({
                path: '/comment',
                body: prepareCommentForEncryption({ ...commentBody, person: person._id }),
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
                body: prepareCommentForEncryption({ ...commentBody, person: person._id }),
              });
              if (response.ok) {
                toast.success('Commentaire enregistré');
                setComments((comments) => comments.map((c) => (c._id === comment._id ? response.decryptedData : c)));
              } else {
                toast.error(response.error);
              }
            }

            actions.setSubmitting(false);
            window.sessionStorage.removeItem('currentComment');
            onClose();
          }}>
          {({ values, handleChange, isSubmitting, handleSubmit }) => (
            <React.Fragment>
              <ModalBody className="tw-px-4 tw-py-2">
                <Row>
                  {!isNewComment && (
                    <>
                      <Col md={6}>
                        <FormGroup>
                          <Label htmlFor="user">Créé par</Label>
                          <SelectUser
                            inputId="user"
                            isDisabled={isNewComment}
                            value={values.user || user._id}
                            onChange={(userId) => handleChange({ target: { value: userId, name: 'user' } })}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label htmlFor="date">Créé le / Concerne le</Label>
                          <div>
                            <DatePicker
                              required
                              withTime
                              id="date"
                              defaultValue={(values.date || values.createdAt) ?? new Date()}
                              onChange={handleChange}
                            />
                          </div>
                        </FormGroup>
                      </Col>
                    </>
                  )}
                  <Col md={12}>
                    <FormGroup>
                      <Label htmlFor="comment">Commentaire</Label>
                      <Input
                        id="comment"
                        name="comment"
                        type="textarea"
                        value={values.comment || ''}
                        onChange={(e) => {
                          window.sessionStorage.setItem('currentComment', e.target.value);
                          handleChange(e);
                        }}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={canToggleGroupCheck ? 6 : 12}>
                    <FormGroup>
                      <Label htmlFor="create-comment-urgent">
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
                      </Label>
                    </FormGroup>
                  </Col>
                  {!!canToggleGroupCheck && (
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="create-comment-for-group">
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
                        </Label>
                      </FormGroup>
                    </Col>
                  )}
                </Row>
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
                      await API.delete({ path: `/comment/${comment._id}` });
                      setComments((comments) => comments.filter((c) => c._id !== comment._id));
                      toast.success('Commentaire supprimé !');
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
