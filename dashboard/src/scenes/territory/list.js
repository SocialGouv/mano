/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useState } from 'react';
import { Col, Button as LinkButton, Container, FormGroup, Row, Modal, ModalBody, ModalHeader, Input } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { toastr } from 'react-redux-toastr';
import { Formik } from 'formik';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import Header from '../../components/header';
import Page from '../../components/pagination';
import Loading from '../../components/loading';
import Table from '../../components/table';
import ButtonCustom from '../../components/ButtonCustom';
import Search from '../../components/search';
import { useTerritories, territoryTypes } from '../../recoil/territory';
import PaginationContext from '../../contexts/pagination';
import SelectCustom from '../../components/SelectCustom';
import { territoriesFullSearchSelector } from '../../recoil/selectors';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { useRefresh } from '../../recoil/refresh';
import { formatDateWithFullMonth } from '../../services/date';
import { refreshTriggerState } from '../../components/Loader';

const List = () => {
  const organisation = useRecoilValue(organisationState);
  const history = useHistory();

  const { search, setSearch, page, setPage } = useContext(PaginationContext);

  const territories = useRecoilValue(territoriesFullSearchSelector({ search }));

  const limit = 20;

  if (!territories) return <Loading />;

  const data = territories.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  const total = territories.length;

  return (
    <Container>
      <Header
        titleStyle={{ fontWeight: 400 }}
        title={
          <>
            Territoires de l'organisation <b>{organisation.name}</b>
          </>
        }
      />
      <Row style={{ marginBottom: 40 }}>
        <Col>
          <CreateTerritory organisation={organisation} />
        </Col>
      </Row>
      <Row style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Recherche : </span>
          <Search placeholder="Par mot clé, présent dans le nom, une observation, ..." value={search} onChange={setSearch} />
        </Col>
      </Row>
      <Table
        data={data}
        rowKey={'_id'}
        onRowClick={(territory) => history.push(`/territory/${territory._id}`)}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          { title: 'Types', dataKey: 'types', render: ({ types }) => (types ? types.join(', ') : '') },
          { title: 'Périmètre', dataKey: 'perimeter' },
          { title: 'Créé le', dataKey: 'createdAt', render: (territory) => formatDateWithFullMonth(territory.createdAt || '') },
        ]}
      />
      <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
    </Container>
  );
};

const CreateTerritory = () => {
  const [open, setOpen] = useState(false);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const history = useHistory();
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const { addTerritory } = useTerritories();
  const { loading } = useRefresh();

  return (
    <CreateStyle>
      <LinkButton
        disabled={!!loading}
        onClick={() => {
          setRefreshTrigger({
            status: true,
            method: 'territoriesRefresher',
            options: [],
          });
        }}
        color="link"
        style={{ marginRight: 10 }}>
        Rafraichir
      </LinkButton>
      <ButtonCustom
        disabled={!currentTeam?._id}
        onClick={() => setOpen(true)}
        color="primary"
        title="Créer un nouveau territoire"
        padding="12px 24px"
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer un nouveau territoire</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: '', types: [], perimeter: '' }}
            onSubmit={async (body, actions) => {
              const res = await addTerritory({ ...body, user: user._id });
              actions.setSubmitting(false);
              if (res.ok) {
                toastr.success('Création réussie !');
                setOpen(false);
                history.push(`/territory/${res.data._id}`);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <div>Nom</div>
                      <Input name="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <div>Types</div>
                      <SelectCustom
                        options={territoryTypes}
                        name="types"
                        onChange={(v) => handleChange({ currentTarget: { value: v, name: 'types' } })}
                        isClearable={false}
                        isMulti
                        value={values.types}
                        getOptionValue={(i) => i}
                        getOptionLabel={(i) => i}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <div>Périmètre</div>
                      <Input name="perimeter" value={values.perimeter} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom color="info" disabled={isSubmitting} onClick={handleSubmit} title="Sauvegarder" />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </CreateStyle>
  );
};

const CreateStyle = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

export default List;
