/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Col, Container, FormGroup, Input, Modal, ModalBody, ModalHeader, Row, Label } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';
import Table from '../../components/table';
import ButtonCustom from '../../components/ButtonCustom';

import Loading from '../../components/loading';
import CreateWrapper from '../../components/createWrapper';
import { toFrenchDate } from '../../utils';
import useApi from '../../services/api';
import DeleteOrganisation from '../../components/DeleteOrganisation';

const List = () => {
  const [organisations, setOrganisations] = useState(null);
  const [updateKey, setUpdateKey] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [refresh, setRefresh] = useState(true);
  const API = useApi();

  useEffect(() => {
    (async () => {
      if (!refresh) return;
      const { data } = await API.get({ path: '/organisation', query: { withCounters: true } });
      const sortedDataAscendant = data?.sort((org1, org2) => (org1[sortBy] > org2[sortBy] ? 1 : -1));
      setOrganisations(sortOrder === 'ASC' ? sortedDataAscendant : [...sortedDataAscendant].reverse());
      setUpdateKey((k) => k + 1);
      setRefresh(false);
    })();
  }, [refresh]);

  useEffect(() => {
    const sortedDataAscendant = organisations?.sort((org1, org2) => (org1[sortBy] > org2[sortBy] ? 1 : -1));
    setOrganisations(sortOrder === 'ASC' ? sortedDataAscendant : [...sortedDataAscendant].reverse());
    setUpdateKey((k) => k + 1);
  }, [sortBy, sortOrder]);

  if (!organisations?.length) return <Loading />;
  return (
    <Container style={{ padding: '40px 0' }}>
      <Create onChange={() => setRefresh(true)} />
      <Table
        data={organisations}
        // FIXME: Table is not updating without that key
        // when we click on sortable arrows, I couldn't find why yet...
        key={updateKey}
        columns={[
          { title: 'Nom', dataKey: 'name', onSortOrder: setSortOrder, onSortBy: setSortBy, sortOrder, sortBy },
          {
            title: 'Créée le',
            dataKey: 'createdAt',
            render: (o) => toFrenchDate(o.createdAt || ''),
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
          },
          {
            title: 'Compteurs',
            dataKey: 'counters',
            sortableKey: 'countersTotal',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (o) => {
              return (
                <StyledCounters total={o.countersTotal}>
                  <span>Personnes: {o.counters.persons || 0}</span>
                  <br />
                  <span>Actions: {o.counters.actions || 0}</span>
                  <br />
                  <span>Territoires: {o.counters.territories || 0}</span>
                  <br />
                  <span>Comptes-rendus: {o.counters.reports || 0}</span>
                  <br />
                </StyledCounters>
              );
            },
          },
          {
            title: 'Encryption activée',
            dataKey: 'encryptionEnabled',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (o) => (o.encryptionEnabled ? <input type="checkbox" checked disabled /> : null),
          },
          {
            title: 'Dernière encryption',
            dataKey: 'encryptionLastUpdateAt',
            sortBy,
            sortOrder,
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            render: (o) => toFrenchDate(o.encryptionLastUpdateAt || ''),
          },
          {
            title: 'Action',
            dataKey: 'delete',
            render: (o) => {
              return (
                <DeleteOrganisation
                  buttonTitle="Supprimer"
                  onSuccess={() => {
                    setRefresh(true);
                  }}
                  buttonStyle={{ margin: 'auto' }}
                  organisation={o}
                />
              );
            },
          },
        ]}
        rowKey={'_id'}
        onRowClick={null}
      />
    </Container>
  );
};

const StyledCounters = styled.p`
  ${(p) => p.total < 10 && 'opacity: 0.5;'}
  ${(p) => p.total === 0 && 'opacity: 0.1;'}
  ${(p) => p.total > 200 && 'font-weight: 600;'}
  ${(p) => p.total > 1000 && 'font-weight: 800;'}
`;

const Create = ({ onChange }) => {
  const [open, setOpen] = useState(false);
  const API = useApi();

  return (
    <CreateWrapper>
      <ButtonCustom onClick={() => setOpen(true)} color="primary" title="Créer une nouvelle organisation" />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer une nouvelle organisation et un administrateur</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ orgName: '', name: '', email: '' }}
            onSubmit={async (body, actions) => {
              try {
                if (!body.orgName) return toastr.error("Veuillez saisir un nom pour l'organisation");
                if (!body.name) return toastr.error("Veuillez saisir un nom pour l'administrateur");
                if (!body.email) return toastr.error("Veuillez saisir un email pour l'administrateur");
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
