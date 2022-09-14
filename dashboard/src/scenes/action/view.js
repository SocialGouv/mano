import React from 'react';
import { Row, Col, FormGroup, Input, Label } from 'reactstrap';
import { useParams, useHistory } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
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
import SelectCustom from '../../components/SelectCustom';
import SelectTeam from '../../components/SelectTeam';

import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import { CANCEL, DONE, actionsState, mappedIdsToLabels, prepareActionForEncryption } from '../../recoil/actions';
import { useRecoilState, useRecoilValue } from 'recoil';
import { dateForDatePicker, now } from '../../services/date';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import useApi from '../../services/api';
import useTitle from '../../services/useTitle';
import { useDataLoader } from '../../components/DataLoader';

const View = () => {
  const { id } = useParams();
  const teams = useRecoilValue(teamsState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const [actions, setActions] = useRecoilState(actionsState);
  const [comments, setComments] = useRecoilState(commentsState);

  const history = useHistory();
  const API = useApi();
  const { refresh } = useDataLoader();

  const action = actions.find((a) => a._id === id);

  useTitle(`${action?.name} - Action`);

  if (!action) return <Loading />;

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const actionRes = await API.delete({ path: `/action/${action._id}` });
      if (actionRes.ok) {
        setActions((actions) => actions.filter((a) => a._id !== action._id));
        for (let comment of comments.filter((c) => c.action === action._id)) {
          const commentRes = await API.delete({ path: `/comment/${comment._id}` });
          if (commentRes.ok) setComments((comments) => comments.filter((c) => c._id !== comment._id));
        }
      }
      if (!actionRes.ok) return;
      toastr.success('Suppression réussie');
      history.goBack();
    }
  };

  const catsSelect = [...(organisation.categories || [])];

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
              // When status changed to finished (done, cancel) completedAt we set it to now if not set.
              body.completedAt = body.completedAt || now();
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
            toastr.success('Mise à jour !');
            refresh();
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
                          selected={dateForDatePicker(values.completedAt ?? new Date())}
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
                    <Label htmlFor="categories">Catégories</Label>
                    <SelectCustom
                      options={catsSelect}
                      inputId="categories"
                      name="categories"
                      onChange={(v) => handleChange({ currentTarget: { value: v, name: 'categories' } })}
                      isClearable={false}
                      isMulti
                      value={values.categories || []}
                      getOptionValue={(i) => i}
                      getOptionLabel={(i) => i}
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
      <Comments actionId={action._id} />
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
