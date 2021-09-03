import React, { useState, useEffect, useContext } from 'react';
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader, Input, Label } from 'reactstrap';
import DatePicker from 'react-datepicker';
import styled from 'styled-components';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import 'react-datepicker/dist/react-datepicker.css';

import AuthContext from '../contexts/auth';
import TerritoryObservationsContext from '../contexts/territoryObservations';
import SelectTeam from './SelectTeam';
import SelectAsInput from './SelectAsInput';
import ButtonCustom from './ButtonCustom';
import TerritoryContext from '../contexts/territory';
import SelectCustom from './SelectCustom';
export const policeSelect = ['Oui', 'Non'];
export const atmosphereSelect = ['Violences', 'Tensions', 'RAS'];

const CreateObservation = ({ observation = {}, forceOpen = 0 }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen > 0) setOpen(true);
  }, [forceOpen]);

  const { user } = useContext(AuthContext);
  const { addTerritoryObs, updateTerritoryObs } = useContext(TerritoryObservationsContext);
  const { territories } = useContext(TerritoryContext);

  return (
    <CreateStyle>
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>{observation._id ? "Modifier l'observation" : 'Créer une nouvelle observation'}</ModalHeader>
        <ModalBody>
          <Formik
            key={open}
            initialValues={observation}
            onSubmit={async (values, actions) => {
              if (!values.team) return toastr.error('Erreur!', "L'équipe est obligatoire");
              if (!values.territory) return toastr.error('Erreur!', 'Le territoire est obligatoire');
              const body = {
                personsMale: values.personsMale,
                personsFemale: values.personsFemale,
                police: values.police,
                material: values.material,
                atmosphere: values.atmosphere,
                mediation: values.mediation,
                comment: values.comment,
                createdAt: values.createdAt,
                team: values.team,
                territory: values.territory,
                _id: observation._id,
              };
              console.log({
                body,
              });
              const res = observation._id ? await updateTerritoryObs(body) : await addTerritoryObs(body);
              actions.setSubmitting(false);
              if (res.ok) {
                toastr.success(observation._id ? 'Observation mise-à-jour' : 'Création réussie !');
                setOpen(false);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nombre de personnes non connues hommes rencontrées</Label>
                      <Input name="personsMale" type="number" value={values.personsMale} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nombre de personnes non connues femmes rencontrées</Label>
                      <Input name="personsFemale" type="number" value={values.personsFemale} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Présence policière</Label>
                      <SelectAsInput options={policeSelect} name="police" value={values.police || ''} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nombre de matériel ramassé</Label>
                      <Input name="material" type="number" value={values.material} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Ambiance</Label>
                      <SelectAsInput options={atmosphereSelect} name="atmosphere" value={values.atmosphere || ''} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nombre de médiations avec les riverains / les structures</Label>
                      <Input name="mediation" type="number" value={values.mediation} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Commentaire</Label>
                      <Input name="comment" type="textarea" value={values.comment} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Observation faite le</Label>
                      <div>
                        <DatePicker
                          locale="fr"
                          className="form-control"
                          selected={values.createdAt ? new Date(values.createdAt) : new Date()}
                          onChange={(date) => handleChange({ target: { value: date, name: 'createdAt' } })}
                          timeInputLabel="Time:"
                          dateFormat="dd/MM/yyyy hh:mm"
                          showTimeInput
                        />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Sous l'équipe</Label>
                      <SelectTeam
                        teams={user.teams}
                        teamId={values.team}
                        onChange={(team) => handleChange({ target: { value: team._id, name: 'team' } })}
                        colored
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Territoire</Label>
                      <SelectCustom
                        options={territories}
                        name="place"
                        onChange={(territory) => handleChange({ currentTarget: { value: territory._id, name: 'territory' } })}
                        isClearable={false}
                        value={territories.find((i) => i._id === values.territory)}
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
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  onClick={() => !isSubmitting && handleSubmit()}
                  title="Sauvegarder"
                />
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

export default CreateObservation;
