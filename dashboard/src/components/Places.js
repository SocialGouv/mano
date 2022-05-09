import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Col, FormGroup, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import { useHistory } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import Box from './Box';
import ButtonCustom from './ButtonCustom';
import { placesState } from '../recoil/places';
import Table from './table';
import SelectCustom from './SelectCustom';
import { currentTeamState, userState } from '../recoil/auth';
import { prepareRelPersonPlaceForEncryption, relsPersonPlaceState } from '../recoil/relPersonPlace';
import { formatDateWithFullMonth } from '../services/date';
import useApi from '../services/api';

const Places = ({ personId = '', onUpdateResults }) => {
  const history = useHistory();

  const places = useRecoilValue(placesState);
  const relsPersonPlace = useRecoilValue(relsPersonPlaceState);

  const data = relsPersonPlace
    .filter((relation) => relation.person === personId)
    .map((relation) => ({ ...relation, place: places.find((p) => p._id === relation.place) }));

  useEffect(() => {
    if (!!onUpdateResults) onUpdateResults(data.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

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
            { title: 'Ajouté le', dataKey: 'createdAt', render: (relation) => formatDateWithFullMonth(relation.createdAt) },
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

  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);

  const places = useRecoilValue(placesState);
  const setRelsPersonPlace = useSetRecoilState(relsPersonPlaceState);
  const API = useApi();

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
              const res = await API.post({
                path: '/relPersonPlace',
                body: prepareRelPersonPlaceForEncryption({ place: body.place._id, person: personId, user: user._id }),
              });
              if (res.ok) {
                setRelsPersonPlace((relsPersonPlace) => [res.decryptedData, ...relsPersonPlace]);
                toastr.success('Lieu ajouté !');
                setOpen(false);
              }
              actions.setSubmitting(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <label htmlFor="add-place-select-place">Lieu</label>
                      <SelectCustom
                        options={places}
                        name="place"
                        onChange={(v) => handleChange({ currentTarget: { value: v, name: 'place' } })}
                        isClearable={false}
                        value={values.place}
                        getOptionValue={(i) => i._id}
                        getOptionLabel={(i) => i.name}
                        inputId="add-place-select-place"
                        classNamePrefix="add-place-select-place"
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom
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
