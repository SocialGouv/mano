import React, { useState } from 'react';
import { Col, Button as LinkButton, FormGroup, Row, Modal, ModalBody, ModalHeader, Input, Label } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import personIcon from '../../assets/icons/person-icon.svg';

import ButtonCustom from '../../components/ButtonCustom';
import { currentTeamState, userState } from '../../recoil/auth';
import { personsState, usePreparePersonForEncryption } from '../../recoil/persons';
import { useRecoilState, useRecoilValue } from 'recoil';
import useApi from '../../services/api';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import { useDataLoader } from '../../components/DataLoader';
import useCreateReportAtDateIfNotExist from '../../services/useCreateReportAtDateIfNotExist';
import dayjs from 'dayjs';

const CreatePerson = ({ refreshable }) => {
  const [open, setOpen] = useState(false);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const history = useHistory();
  const [persons, setPersons] = useRecoilState(personsState);
  const preparePersonForEncryption = usePreparePersonForEncryption();
  const API = useApi();
  const { refresh, isLoading } = useDataLoader();
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

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
              if (!body.name?.trim()?.length) return toast.error('Une personne doit avoir un nom');
              const existingPerson = persons.find((p) => p.name === body.name);
              if (existingPerson) return toast.error('Une personne existe déjà à ce nom');
              body.followedSince = dayjs();
              body.user = user._id;
              const response = await API.post({
                path: '/person',
                body: preparePersonForEncryption(body),
              });
              if (response.ok) {
                setPersons((persons) => [response.decryptedData, ...persons].sort((p1, p2) => (p1.name || '').localeCompare(p2.name || '')));
                toast.success('Création réussie !');
                setOpen(false);
                actions.setSubmitting(false);
                history.push(`/person/${response.decryptedData._id}`);
                await createReportAtDateIfNotExist(dayjs());
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
                        onChange={(teamIds) => handleChange({ target: { value: teamIds, name: 'assignedTeams' } })}
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
