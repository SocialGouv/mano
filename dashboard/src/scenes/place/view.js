/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { Container, FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import Header from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import BackButton from '../../components/backButton';
import Box from '../../components/Box';
import { usePersons } from '../../recoil/persons';
import { useRelsPerson } from '../../recoil/relPersonPlace';
import { usePlaces } from '../../recoil/places';

const View = () => {
  const { id } = useParams();
  const history = useHistory();
  const { places, updatePlace, deletePlace } = usePlaces();
  const { relsPersonPlace } = useRelsPerson();
  const { persons } = usePersons();

  const place = places.find((p) => p._id === id);

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await deletePlace(id);
      if (!res.ok) return;
      toastr.success('Suppression réussie');
      history.goBack();
    }
  };

  if (!place) return <Loading />;

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={<BackButton />} />
      <Box>
        <Formik
          initialValues={place}
          onSubmit={async (body) => {
            try {
              const res = await updatePlace(body);
              if (res.ok) {
                toastr.success('Mise à jour !');
              }
            } catch (placeUpdateError) {
              console.log('error in updating place', placeUpdateError);
              toastr.error('Erreur!', placeUpdateError.message);
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => (
            <React.Fragment>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Nom</Label>
                    <Input name="name" value={values.name} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Personnes suivies</Label>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: relsPersonPlace
                          .filter((rel) => rel.place === place._id)
                          .map((rel) => persons.find((p) => p._id === rel.person)?.name)
                          .join('<br/>'),
                      }}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} width={200} />
                <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
              </div>
            </React.Fragment>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default View;
