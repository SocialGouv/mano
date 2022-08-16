import React, { useState } from 'react';
import { Col, Button as LinkButton, FormGroup, Row, Modal, ModalBody, ModalHeader, Input, Label } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import personIcon from '../../assets/icons/person-icon.svg';

import ButtonCustom from '../../components/ButtonCustom';
import { currentTeamState, userState } from '../../recoil/auth';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import useApi from '../../services/api';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import { useDataLoader } from '../../components/DataLoader';

const CreatePerson = ({ refreshable }) => {
  const [open, setOpen] = useState(false);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const history = useHistory();
  const [persons, setPersons] = useRecoilState(personsState);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const API = useApi();
  const { refresh, isLoading } = useDataLoader();

  return (
    <>
      {!!refreshable && (
        <LinkButton onClick={() => refresh()} disabled={isLoading} color="link" style={{ marginRight: 10 }}>
          Rafraichir
        </LinkButton>
      )}
      <ButtonCustom
        icon={personIcon}
        disabled={!currentTeam}
        onClick={() => setOpen(true)}
        color="primary"
        title="Créer une nouvelle personne"
        padding="12px 24px"
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
        <ModalHeader toggle={() => setOpen(false)}>Créer une nouvelle personne</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: '', assignedTeams: [currentTeam?._id] }}
            onSubmit={async (body, actions) => {
              if (!body.name?.trim()?.length) return toastr.error('Une personne doit avoir un nom');
              const existingPerson = persons.find((p) => p.name === body.name);
              if (existingPerson) return toastr.error('Une personne existe déjà à ce nom');
              body.followedSince = new Date();
              body.user = user._id;
              const response = await API.post({
                path: '/person',
                body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)(body),
              });
              if (response.ok) {
                setPersons((persons) => [response.decryptedData, ...persons].sort((p1, p2) => (p1.name || '').localeCompare(p2.name || '')));
                toastr.success('Création réussie !');
                setOpen(false);
                actions.setSubmitting(false);
                history.push(`/person/${response.decryptedData._id}`);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="name">Nom</Label>
                      <Input name="name" id="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="person-select-assigned-team">Équipe(s) en charge</Label>
                      <SelectTeamMultiple
                        onChange={(teams) => handleChange({ target: { value: teams || [], name: 'assignedTeams' } })}
                        value={values.assignedTeams}
                        colored
                        inputId="person-select-assigned-team"
                        classNamePrefix="person-select-assigned-team"
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom
                  onClick={() => !isSubmitting && handleSubmit()}
                  disabled={!!isSubmitting || !values.name?.trim()?.length}
                  title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </>
  );
};

export default CreatePerson;
