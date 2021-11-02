import React, { useContext, useState } from 'react';
import { Col, Container, FormGroup, Input, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import API from '../../services/api';

import Header from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import CreateWrapper from '../../components/createWrapper';
import Table from '../../components/table';

import { toFrenchDate } from '../../utils';
import AuthContext from '../../contexts/auth';
import NightSessionModale from '../../components/NightSessionModale';

const List = () => {
  const { teams } = useContext(AuthContext);
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
          { title: 'Organisation', dataKey: 'Organisation', render: (i) => i.Organisation.name || '' },
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
  const { organisation, setAuth, teams, user } = useContext(AuthContext);
  const [open, setOpen] = useState(!teams.length);

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
                setAuth({ user: meResponse.user });
                toastr.success('Création réussie !', `Vous êtes dans l'équipe ${newTeamRes.data.name}`);
              } else {
                toastr.success('Création réussie !');
              }
              actions.setSubmitting(false);
              const { data: teams } = await API.get({ path: '/team' });
              setAuth({ teams });
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
