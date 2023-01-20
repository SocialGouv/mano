import React, { useMemo } from 'react';
import { Input, Col, Row, FormGroup, Label } from 'reactstrap';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';

import ButtonCustom from '../../../components/ButtonCustom';
import SelectUser from '../../../components/SelectUser';
import { Formik } from 'formik';
import { currentTeamState, organisationState, userState } from '../../../recoil/auth';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { dateForDatePicker } from '../../../services/date';
import { commentsState, prepareCommentForEncryption } from '../../../recoil/comments';
import API from '../../../services/api';
import { groupsState } from '../../../recoil/groups';
import { ModalBody, ModalContainer, ModalHeader } from '../../../components/tailwind/Modal';

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
      <ModalContainer open onClose={onClose} size="lg">
        <ModalHeader toggle={onClose} title={isNewComment ? 'Créer un commentaire' : 'Éditer le commentaire'} />
        <ModalBody className="tw-px-4 tw-py-2">
          <Formik
            initialValues={{ urgent: false, group: false, ...comment, comment: comment.comment || window.sessionStorage.getItem('currentComment') }}
            onSubmit={async (body, actions) => {
              if (!body.user && !isNewComment) return toast.error("L'utilisateur est obligatoire");
              if (!body.date && !isNewComment) return toast.error('La date est obligatoire');
              if (!body.comment) return toast.error('Le commentaire est obligatoire');

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
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
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
                              locale="fr"
                              name="date"
                              id="date"
                              className="form-control"
                              selected={dateForDatePicker((values.date || values.createdAt) ?? new Date())}
                              onChange={(date) => handleChange({ target: { value: date, name: 'date' } })}
                              timeInputLabel="Heure :"
                              dateFormat="dd/MM/yyyy HH:mm"
                              showTimeInput
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
                <br />
                <div className="tw-flex tw-justify-end tw-gap-2">
                  {!isNewComment && (
                    <ButtonCustom
                      type="button"
                      color="danger"
                      disabled={isSubmitting}
                      onClick={async () => {
                        if (!window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return;
                        window.sessionStorage.removeItem('currentComment');
                        await API.delete({ path: `/comment/${comment._id}` });
                        setComments((comments) => comments.filter((c) => c._id !== comment._id));
                        toast.success('Commentaire supprimé !');
                        onClose();
                      }}
                      title="Supprimer"
                    />
                  )}
                  <ButtonCustom
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => !isSubmitting && handleSubmit()}
                    title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                  />
                </div>
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </ModalContainer>
    </>
  );
};

export default CommentModal;
