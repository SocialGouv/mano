import React from 'react';
import { Row, Col, FormGroup, Input, Label } from 'reactstrap';
import { useParams, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik } from 'formik';

import DatePicker from 'react-datepicker';

import SelectPerson from '../../components/SelectPerson';

import { SmallHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';

import ButtonCustom from '../../components/ButtonCustom';
import Comments from '../../components/Comments';
import styled from 'styled-components';
import UserName from '../../components/UserName';
import SelectStatus from '../../components/SelectStatus';
import SelectTeam from '../../components/SelectTeam';

import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import { CANCEL, DONE, actionsState, mappedIdsToLabels, prepareActionForEncryption, TODO } from '../../recoil/actions';
import { selectorFamily, useRecoilValue, useSetRecoilState } from 'recoil';
import { dateForDatePicker, dayjsInstance, now } from '../../services/date';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import useApi from '../../services/api';
import useTitle from '../../services/useTitle';
import { useDataLoader } from '../../components/DataLoader';
import useCreateReportAtDateIfNotExist from '../../services/useCreateReportAtDateIfNotExist';
import { itemsGroupedByActionSelector } from '../../recoil/selectors';
import ActionsCategorySelect from '../../components/tailwind/ActionsCategorySelect';

const actionByIdSelector = selectorFamily({
  key: 'actionByIdSelector',
  get:
    ({ actionId }) =>
    ({ get }) => {
      const actions = get(itemsGroupedByActionSelector);
      return actions[actionId];
    },
});

const View = () => {
  const { actionId } = useParams();
  const teams = useRecoilValue(teamsState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const action = useRecoilValue(actionByIdSelector({ actionId }));
  const setActions = useSetRecoilState(actionsState);
  const setComments = useSetRecoilState(commentsState);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const history = useHistory();
  const API = useApi();
  const { refresh } = useDataLoader();

  useTitle(`${action?.name} - Action`);

  if (!action) return <Loading />;

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const actionRes = await API.delete({ path: `/action/${action._id}` });
      if (actionRes.ok) {
        setActions((actions) => actions.filter((a) => a._id !== action._id));
        for (let comment of action.comments) {
          const commentRes = await API.delete({ path: `/comment/${comment._id}` });
          if (commentRes.ok) setComments((comments) => comments.filter((c) => c._id !== comment._id));
        }
      }
      if (!actionRes.ok) return;
      toast.success('Suppression réussie');
      history.goBack();
    }
  };

  const onDuplicate = async () => {
    const { name, person, dueAt, withTime, description, categories, urgent } = action;
    const response = await API.post({
      path: '/action',
      body: prepareActionForEncryption({
        name,
        person,
        team: currentTeam._id,
        user: user._id,
        dueAt,
        withTime,
        status: TODO,
        description,
        categories,
        urgent,
      }),
    });
    if (!response.ok) {
      return;
    }
    setActions((actions) => [response.decryptedData, ...actions]);
    for (let c of action.comments.filter((c) => c.action === action._id).filter((c) => !c.comment.includes('a changé le status'))) {
      const body = {
        comment: c.comment,
        action: response.decryptedData._id,
        user: c.user,
        team: c.team,
        organisation: c.organisation,
      };
      const res = await API.post({ path: '/comment', body: prepareCommentForEncryption(body) });
      if (res.ok) {
        setComments((comments) => [res.decryptedData, ...comments]);
      }
    }
    history.replace(`/action/${response.decryptedData._id}`);
  };

  return (
    <>
      <SmallHeaderWithBackButton refreshButton />
      <Title>
        {`${action?.name}`}
        <UserName id={action.user} wrapper={(name) => ` (créée par ${name})`} />
      </Title>
      <Formik
        initialValues={action}
        enableReinitialize
        onSubmit={async (body) => {
          const statusChanged = body.status && action.status !== body.status;
          if (statusChanged) {
            if ([DONE, CANCEL].includes(body.status)) {
              // When status changed to finished (done, cancel) completedAt we set it to dueAt if not set.
              body.completedAt = body.completedAt || body.dueAt;
            } else {
              // When status just changed to "todo" we set completedAt to null (since it's not done yet).
              body.completedAt = null;
            }
          }
          const actionResponse = await API.put({
            path: `/action/${body._id}`,
            body: prepareActionForEncryption(body),
          });
          if (actionResponse.ok) {
            const newAction = actionResponse.decryptedData;
            setActions((actions) =>
              actions.map((a) => {
                if (a._id === newAction._id) return newAction;
                return a;
              })
            );
            await createReportAtDateIfNotExist(newAction.createdAt);
            if (!!newAction.completedAt) {
              if (dayjsInstance(newAction.completedAt).format('YYYY-MM-DD') !== dayjsInstance(newAction.createdAt).format('YYYY-MM-DD')) {
                await createReportAtDateIfNotExist(newAction.completedAt);
              }
            }
            if (statusChanged) {
              const comment = {
                comment: `${user.name} a changé le status de l'action: ${mappedIdsToLabels.find((status) => status._id === newAction.status)?.name}`,
                action: action._id,
                team: currentTeam._id,
                user: user._id,
                organisation: organisation._id,
              };
              const commentResponse = await API.post({ path: '/comment', body: prepareCommentForEncryption(comment) });
              if (commentResponse.ok) setComments((comments) => [commentResponse.decryptedData, ...comments]);
            }
            toast.success('Mise à jour !');
            refresh();
            const actionCancelled = action.status !== CANCEL && body.status === CANCEL;
            if (actionCancelled && window.confirm('Cette action est annulée, voulez-vous la dupliquer ? Avec une date ultérieure par exemple')) {
              onDuplicate();
            }
          }
        }}>
        {({ values, handleChange, handleSubmit, isSubmitting }) => {
          return (
            <React.Fragment>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="name">Nom</Label>
                    <Input name="name" id="name" type="textarea" value={values.name} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <Label htmlFor="update-action-select-status">Statut</Label>
                  <SelectStatus
                    name="status"
                    value={values.status || ''}
                    onChange={handleChange}
                    inputId="update-action-select-status"
                    classNamePrefix="update-action-select-status"
                  />
                </Col>
                <Col md={3}>
                  <FormGroup>
                    <Label htmlFor="team">Sous l'équipe</Label>
                    <SelectTeam
                      teams={user.role === 'admin' ? teams : user.teams}
                      teamId={values.team}
                      inputId="team"
                      onChange={(team) => handleChange({ target: { value: team._id, name: 'team' } })}
                    />
                  </FormGroup>
                </Col>
                <Col md={4}>
                  <FormGroup>
                    <Label htmlFor="dueAt">À faire le</Label>
                    <div>
                      <DatePicker
                        id="dueAt"
                        locale="fr"
                        className="form-control"
                        selected={dateForDatePicker(values.dueAt ?? new Date())}
                        onChange={(date) => handleChange({ target: { value: date, name: 'dueAt' } })}
                        dateFormat={values.withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'}
                        showTimeInput={values.withTime}
                      />
                    </div>
                  </FormGroup>
                </Col>
                <Col md={4}>
                  <FormGroup>
                    <Label />
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                      <label htmlFor="withTime">Afficher l'heure</label>
                      <Input
                        type="checkbox"
                        id="withTime"
                        name="withTime"
                        checked={values.withTime || false}
                        onChange={() => {
                          handleChange({ target: { name: 'withTime', checked: Boolean(!values.withTime), value: Boolean(!values.withTime) } });
                        }}
                      />
                    </div>
                  </FormGroup>
                </Col>
                <Col md={4}>
                  {[DONE, CANCEL].includes(values.status) && (
                    <FormGroup>
                      {values.status === DONE && <Label htmlFor="completedAt">Faite le</Label>}
                      {values.status === CANCEL && <Label htmlFor="completedAt">Annulée le</Label>}
                      <div>
                        <DatePicker
                          id="completedAt"
                          locale="fr"
                          className="form-control"
                          selected={dateForDatePicker(values.completedAt ?? values.dueAt ?? new Date())}
                          onChange={(date) => handleChange({ target: { value: date, name: 'completedAt' } })}
                          timeInputLabel="Heure :"
                          dateFormat="dd/MM/yyyy HH:mm"
                          showTimeInput
                        />
                      </div>
                    </FormGroup>
                  )}
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <SelectPerson value={values.person} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <ActionsCategorySelect
                      values={values.categories}
                      id="categories"
                      label="Catégories"
                      onChange={(v) => handleChange({ currentTarget: { value: v, name: 'categories' } })}
                    />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label htmlFor="description">Description</Label>
                    <Input type="textarea" name="description" id="description" value={values.description} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label htmlFor="create-action-urgent">
                      <input
                        type="checkbox"
                        id="create-action-urgent"
                        style={{ marginRight: '0.5rem' }}
                        name="urgent"
                        checked={values.urgent}
                        onChange={() => {
                          handleChange({ target: { name: 'urgent', checked: Boolean(!values.urgent), value: Boolean(!values.urgent) } });
                        }}
                      />
                      Action prioritaire <br />
                      <small className="text-muted">Cette action sera mise en avant par rapport aux autres</small>
                    </Label>
                  </FormGroup>
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} />
                <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} />
              </div>
            </React.Fragment>
          );
        }}
      </Formik>
      <Comments />
    </>
  );
};

const Title = styled.h2`
  font-size: 20px;
  font-weight: 800;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  span {
    font-size: 16px;
    font-weight: 400;
    font-style: italic;
    display: block;
  }
`;

export default View;
