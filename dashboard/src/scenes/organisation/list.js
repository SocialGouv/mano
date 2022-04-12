import React, { useEffect, useState } from 'react';
import { Col, FormGroup, Input, Modal, ModalBody, ModalHeader, Row, Label } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';
import Table from '../../components/table';
import ButtonCustom from '../../components/ButtonCustom';

import Loading from '../../components/loading';
import CreateWrapper from '../../components/createWrapper';
import useApi from '../../services/api';
import DeleteOrganisation from '../../components/DeleteOrganisation';
import { formatDateWithFullMonth } from '../../services/date';
import useTitle from '../../services/useTitle';

const List = () => {
  const [organisations, setOrganisations] = useState(null);
  const [updateKey, setUpdateKey] = useState(null);
  const [sortBy, setSortBy] = useState('countersTotal');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [refresh, setRefresh] = useState(true);
  useTitle('Organisations');
  const API = useApi();

  useEffect(() => {
    (async () => {
      if (!refresh) return;
      const { data } = await API.get({ path: '/organisation', query: { withCounters: true } });
      const sortedDataAscendant = data?.sort((org1, org2) => (org1[sortBy] > org2[sortBy] ? 1 : -1));
      setOrganisations(sortOrder === 'ASC' ? sortedDataAscendant : [...(sortedDataAscendant || [])].reverse());
      setUpdateKey((k) => k + 1);
      setRefresh(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => {
    const sortedDataAscendant = organisations?.sort((org1, org2) => (org1[sortBy] > org2[sortBy] ? 1 : -1));
    setOrganisations(sortOrder === 'ASC' ? sortedDataAscendant : [...(sortedDataAscendant || [])].reverse());
    setUpdateKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]);

  if (!organisations?.length) return <Loading />;
  return (
    <>
      <Create onChange={() => setRefresh(true)} />
      <Table
        data={organisations}
        key={updateKey}
        columns={[
          { title: 'Nom', dataKey: 'name', onSortOrder: setSortOrder, onSortBy: setSortBy, sortOrder, sortBy },
          {
            title: 'Créée le',
            dataKey: 'createdAt',
            render: (o) => formatDateWithFullMonth(o.createdAt || ''),
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
                  <span>Commentaires: {o.counters.comments || 0}</span>
                  <br />
                </StyledCounters>
              );
            },
          },
          {
            title: 'Chiffrement activé',
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
            render: (o) => formatDateWithFullMonth(o.encryptionLastUpdateAt || ''),
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
    </>
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
    <CreateWrapper style={{ marginTop: '1rem' }}>
      <ButtonCustom onClick={() => setOpen(true)} color="primary" title="Créer une nouvelle organisation" />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer une nouvelle organisation et un administrateur</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ orgName: '', name: '', email: '' }}
            validate={(values) => {
              const errors = {};
              if (!values.name) errors.name = 'Le nom est obligatoire';
              if (!values.orgName) errors.orgName = "Le nom de l'organisation est obligatoire";
              if (!values.email) errors.email = "L'email est obligatoire";
              else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) errors.email = "L'email est invalide";
              return errors;
            }}
            onSubmit={async (body, actions) => {
              try {
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
            {({ values, handleChange, handleSubmit, isSubmitting, touched, errors }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="orgName">Nom</Label>
                      <Input name="orgName" id="orgName" value={values.orgName} onChange={handleChange} />
                      {touched.orgName && errors.orgName && <Error>{errors.orgName}</Error>}
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="name">Nom de l'administrateur</Label>
                      <Input name="name" id="name" value={values.name} onChange={handleChange} />
                      {touched.name && errors.name && <Error>{errors.name}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="email">Email de l'administrateur</Label>
                      <Input name="email" id="email" value={values.email} onChange={handleChange} />
                      {touched.email && errors.email && <Error>{errors.email}</Error>}
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
const Error = styled.span`
  color: red;
  font-size: 11px;
`;

export default List;
