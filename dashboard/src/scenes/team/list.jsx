import React, { useMemo, useState } from 'react';
import { Col, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import { SmallHeader } from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import Table from '../../components/table';
import NightSessionModale from '../../components/NightSessionModale';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import API from '../../services/api';
import OnboardingEndModal from '../../components/OnboardingEndModal';
import { formatDateWithFullMonth } from '../../services/date';
import useTitle from '../../services/useTitle';
import { useLocalStorage } from '../../services/useLocalStorage';

const defaultSort = (a, b, sortOrder) => (sortOrder === 'ASC' ? (a.name || '').localeCompare(b.name) : (b.name || '').localeCompare(a.name));

const sortTeams = (sortBy, sortOrder) => (a, b) => {
  if (sortBy === 'createdAt') {
    if (a.createdAt > b.createdAt) return sortOrder === 'ASC' ? 1 : -1;
    if (a.createdAt < b.createdAt) return sortOrder === 'ASC' ? -1 : 1;
    return defaultSort(a, b, sortOrder);
  }
  if (sortBy === 'nightSession') {
    if (a.nightSession && !b.nightSession) return sortOrder === 'ASC' ? 1 : -1;
    if (!a.nightSession && b.nightSession) return sortOrder === 'ASC' ? -1 : 1;
    return defaultSort(a, b, sortOrder);
  }
  // default sort: name
  return defaultSort(a, b, sortOrder);
};

const List = () => {
  const teams = useRecoilValue(teamsState);
  const history = useHistory();
  useTitle('Équipes');
  const [sortBy, setSortBy] = useLocalStorage('users-sortBy', 'name');
  const [sortOrder, setSortOrder] = useLocalStorage('users-sortOrder', 'ASC');

  const data = useMemo(() => [...teams].sort(sortTeams(sortBy, sortOrder)), [teams, sortBy, sortOrder]);

  return (
    <>
      <SmallHeader title="Équipes" />
      <Create />
      <Table
        data={data}
        onRowClick={(i) => history.push(`/team/${i._id}`)}
        rowKey={'_id'}
        columns={[
          {
            title: 'Nom',
            dataKey: 'name',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
          },
          {
            title: 'Créée le',
            dataKey: 'createdAt',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (i) => formatDateWithFullMonth(i.createdAt),
          },
          {
            title: 'Équipe de nuit',
            help: <NightSessionModale />,
            dataKey: 'nightSession',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (i) => (i.nightSession ? '🌒' : '☀️'),
          },
        ]}
      />
    </>
  );
};

//Organisation

const Create = () => {
  const [teams, setTeams] = useRecoilState(teamsState);
  const [user, setUser] = useRecoilState(userState);
  const organisation = useRecoilValue(organisationState);
  const setCurrentTeam = useSetRecoilState(currentTeamState);
  const [open, setOpen] = useState(!teams.length);

  const [onboardingEndModalOpen, setOnboardingEndModalOpen] = useState(false);

  const onboardingForTeams = !teams.length;

  return (
    <div className="tw-mb-10 tw-flex tw-w-full tw-justify-end">
      <ButtonCustom color="primary" onClick={() => setOpen(true)} title="Créer une nouvelle équipe" padding="12px 24px" />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
        <ModalHeader close={onboardingForTeams ? <></> : null} toggle={() => setOpen(false)}>
          {onboardingForTeams ? 'Dernière étape !' : 'Créer une nouvelle équipe'}
        </ModalHeader>
        <ModalBody>
          {Boolean(onboardingForTeams) && (
            <span>
              Veuillez créer une première équipe avant de commencer à utiliser la plateforme <br />
              <br />
            </span>
          )}
          <Formik
            initialValues={{ name: '' }}
            onSubmit={async (values, actions) => {
              if (!values.name) {
                toast.error('Vous devez choisir un nom');
                actions.setSubmitting(false);
                return;
              }
              const newTeamRes = await API.post({
                path: '/team',
                body: { name: values.name, organisation: organisation._id, nightSession: values.nightSession === 'true' },
              });
              if (!newTeamRes.ok) return actions.setSubmitting(false);
              const userPutRes = await API.put({
                path: `/user/${user._id}`,
                body: {
                  team: [...(user.teams || []).map((team) => team._id), newTeamRes.data._id],
                },
              });
              if (!userPutRes.ok) return actions.setSubmitting(false);
              const meResponse = await API.get({ path: '/user/me' });
              setUser(meResponse.user);
              setCurrentTeam(meResponse.user.teams[0]);
              if (onboardingForTeams) {
                toast.success(`Création réussie ! Vous êtes dans l'équipe ${newTeamRes.data.name}`);
                setOnboardingEndModalOpen(true);
              } else {
                toast.success('Création réussie !');
              }
              actions.setSubmitting(false);
              const { data: teams } = await API.get({ path: '/team' });
              setTeams(teams);
              setOpen(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => {
              return (
                <React.Fragment>
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="name">Nom</Label>
                        <Input name="name" id="name" value={values.name} onChange={handleChange} />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="">L'équipe travaille-t-elle de nuit ?</Label>
                        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                          <FormGroup style={{ marginBottom: 0 }}>
                            <input
                              style={{ marginRight: 10 }}
                              type="radio"
                              id="nightSessionYes"
                              name="nightSession"
                              value="true"
                              checked={values.nightSession === 'true'}
                              onChange={handleChange}
                            />
                            <label htmlFor="nightSessionYes">Oui</label>
                          </FormGroup>
                          <FormGroup style={{ marginBottom: 0 }}>
                            <input
                              style={{ marginRight: 10 }}
                              type="radio"
                              id="nightSessionNo"
                              name="nightSession"
                              value="false"
                              checked={values.nightSession === 'false'}
                              onChange={handleChange}
                            />
                            <label htmlFor="nightSessionNo">Non</label>
                          </FormGroup>
                        </div>
                      </FormGroup>
                    </Col>
                  </Row>
                  <br />
                  <Row>
                    <Col className="tw-mt-4 tw-flex tw-justify-end">
                      <ButtonCustom id="create-team" title="Créer" loading={isSubmitting} onClick={handleSubmit} />
                    </Col>
                  </Row>
                </React.Fragment>
              );
            }}
          </Formik>
        </ModalBody>
      </Modal>
      <OnboardingEndModal open={onboardingEndModalOpen} setOpen={setOnboardingEndModalOpen} />
    </div>
  );
};

export default List;
