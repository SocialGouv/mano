import React from 'react';
import { FormGroup, Input, Label } from 'reactstrap';
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
import { groupsState } from '../../recoil/groups';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';

const actionByIdSelector = selectorFamily({
  key: 'actionByIdSelector',
  get:
    ({ actionId }) =>
    ({ get }) => {
      const actions = get(itemsGroupedByActionSelector);
      return actions[actionId];
    },
});

const ActionView = () => {
  const { actionId } = useParams();
  const teams = useRecoilValue(teamsState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const action = useRecoilValue(actionByIdSelector({ actionId }));
  const setActions = useSetRecoilState(actionsState);
  const setComments = useSetRecoilState(commentsState);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();
  const groups = useRecoilValue(groupsState);

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
          if (!body.teams?.length) return toast.error('Une action doit être associée à au moins une équipe.');
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
          delete body.team;
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
          const canToggleGroupCheck =
            !!organisation.groupsEnabled && !!values.person && groups.find((group) => group.persons.includes(values.person));
          return (
            <>
              <div className="tw-flex tw-flex-row">
                <div className="tw-flex tw-flex-[2] tw-basis-2/3 tw-flex-col">
                  <FormGroup>
                    <Label htmlFor="name">Nom</Label>
                    <Input name="name" id="name" type="textarea" value={values.name} onChange={handleChange} />
                  </FormGroup>
                  <FormGroup>
                    <SelectPerson value={values.person} onChange={handleChange} />
                  </FormGroup>
                  <FormGroup>
                    <ActionsCategorySelect
                      values={values.categories}
                      id="categories"
                      label="Catégories"
                      onChange={(v) => handleChange({ currentTarget: { value: v, name: 'categories' } })}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="description">Description</Label>
                    <Input type="textarea" name="description" id="description" value={values.description} onChange={handleChange} />
                  </FormGroup>
                  {!!canToggleGroupCheck && (
                    <FormGroup>
                      <Label htmlFor="create-action-for-group">
                        <input
                          type="checkbox"
                          className="tw-mr-2"
                          id="create-action-for-group"
                          name="group"
                          checked={values.group}
                          onChange={handleChange}
                        />
                        Action familiale <br />
                        <small className="text-muted">Cette action sera à effectuer pour toute la famille</small>
                      </Label>
                    </FormGroup>
                  )}
                </div>
                <div className="tw-flex tw-shrink-0 tw-flex-col tw-px-4">
                  <hr className="tw-m-0 tw-w-px tw-shrink-0 tw-basis-full tw-border tw-bg-gray-300" />
                </div>
                <div className="tw-flex tw-flex-[1] tw-basis-1/3 tw-flex-col">
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
                    <div>
                      <input
                        type="checkbox"
                        id="withTime"
                        name="withTime"
                        className="tw-mr-2"
                        checked={values.withTime || false}
                        onChange={() => {
                          handleChange({ target: { name: 'withTime', checked: Boolean(!values.withTime), value: Boolean(!values.withTime) } });
                        }}
                      />
                      <label htmlFor="withTime">Montrer l'heure</label>
                    </div>
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="team">Sous l'équipe</Label>
                    <SelectTeamMultiple
                      onChange={(teamIds) => handleChange({ target: { value: teamIds, name: 'teams' } })}
                      value={Array.isArray(values.teams) ? values.teams : [values.team]}
                      colored
                      inputId="team"
                      classNamePrefix="person-select-assigned-team"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="create-action-urgent">
                      <input
                        type="checkbox"
                        id="create-action-urgent"
                        className="tw-mr-2"
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
                  <FormGroup>
                    <Label htmlFor="update-action-select-status">Statut</Label>
                    <SelectStatus
                      name="status"
                      value={values.status || ''}
                      onChange={handleChange}
                      inputId="update-action-select-status"
                      classNamePrefix="update-action-select-status"
                    />
                  </FormGroup>
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
                </div>
              </div>
              <div className="tw-mt-4 tw-flex tw-justify-end">
                <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} />
                <ButtonCustom
                  title={'Mettre à jour'}
                  loading={isSubmitting}
                  onClick={handleSubmit}
                  disabled={JSON.stringify(action) === JSON.stringify(values)}
                />
              </div>
            </>
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

export default ActionView;
