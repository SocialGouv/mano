import React, { useState } from 'react';
import { Col, Container, FormGroup, Input, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import Header from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import CreateWrapper from '../../components/createWrapper';
import Table from '../../components/table';

import { toFrenchDate } from '../../utils';
import NightSessionModale from '../../components/NightSessionModale';
import { currentTeamState, organisationState, teamsState, useAuth, userState } from '../../recoil/auth';
import useApi from '../../services/api-interface-with-dashboard';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

const List = () => {
  const { teams } = useAuth();
  const history = useHistory();

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title="Équipes" />
      <Create />
      <Table
        data={teams}
        onRowClick={(i) => history.push(`/team/${i._id}`)}
        rowKey={'_id'}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          { title: 'Créée le', dataKey: 'createdAt', render: (i) => toFrenchDate(i.createdAt) },
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

  const onboardingForTeams = !teams.length;

  return (
    <CreateWrapper>
      <ButtonCustom color="primary" onClick={() => setOpen(true)} title="Créer une nouvelle équipe" padding="12px 24px" />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>{onboardingForTeams ? 'Bienvenue dans Mano !' : 'Créer une nouvelle équipe'}</ModalHeader>
        <ModalBody>
          <span>Veuillez créer une première équipe avant de commencer à utiliser la plateforme</span>
          <br />
          <br />
          <Formik
            initialValues={{ name: '' }}
            onSubmit={async (values, actions) => {
              const newTeamRes = await API.post({ path: '/team', body: { name: values.name, organisation: organisation._id } });
              if (!newTeamRes.ok) return actions.setSubmitting(false);
              if (onboardingForTeams) {
                const userPutRes = await API.put({ path: `/user/${user._id}`, body: { team: [newTeamRes.data._id] } });
                if (!userPutRes.ok) return actions.setSubmitting(false);
                const meResponse = await API.get({ path: '/user/me' });
                setUser(meResponse.user);
                setCurrentTeam(meResponse.user.teams[0]);
                toastr.success('Création réussie !', `Vous êtes dans l'équipe ${newTeamRes.data.name}`);
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
                        <div>Nom</div>
                        <Input name="name" value={values.name} onChange={handleChange} />
                      </FormGroup>
                    </Col>
                  </Row>
                  <br />
                  <Row>
                    <Col md={3}>
                      <ButtonCustom title="Créer" loading={isSubmitting} color="info" onClick={handleSubmit} />
                    </Col>
                  </Row>
                </React.Fragment>
              );
            }}
          </Formik>
        </ModalBody>
      </Modal>
    </CreateWrapper>
  );
};

export default List;
