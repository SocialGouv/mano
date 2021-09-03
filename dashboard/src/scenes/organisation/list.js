import React, { useEffect, useState } from 'react';
import { Col, Container, FormGroup, Input, Modal, ModalBody, ModalHeader, Row, Label } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import Table from '../../components/table';
import ButtonCustom from '../../components/ButtonCustom';

import API from '../../services/api';

import Loading from '../../components/loading';
import CreateWrapper from '../../components/createWrapper';
import { generatePassword } from '../../utils';

const List = () => {
  const [organisations, setOrganisation] = useState(null);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await API.get({ path: '/organisation' });
      setOrganisation(data);
    })();
  }, [refresh]);

  if (!organisations?.length) return <Loading />;

  return (
    <Container style={{ padding: '40px 0' }}>
      <Create onChange={() => setRefresh(true)} />
      <Table
        data={organisations}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          { title: 'Créée le', dataKey: 'createdAt' },
        ]}
        rowKey={'_id'}
        onRowClick={null}
      />
    </Container>
  );
};

const Create = ({ onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <CreateWrapper>
      <ButtonCustom onClick={() => setOpen(true)} color="primary" title="Créer une nouvelle organisation" />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer une nouvelle organisation et un administrateur</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ orgName: '', name: '', email: '', password: generatePassword() }}
            onSubmit={async (body, actions) => {
              try {
                if (!body.orgName) return toastr.error("Veuillez saisir un nom pour l'organisation");
                if (!body.name) return toastr.error("Veuillez saisir un nom pour l'administrateur");
                if (!body.email) return toastr.error("Veuillez saisir un email pour l'administrateur");
                if (!body.password) return toastr.error("Veuillez saisir un mot de passe pour l'administrateur");
                const orgRes = await API.post({ path: '/organisation', skipEncryption: '/organisation', body });
                actions.setSubmitting(false);
                if (!orgRes.ok) return;
                toastr.success('Création réussie !');
                onChange();
                setOpen(false);
              } catch (orgCreationError) {
                console.log('error in creating organisation', orgCreationError);
                toastr.error('Erreur!', orgCreationError.message);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nom</Label>
                      <Input name="orgName" value={values.orgName} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <div>Détails de l'administrateur</div>
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nom</Label>
                      <Input name="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Email</Label>
                      <Input name="email" value={values.email} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Mot de passe</Label>
                      <Input name="password" value={values.password} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <ButtonCustom loading={isSubmitting} color="info" onClick={handleSubmit} title="Créer" />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </CreateWrapper>
  );
};

export default List;
