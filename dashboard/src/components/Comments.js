import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Input, Button as CloseButton, Col, Row, FormGroup, Label } from 'reactstrap';
import { toast } from 'react-toastify';

import ButtonCustom from '../components/ButtonCustom';
import UserName from './UserName';
import SelectUser from './SelectUser';
import { theme } from '../config';
import Loading from './loading';
import { Formik } from 'formik';
import { currentTeamState, organisationState, userState } from '../recoil/auth';
import { commentsState, prepareCommentForEncryption } from '../recoil/comments';
import { selectorFamily, useRecoilValue, useSetRecoilState } from 'recoil';
import { formatDateTimeWithNameOfDay, outOfBoundariesDate } from '../services/date';
import API from '../services/api';
import ExclamationMarkButton from './tailwind/ExclamationMarkButton';
import { useDataLoader } from './DataLoader';
import useCreateReportAtDateIfNotExist from '../services/useCreateReportAtDateIfNotExist';
import { useParams } from 'react-router-dom';
import { itemsGroupedByActionSelector, itemsGroupedByPersonSelector } from '../recoil/selectors';
import { groupsState } from '../recoil/groups';
import DatePicker from './DatePicker';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';

const commentsByActionOrPersonSelector = selectorFamily({
  key: 'commentsByActionOrPersonSelector',
  get:
    ({ personId, actionId }) =>
    ({ get }) => {
      if (personId) {
        const persons = get(itemsGroupedByPersonSelector);
        const person = persons[personId];
        return [...(person?.comments || [])].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      }
      if (actionId) {
        const actions = get(itemsGroupedByActionSelector);
        const action = actions[actionId];
        return [...(action?.comments || [])].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      }
      return [];
    },
});

const Comments = ({ onUpdateResults }) => {
  const { personId, actionId } = useParams();
  const [editingId, setEditing] = useState(null);
  const [clearNewCommentKey, setClearNewCommentKey] = useState(null);

  const setComments = useSetRecoilState(commentsState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);
  const { isLoading } = useDataLoader();
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const comments = useRecoilValue(commentsByActionOrPersonSelector({ personId, actionId }));

  useEffect(() => {
    if (!!onUpdateResults) onUpdateResults(comments.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments.length]);

  const deleteData = async (id) => {
    const confirm = window.confirm('Voulez-vous vraiment supprimer ce commentaire ?');
    if (!confirm) return false;
    const res = await API.delete({ path: `/comment/${id}` });
    if (res.ok) setComments((comments) => comments.filter((p) => p._id !== id));
    if (!res.ok) return false;
    toast.success('Suppression réussie');
    return true;
  };

  const addData = async ({ comment, urgent, group }) => {
    const commentBody = {
      comment,
      urgent,
      group,
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
    toast.success('Commentaire ajouté !');
    await createReportAtDateIfNotExist(response.decryptedData.date);
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
      await createReportAtDateIfNotExist(response.decryptedData.date || response.decryptedData.createdAt);
    }
    if (!response.ok) return;
    toast.success('Commentaire mis à jour');
    setEditing(null);
  };

  return (
    <React.Fragment>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col md={4}>
          <Title>Commentaires</Title>
        </Col>
      </Row>
      {!comments.length && !!isLoading ? (
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
                  {!!organisation.groupsEnabled && !!comment.group && (
                    <span className="tw-text-3xl tw-not-italic" aria-label="Action familiale" title="Action familiale">
                      👪
                    </span>
                  )}
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
          {!!isLoading && <Loading />}
        </>
      )}
      <EditingComment
        commentId={editingId}
        value={comments.find((c) => c._id === editingId)}
        onSubmit={updateData}
        onCancel={() => setEditing(null)}
        onDelete={deleteData}
      />
    </React.Fragment>
  );
};

const EditingComment = ({ value = {}, commentId, onSubmit, onCancel, onDelete, newComment }) => {
  const user = useRecoilValue(userState);
  const { personId } = useParams();
  const groups = useRecoilValue(groupsState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(commentId);
  }, [commentId]);

  const onCancelRequest = () => {
    setOpen(false);
    if (onCancel) onCancel();
  };
  const canToggleGroupCheck = useMemo(
    () => !!organisation.groupsEnabled && !!personId && groups.find((group) => group.persons.includes(personId)),
    [groups, personId, organisation.groupsEnabled]
  );

  return (
    <>
      {!!newComment && (
        <div>
          <ButtonCustom title="＋ Ajouter un commentaire" onClick={() => setOpen(true)} style={{ marginBottom: 20 }} />
        </div>
      )}
      <ModalContainer
        open={!!open}
        onClose={() => {
          window.sessionStorage.removeItem('currentComment');
          onCancelRequest();
        }}
        size="lg">
        <ModalHeader toggle={onCancelRequest} title={newComment ? 'Créer un commentaire' : 'Éditer le commentaire'} />
        <Formik
          initialValues={{
            urgent: false,
            group: false,
            ...value,
            comment: value.comment || window.sessionStorage.getItem('currentComment'),
          }}
          onSubmit={async (body, actions) => {
            if (!body.user && !newComment) return toast.error("L'utilisateur est obligatoire");
            if (!body.date && !newComment) return toast.error('La date est obligatoire');
            if (!body.comment) return toast.error('Le commentaire est obligatoire');
            if (body.date && outOfBoundariesDate(body.date)) return toast.error('La date est hors limites (entre 1900 et 2100)');

            await onSubmit({ ...value, ...body, team: body.team ?? value.team ?? currentTeam._id });
            actions.setSubmitting(false);
            window.sessionStorage.removeItem('currentComment');
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => {
            return (
              <React.Fragment>
                <ModalBody className="tw-px-4 tw-py-2">
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
                              <DatePicker withTime id="date" defaultValue={(values.date || values.createdAt) ?? new Date()} onChange={handleChange} />
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
                      onCancelRequest();
                    }}>
                    Annuler
                  </button>
                  {!newComment && (
                    <button
                      type="button"
                      className="button-destructive"
                      disabled={isSubmitting}
                      onClick={async () => {
                        const isDeleted = await onDelete(commentId);
                        if (isDeleted) {
                          window.sessionStorage.removeItem('currentComment');
                          onCancelRequest();
                        }
                      }}>
                      Supprimer
                    </button>
                  )}
                  <button type="submit" className="button-submit" onClick={handleSubmit} disabled={isSubmitting}>
                    Enregistrer
                  </button>
                </ModalFooter>
              </React.Fragment>
            );
          }}
        </Formik>
      </ModalContainer>
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
    overflow-x: auto;
    p {
      margin-left: 16px;
      margin-top: 0;
      margin-bottom: 0;
    }
    ${(props) => props.urgent && 'background-color: #fecaca99;'}
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
