import React, { useState } from 'react';
import { Col, Button as LinkButton, FormGroup, Row, Modal, ModalBody, ModalHeader, Input } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import personIcon from '../../assets/icons/person-icon.svg';

import ButtonCustom from '../../components/ButtonCustom';
import { currentTeamState } from '../../recoil/auth';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { refreshTriggerState, loadingState } from '../../components/Loader';
import useApi from '../../services/api';

const CreatePerson = ({ refreshable }) => {
  const [open, setOpen] = useState(false);
  const currentTeam = useRecoilValue(currentTeamState);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const history = useHistory();
  const [persons, setPersons] = useRecoilState(personsState);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const loading = useRecoilValue(loadingState);
  const API = useApi();

  return (
    <>
      {!!refreshable && (
        <LinkButton
          onClick={() => {
            setRefreshTrigger({
              status: true,
              options: { initialLoad: false, showFullScreen: false },
            });
          }}
          disabled={!!loading}
          color="link"
          style={{ marginRight: 10 }}>
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
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer une nouvelle personne</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: '' }}
            onSubmit={async (body, actions) => {
              if (!body.name?.trim()?.length) return toastr.error('Une personne doit avoir un nom');
              const existingPerson = persons.find((p) => p.name === body.name);
              if (existingPerson) return toastr.error('Une personne existe déjà à ce nom');
              body.followedSince = new Date();
              const response = await API.post({
                path: '/person',
                body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)(body),
              });
              if (response.ok) {
                setPersons((persons) => [response.decryptedData, ...persons].sort((p1, p2) => p1.name.localeCompare(p2.name)));
                toastr.success('Création réussie !');
                setOpen(false);
                history.push(`/person/${response.decryptedData._id}`);
              }
              actions.setSubmitting(false);
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
                <ButtonCustom
                  color="info"
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
