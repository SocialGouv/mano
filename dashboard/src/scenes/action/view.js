/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { Row, Col, FormGroup, Input, Label } from 'reactstrap';
import { useParams, useHistory } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
import { Formik } from 'formik';

import DatePicker from 'react-datepicker';

import SelectPerson from '../../components/SelectPerson';

import Header from '../../components/header';
import Loading from '../../components/loading';
import BackButton from '../../components/backButton';
import Box from '../../components/Box';

import ButtonCustom from '../../components/ButtonCustom';
import Comments from '../../components/Comments';
import styled from 'styled-components';
import UserName from '../../components/UserName';
import SelectStatus from '../../components/SelectStatus';
import SelectCustom from '../../components/SelectCustom';
import SelectTeam from '../../components/SelectTeam';

import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import { CANCEL, DONE, actionsState, mappedIdsToLabels, prepareActionForEncryption } from '../../recoil/actions';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { dateForDatePicker, now } from '../../services/date';
import { refreshTriggerState } from '../../components/Loader';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import useApi from '../../services/api';

const View = () => {
  const { id } = useParams();
  const teams = useRecoilValue(teamsState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const [actions, setActions] = useRecoilState(actionsState);
  const [comments, setComments] = useRecoilState(commentsState);

  const history = useHistory();
  const API = useApi();

  const action = actions.find((a) => a._id === id);

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

  const catsSelect = [...(organisation.categories || [])].sort((c1, c2) => c1.localeCompare(c2));

  return (
    <>
      <Header
        title={<BackButton />}
        onRefresh={() =>
          setRefreshTrigger({
            status: true,
            options: { showFullScreen: false, initialLoad: false },
          })
        }
      />
      <Title>
        {`${action?.name}`}
        <UserName id={action.user} wrapper={(name) => ` (créée par ${name})`} />
      </Title>
      <Box>
        <Formik
          initialValues={action}
          onSubmit={async (body) => {
            const statusChanged = body.status && action.status !== body.status;
            if (statusChanged) {
              if ([DONE, CANCEL].includes(body.status)) {
                body.completedAt = now();
              } else {
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
                  comment: `${user.name} a changé le status de l'action: ${
                    mappedIdsToLabels.find((status) => status._id === newAction.status)?.name
                  }`,
                  type: 'action',
                  item: action._id,
                  action: action._id,
                  team: currentTeam._id,
                  user: user._id,
                  organisation: organisation._id,
                };
                const commentResponse = await API.post({ path: '/comment', body: prepareCommentForEncryption(comment) });
                if (commentResponse.ok) setComments((comments) => [commentResponse.decryptedData, ...comments]);
              }
              toastr.success('Mise à jour !');
              setRefreshTrigger({
                status: true,
                options: { showFullScreen: false, initialLoad: false },
              });
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => {
            return (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nom</Label>
                      <Input name="name" type="textarea" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>Statut</Label>
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
                      <Label>Sous l'équipe</Label>
                      <SelectTeam
                        teams={user.role === 'admin' ? teams : user.teams}
                        teamId={values.team}
                        onChange={(team) => handleChange({ target: { value: team._id, name: 'team' } })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>À faire le</Label>
                      <div>
                        <DatePicker
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
                        <span>Afficher l'heure</span>
                        <Input
                          type="checkbox"
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
                        {values.status === DONE && <Label>Faite le</Label>}
                        {values.status === CANCEL && <Label>Annulée le</Label>}
                        <div>
                          <DatePicker
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
                      <Label>Catégories</Label>
                      <SelectCustom
                        options={catsSelect}
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
                      <Label>Description</Label>
                      <Input type="textarea" name="description" value={values.description} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} width={200} />
                  <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                </div>
              </React.Fragment>
            );
          }}
        </Formik>
      </Box>
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
