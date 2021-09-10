import React, { useContext, useState } from 'react';
import { Col, Container, FormGroup, Input, Modal, ModalBody, ModalHeader, Row, Button as LinkButton } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import Header from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import Loading from '../../components/loading';
import CreateWrapper from '../../components/createWrapper';
import Table from '../../components/table';
import Search from '../../components/search';
import AuthContext from '../../contexts/auth';
import PlacesContext from '../../contexts/places';
import PaginationContext from '../../contexts/pagination';
import Page from '../../components/pagination';
import PersonsContext from '../../contexts/persons';
import { filterBySearch } from '../search/utils';
import { toFrenchDate } from '../../utils';
import RefreshContext from '../../contexts/refresh';
import RelsPersonPlaceContext from '../../contexts/relPersonPlace';

const filterPlaces = (places, { page, limit, search }) => {
  if (search?.length) places = filterBySearch(search, places);

  const data = places.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  return { data, total: places.length };
};

const List = () => {
  const { places } = useContext(PlacesContext);
  const { relsPersonPlace } = useContext(RelsPersonPlaceContext);
  const { persons } = useContext(PersonsContext);
  const { organisation } = useContext(AuthContext);
  const history = useHistory();

  const { search, setSearch, page, setPage } = useContext(PaginationContext);

  const limit = 20;

  if (!places) return <Loading />;

  const { data, total } = filterPlaces(places, { page, limit, search });

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={`Lieux fréquentés de l'organisation ${organisation.name}`} />
      <Row style={{ marginBottom: 40 }}>
        <Col>
          <Create />
        </Col>
      </Row>
      <Row style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Recherche: </span>
          <Search placeholder="Par nom du lieu" value={search} onChange={setSearch} />
        </Col>
      </Row>
      <Table
        data={data}
        rowKey={'_id'}
        onRowClick={(place) => history.push(`/place/${place._id}`)}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          {
            title: 'Personnes suivies',
            dataKey: 'persons',
            render: (place) => (
              <span
                dangerouslySetInnerHTML={{
                  __html: relsPersonPlace
                    .filter((rel) => rel.place === place._id)
                    .map((rel) => persons.find((p) => p._id === rel.person)?.name)
                    .join('<br/>'),
                }}
              />
            ),
          },
          { title: 'Créée le', dataKey: 'createdAt', render: (place) => toFrenchDate(place.createdAt) },
        ]}
      />
      <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
    </Container>
  );
};

const Create = () => {
  const [open, setOpen] = useState(false);
  const { currentTeam } = useContext(AuthContext);
  const { addPlace, loading } = useContext(PlacesContext);
  const { refreshPlacesAndRelations } = useContext(RefreshContext);
  return (
    <CreateWrapper style={{ marginBottom: 0 }}>
      <LinkButton disabled={!!loading} onClick={() => refreshPlacesAndRelations()} color="link" style={{ marginRight: 10 }}>
        Rafraichir
      </LinkButton>
      <ButtonCustom
        disabled={!currentTeam}
        onClick={() => setOpen(true)}
        color="primary"
        title="Créer un nouveau lieu fréquenté"
        padding="12px 24px"
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer un nouveau lieux frequenté</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: '', organisation: '' }}
            onSubmit={async (body, actions) => {
              const response = await addPlace(body);
              actions.setSubmitting(false);
              if (response.ok) {
                toastr.success('Création réussie !');
              } else {
                toastr.error('Erreur!', response.error);
              }
              setOpen(false);
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
                </Row>
                <br />
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
