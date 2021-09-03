/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { Col, FormGroup, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import { useHistory } from 'react-router-dom';

import Box from './Box';
import ButtonCustom from './ButtonCustom';
import PlacesContext from '../contexts/places';
import AuthContext from '../contexts/auth';
import RelsPersonPlaceContext from '../contexts/relPersonPlace';
import Table from './table';
import { toFrenchDate } from '../utils';
import SelectCustom from './SelectCustom';

const Places = ({ personId = '' }) => {
  const history = useHistory();

  const { places } = useContext(PlacesContext);
  const { relsPersonPlace } = useContext(RelsPersonPlaceContext);

  const data = relsPersonPlace
    .filter((relation) => relation.person === personId)
    .map((relation) => ({ ...relation, place: places.find((p) => p._id === relation.place) }));

  if (!data) return null;

  return (
    <React.Fragment>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col md={4}>
          <Title>Lieux fréquentés</Title>
        </Col>
        <Col md={4} />
        <Col md={4}></Col>
      </Row>
      <Box>
        <Table
          data={data}
          rowKey={'_id'}
          onRowClick={(relation) => history.push(`/place/${relation?.place?._id}`)}
          columns={[
            { title: 'Nom', render: (relation) => relation?.place?.name },
            { title: 'Ajouté le', dataKey: 'createdAt', render: (relation) => toFrenchDate(relation.createdAt) },
          ]}
        />
        <AddPlace personId={personId} />
      </Box>
    </React.Fragment>
  );
};

const Title = styled.h1`
  font-size: 20px;
  font-weight: 800;
`;

const AddPlace = ({ personId }) => {
  const [open, setOpen] = useState(false);
  const { currentTeam } = useContext(AuthContext);
  const { places } = useContext(PlacesContext);
  const { addRelation } = useContext(RelsPersonPlaceContext);

  return (
    <div style={{ marginTop: 15, marginBottom: 30 }}>
      <ButtonCustom disabled={!currentTeam} onClick={() => setOpen(true)} color="primary" title="Ajouter un lieu" padding="12px 24px" />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Ajouter un lieu</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ place: null }}
            onSubmit={async (body, actions) => {
              if (!body.place) return toastr.error('Veuillez sélectionner un lieu');
              const res = await addRelation({ place: body.place._id, person: personId });
              actions.setSubmitting(false);
              if (res.ok) {
                toastr.success('Lieu ajouté !');
                setOpen(false);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <div>Lieu</div>
                      <SelectCustom
                        options={places}
                        name="place"
                        onChange={(v) => handleChange({ currentTarget: { value: v, name: 'place' } })}
                        isClearable={false}
                        value={values.place}
                        placeholder={' -- Choisir -- '}
                        getOptionValue={(i) => i._id}
                        getOptionLabel={(i) => i.name}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom
                  color="info"
                  onClick={() => !isSubmitting && handleSubmit()}
                  disabled={!!isSubmitting}
                  title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default Places;
