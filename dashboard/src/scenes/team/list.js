import React, { useContext, useEffect, useState } from 'react';
import { Col, Container, FormGroup, Input, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import API from '../../services/api';

import Header from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import CreateWrapper from '../../components/createWrapper';
import Table from '../../components/table';

import { toFrenchDate } from '../../utils';
import AuthContext from '../../contexts/auth';

const List = () => {
  const [teams, setTeams] = useState(null);
  const history = useHistory();
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await API.get({ path: '/team' });
      setTeams(data);
    })();
  }, [refresh]);

  if (!teams) return <Loading />;

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title="Équipes" />
      <Create onChange={() => setRefresh(true)} />
      <Table
        data={teams}
        onRowClick={(i) => history.push(`/team/${i._id}`)}
        rowKey={'_id'}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          { title: 'Créée le', dataKey: 'createdAt', render: (i) => toFrenchDate(i.createdAt) },
          { title: 'Organisation', dataKey: 'Organisation', render: (i) => i.Organisation.name || '' },
          { title: 'Maraude de nuit', dataKey: 'nightSession', render: (i) => (i.nightSession ? '🌒' : '☀️') },
        ]}
      />
    </Container>
  );
};

//Organisation

const Create = ({ onChange }) => {
  const [open, setOpen] = useState(false);
  const { organisation, setAuth } = useContext(AuthContext);

  return (
    <CreateWrapper>
      <ButtonCustom color="primary" onClick={() => setOpen(true)} title="Créer une nouvelle équipe" padding="12px 24px" />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer une nouvelle équipe</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: '' }}
            onSubmit={async (values, actions) => {
              const res = await API.post({ path: '/team', body: { name: values.name, organisation: organisation._id } });
              actions.setSubmitting(false);
              if (!res.ok) return;
              toastr.success('Création réussie !');
              const { data: teams } = await API.get({ path: '/team' });
              setAuth({ teams });
              onChange();
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
