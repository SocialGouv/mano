import React, { useEffect, useState } from 'react';
import { Col, FormGroup, Input, Modal, ModalBody, ModalHeader, Row, Label } from 'reactstrap';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import Table from '../../components/table';
import ButtonCustom from '../../components/ButtonCustom';

import Loading from '../../components/loading';
import useApi from '../../services/api';
import { formatDateWithFullMonth } from '../../services/date';
import useTitle from '../../services/useTitle';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';
import { capture } from '../../services/sentry';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/auth';

const List = () => {
  const [organisations, setOrganisations] = useState(null);
  const user = useRecoilValue(userState);
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
      <Create total={organisations?.length} onChange={() => setRefresh(true)} />
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
            title: 'Utilisateurs',
            dataKey: 'users',
            sortableKey: 'users',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (o) => {
              return <span>Utilisateurs: {o.users || 0}</span>;
            },
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
                  <span>Familles: {o.counters.groups || 0}</span>
                  <br />
                  <span>Actions: {o.counters.actions || 0}</span>
                  <br />
                  <span>Passages: {o.counters.passages || 0}</span>
                  <br />
                  <span>Rencontres: {o.counters.rencontres || 0}</span>
                  <br />
                  <span>Territoires: {o.counters.territories || 0}</span>
                  <br />
                  <span>Observations: {o.counters.observations || 0}</span>
                  <br />
                  <span>Comptes-rendus: {o.counters.reports || 0}</span>
                  <br />
                  <span>Collaborations: {o.counters.collaborations || 0}</span>
                  <br />
                  <span>Commentaires: {o.counters.comments || 0}</span>
                  <br />
                  <span>Consultations: {o.counters.consultations || 0}</span>
                  <br />
                  <span>Traitements: {o.counters.treatments || 0}</span>
                </StyledCounters>
              );
            },
          },
          {
            title: 'Dernier chiffrement',
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
            render: (organisation) => {
              return (
                <DeleteButtonAndConfirmModal
                  title={`Voulez-vous vraiment supprimer l'organisation ${organisation.name}`}
                  textToConfirm={organisation.name}
                  onConfirm={async () => {
                    try {
                      const res = await API.delete({ path: `/organisation/${organisation._id}` });
                      if (res.ok) {
                        toast.success('Organisation supprimée');
                        setRefresh(true);
                      }
                    } catch (organisationDeleteError) {
                      capture(organisationDeleteError, { extra: { organisation }, user });
                      toast.error(organisationDeleteError.message);
                    }
                  }}>
                  <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
                    Cette opération est irréversible
                    <br />
                    et entrainera la suppression définitive de toutes les données liées à l'organisation&nbsp;:
                    <br />
                    équipes, utilisateurs, personnes suivies, actions, territoires, commentaires et observations, comptes-rendus...
                  </span>
                </DeleteButtonAndConfirmModal>
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
  ${(p) => p.total > 200 && 'font-weight: 500;'}
  ${(p) => p.total > 2000 && 'font-weight: 600;'}
  ${(p) => p.total > 5000 && 'font-weight: 700;'}
  ${(p) => p.total > 10000 && 'font-weight: 800;'}
`;

const Create = ({ onChange, total }) => {
  const [open, setOpen] = useState(false);
  const API = useApi();

  return (
    <>
      <div className="tw-mb-10 tw-mt-4 tw-flex tw-w-full tw-justify-between">
        <h2 className="tw-text-2xl">Organisations utilisant Mano ({total})</h2>
        <ButtonCustom onClick={() => setOpen(true)} color="primary" title="Créer une nouvelle organisation" />
      </div>
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
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
                const orgRes = await API.post({ path: '/organisation', body });
                actions.setSubmitting(false);
                if (!orgRes.ok) return;
                toast.success('Création réussie !');
                onChange();
                setOpen(false);
              } catch (orgCreationError) {
                console.log('error in creating organisation', orgCreationError);
                toast.error(orgCreationError.message);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting, touched, errors }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="orgName">Nom</Label>
                      <Input name="orgName" id="orgName" value={values.orgName} onChange={handleChange} />
                      {touched.orgName && errors.orgName && <span className="tw-text-xs tw-text-red-500">{errors.orgName}</span>}
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="name">Nom de l'administrateur</Label>
                      <Input name="name" id="name" value={values.name} onChange={handleChange} />
                      {touched.name && errors.name && <span className="tw-text-xs tw-text-red-500">{errors.name}</span>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="email">Email de l'administrateur</Label>
                      <Input name="email" id="email" value={values.email} onChange={handleChange} />
                      {touched.email && errors.email && <span className="tw-text-xs tw-text-red-500">{errors.email}</span>}
                    </FormGroup>
                  </Col>
                </Row>
                <ButtonCustom loading={isSubmitting} onClick={handleSubmit} title="Créer" />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </>
  );
};
export default List;
