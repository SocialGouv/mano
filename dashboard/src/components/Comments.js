import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Modal, Input, Button as CloseButton, Col, Row, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap';
import { toastr } from 'react-redux-toastr';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import Box from './Box';
import ButtonCustom from '../components/ButtonCustom';
import UserName from './UserName';
import SelectUser from './SelectUser';
import { theme } from '../config';
import Loading from './loading';
import { Formik } from 'formik';
import { currentTeamState, organisationState, userState } from '../recoil/auth';
import { commentsState, prepareCommentForEncryption } from '../recoil/comments';
import { useRecoilState, useRecoilValue } from 'recoil';
import { formatDateTimeWithNameOfDay, dateForDatePicker } from '../services/date';
import { loadingState } from './Loader';
import useApi from '../services/api';
import ExclamationMarkButton from './ExclamationMarkButton';

const Comments = ({ personId = '', actionId = '', onUpdateResults }) => {
  const [editingId, setEditing] = useState(null);
  const [clearNewCommentKey, setClearNewCommentKey] = useState(null);
  const API = useApi();
  const [allComments, setComments] = useRecoilState(commentsState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);

  const loading = useRecoilValue(loadingState);

  const comments = useMemo(
    () =>
      allComments.filter((c) => {
        if (!!personId) return c.person === personId;
        if (!!actionId) return c.action === actionId;
        return false;
      }),
    [personId, actionId, allComments]
  );

  useEffect(() => {
    if (!!onUpdateResults) onUpdateResults(comments.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments.length]);

  const deleteData = async (id) => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await API.delete({ path: `/comment/${id}` });
      if (res.ok) setComments((comments) => comments.filter((p) => p._id !== id));
      if (!res.ok) return;
      toastr.success('Suppression réussie');
    }
  };

  const addData = async ({ comment, urgent }) => {
    const commentBody = {
      comment,
      urgent,
      user: user._id,
      date: new Date(),
      team: currentTeam._id,
      organisation: organisation._id,
    };
    if (!!personId) commentBody.person = personId;
    if (!!actionId) commentBody.action = actionId;

    const response = await API.post({ path: '/comment', body: prepareCommentForEncryption(commentBody) });
    if (!response.ok) return;
    setComments((comments) => [response.decryptedData, ...comments]);
    toastr.success('Commentaire ajouté !');
    setClearNewCommentKey((k) => k + 1);
  };

  const updateData = async (comment) => {
    const response = await API.put({
      path: `/comment/${comment._id}`,
      body: prepareCommentForEncryption(comment),
    });
    if (response.ok) {
      setComments((comments) =>
        comments.map((c) => {
          if (c._id === comment._id) return response.decryptedData;
          return c;
        })
      );
    }
    if (!response.ok) return;
    toastr.success('Commentaire mis-à-jour');
    setEditing(null);
  };

  return (
    <React.Fragment>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col md={4}>
          <Title>Commentaires</Title>
        </Col>
      </Row>
      <Box>
        {!comments.length && !!loading ? (
          <Loading />
        ) : (
          <>
            <EditingComment key={clearNewCommentKey} onSubmit={addData} newComment />
            {comments.map((comment) => {
              return (
                <StyledComment key={comment._id} urgent={comment.urgent} onClick={() => setEditing(comment._id)}>
                  <CloseButton
                    close
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteData(comment._id);
                    }}
                  />
                  <UserName id={comment.user} wrapper={(name) => <div className="author">{name}</div>} />
                  <div className="user"></div>
                  <div className="time">{formatDateTimeWithNameOfDay(comment.date || comment.createdAt)}</div>
                  <div className="content">
                    {!!comment.urgent && <ExclamationMarkButton />}
                    <p>
                      {comment.comment
                        ? comment.comment.split('\n').map((c, i, a) => {
                            if (i === a.length - 1) return <React.Fragment key={i}>{c}</React.Fragment>;
                            return (
                              <React.Fragment key={i}>
                                {c}
                                <br />
                              </React.Fragment>
                            );
                          })
                        : ''}
                    </p>
                  </div>
                </StyledComment>
              );
            })}
            {!!loading && <Loading />}
          </>
        )}
      </Box>
      <EditingComment
        commentId={editingId}
        value={comments.find((c) => c._id === editingId)}
        onSubmit={updateData}
        onCancel={() => setEditing(null)}
      />
    </React.Fragment>
  );
};

const EditingComment = ({ value = {}, commentId, onSubmit, onCancel, newComment }) => {
  const user = useRecoilValue(userState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(commentId);
  }, [commentId]);

  const onCancelRequest = () => {
    setOpen(false);
    if (onCancel) onCancel();
  };

  return (
    <>
      {!!newComment && <ButtonCustom title="Ajouter un commentaire" onClick={() => setOpen(true)} style={{ marginBottom: 20 }} />}
      <Modal isOpen={!!open} toggle={onCancelRequest} size="lg">
        <ModalHeader toggle={onCancelRequest}>{newComment ? 'Créer un' : 'Éditer le'} commentaire</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ ...value, comment: value.comment || window.sessionStorage.getItem('currentComment') }}
            onSubmit={async (body, actions) => {
              if (!body.user && !newComment) return toastr.error('Erreur!', "L'utilisateur est obligatoire");
              if (!body.date && !newComment) return toastr.error('Erreur!', 'La date est obligatoire');
              if (!body.comment) return toastr.error('Erreur!', 'Le commentaire est obligatoire');
              await onSubmit({ ...value, ...body });
              actions.setSubmitting(false);
              window.sessionStorage.removeItem('currentComment');
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  {!newComment && (
                    <>
                      <Col md={6}>
                        <FormGroup>
                          <Label htmlFor="user">Créé par</Label>
                          <SelectUser
                            inputId="user"
                            isDisabled={newComment}
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
                        value={values.comment}
                        onChange={(e) => {
                          window.sessionStorage.setItem('currentComment', e.target.value);
                          handleChange(e);
                        }}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <FormGroup>
                      <Label htmlFor="create-comment-urgent">
                        <input
                          type="checkbox"
                          id="create-comment-urgent"
                          style={{ marginRight: '0.5rem' }}
                          name="urgent"
                          checked={values.urgent}
                          value={values.urgent}
                          onChange={() => handleChange({ target: { value: !values.urgent, name: 'urgent' } })}
                        />
                        Commentaire prioritaire <br />
                        <small className="text-muted">Ce commentaire sera mis en avant par rapport aux autres</small>
                      </Label>
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => !isSubmitting && handleSubmit()}
                  title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </>
  );
};

const Title = styled.h1`
  font-size: 20px;
  font-weight: 800;
`;

const StyledComment = styled.div`
  padding: 16px 0;
  border-top: 1px solid #cacaca;
  /* display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid #000; */

  &:hover {
    cursor: pointer;
  }
  .author {
    font-weight: bold;
    color: ${theme.main};
  }
  .content {
    margin-top: 8px;
    padding: 8px;
    border-radius: 1rem;
    font-style: italic;
    display: flex;
    align-items: center;
    p {
      margin-left: 16px;
      margin-top: 0;
      margin-bottom: 0;
    }
    ${(props) => props.urgent && 'background-color: #fecaca;'}
  }
  .time {
    font-size: 10px;
    color: #9b9999;
    font-style: italic;
  }
  .user {
    width: 50%;
  }
`;

export default Comments;
