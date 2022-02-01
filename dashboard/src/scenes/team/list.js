import React, { useState } from 'react';
import { Col, Container, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import Header from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import CreateWrapper from '../../components/createWrapper';
import Table from '../../components/table';
import NightSessionModale from '../../components/NightSessionModale';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import useApi from '../../services/api';
import { AppSentry } from '../../services/sentry';
import OnboardingEndModal from '../../components/OnboardingEndModal';
import { formatDateWithFullMonth } from '../../services/date';

const List = () => {
  const teams = useRecoilValue(teamsState);
  const history = useHistory();

  return (
    <Container>
      <Header titleStyle={{ fontWeight: 400 }} title="Équipes" />
      <Create />
      <Table
        data={teams}
        onRowClick={(i) => history.push(`/team/${i._id}`)}
        rowKey={'_id'}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          { title: 'Créée le', dataKey: 'createdAt', render: (i) => formatDateWithFullMonth(i.createdAt) },
          {
            title: (
              <>
                <span>Maraude de nuit</span>
                <NightSessionModale />
              </>
            ),
            dataKey: 'nightSession',
            render: (i) => (i.nightSession ? '🌒' : '☀️'),
          },
        ]}
      />
    </Container>
  );
};

//Organisation

const Create = () => {
  const [teams, setTeams] = useRecoilState(teamsState);
  const [user, setUser] = useRecoilState(userState);
  const organisation = useRecoilValue(organisationState);
  const setCurrentTeam = useSetRecoilState(currentTeamState);
  const [open, setOpen] = useState(!teams.length);
  const API = useApi();
  const [onboardingEndModalOpen, setOnboardingEndModalOpen] = useState(false);

  const onboardingForTeams = !teams.length;

  return (
    <CreateWrapper>
      <ButtonCustom color="primary" onClick={() => setOpen(true)} title="Créer une nouvelle équipe" padding="12px 24px" />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop={onboardingForTeams ? 'static' : true}>
        <ModalHeader close={onboardingForTeams ? <></> : null} toggle={() => setOpen(false)}>
          {onboardingForTeams ? 'Dernière étape !' : 'Créer une nouvelle équipe'}
        </ModalHeader>
        <ModalBody>
          <span>Veuillez créer une première équipe avant de commencer à utiliser la plateforme</span>
          <br />
          <br />
          <Formik
            initialValues={{ name: '' }}
            onSubmit={async (values, actions) => {
              if (!values.name) {
                toastr.error('Vous devez choisir un nom');
                actions.setSubmitting(false);
                return;
              }
              const newTeamRes = await API.post({
                path: '/team',
                body: { name: values.name, organisation: organisation._id, nightSession: values.nightSession === 'true' },
              });
              if (!newTeamRes.ok) return actions.setSubmitting(false);
              if (onboardingForTeams) {
                const userPutRes = await API.put({ path: `/user/${user._id}`, body: { team: [newTeamRes.data._id] } });
                if (!userPutRes.ok) return actions.setSubmitting(false);
                const meResponse = await API.get({ path: '/user/me' });
                setUser(meResponse.user);
                AppSentry.setUser(meResponse.user);
                setCurrentTeam(meResponse.user.teams[0]);
                toastr.success('Création réussie !', `Vous êtes dans l'équipe ${newTeamRes.data.name}`);
                setOnboardingEndModalOpen(true);
              } else {
                toastr.success('Création réussie !');
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
                        <Label>Nom</Label>
                        <Input name="name" value={values.name} onChange={handleChange} />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label>L'équipe travaille-t-elle de nuit ?</Label>
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
                    <Col md={3}>
                      <ButtonCustom id="create-team" title="Créer" loading={isSubmitting} color="info" onClick={handleSubmit} />
                    </Col>
                  </Row>
                </React.Fragment>
              );
            }}
          </Formik>
        </ModalBody>
      </Modal>
      <OnboardingEndModal open={onboardingEndModalOpen} setOpen={setOnboardingEndModalOpen} />
    </CreateWrapper>
  );
};

export default List;
