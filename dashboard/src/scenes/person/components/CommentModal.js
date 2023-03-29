import React, { useMemo } from 'react';
import { Input, Col, Row, FormGroup, Label } from 'reactstrap';
import { toast } from 'react-toastify';

import SelectUser from '../../../components/SelectUser';
import { Formik } from 'formik';
import { currentTeamState, organisationState, userState } from '../../../recoil/auth';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { commentsState, prepareCommentForEncryption } from '../../../recoil/comments';
import API from '../../../services/api';
import { groupsState } from '../../../recoil/groups';
import DatePicker from '../../../components/DatePicker';
import { outOfBoundariesDate } from '../../../services/date';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../../components/tailwind/Modal';

const CommentModal = ({ comment = {}, isNewComment, onClose, person }) => {
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
};

export default CommentModal;
