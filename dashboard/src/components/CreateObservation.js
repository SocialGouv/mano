import React, { useState, useEffect } from 'react';
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader, Label } from 'reactstrap';
import DatePicker from 'react-datepicker';
import styled from 'styled-components';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import 'react-datepicker/dist/react-datepicker.css';

import { useTerritoryObservations } from '../recoil/territoryObservations';
import SelectTeam from './SelectTeam';
import ButtonCustom from './ButtonCustom';
import SelectCustom from './SelectCustom';
import CustomFieldInput from './CustomFieldInput';
import useAuth from '../recoil/auth';
import { useTerritories } from '../recoil/territory';
export const policeSelect = ['Oui', 'Non'];
export const atmosphereSelect = ['Violences', 'Tensions', 'RAS'];

const CreateObservation = ({ observation = {}, forceOpen = 0 }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen > 0) setOpen(true);
  }, [forceOpen]);

  const { user } = useAuth();
  const { addTerritoryObs, updateTerritoryObs, customFieldsObs } = useTerritoryObservations();
  const { territories } = useTerritories();

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
                createdAt: values.createdAt,
                team: values.team,
                user: user._id,
                territory: values.territory,
                _id: observation._id,
              };
              for (const customField of customFieldsObs.filter((f) => f.enabled)) {
                body[customField.name] = values[customField.name];
              }
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
                  {customFieldsObs
                    .filter((f) => f.enabled)
                    .map((field) => (
                      <CustomFieldInput values={values} handleChange={handleChange} field={field} key={field.name} />
                    ))}
                  <Col md={6}>
                    <FormGroup>
                      <Label>Observation faite le</Label>
                      <div>
                        <DatePicker
                          locale="fr"
                          className="form-control"
                          selected={values.createdAt ? new Date(values.createdAt) : new Date()}
                          onChange={(date) => handleChange({ target: { value: date, name: 'createdAt' } })}
                          timeInputLabel="Heure :"
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
