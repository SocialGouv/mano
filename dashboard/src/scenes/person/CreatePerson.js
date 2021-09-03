/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useState } from 'react';
import { Col, Button as LinkButton, FormGroup, Row, Modal, ModalBody, ModalHeader, Input } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import personIcon from '../../assets/icons/person-icon.svg';

import ButtonCustom from '../../components/ButtonCustom';
import AuthContext from '../../contexts/auth';
import PersonsContext from '../../contexts/persons';
import RefreshContext from '../../contexts/refresh';

const CreatePerson = ({ refreshable }) => {
  const [open, setOpen] = useState(false);
  const { currentTeam } = useContext(AuthContext);
  const history = useHistory();
  const { addPerson, persons } = useContext(PersonsContext);
  const { refreshPersons, loading } = useContext(RefreshContext);

  return (
    <>
      {!!refreshable && (
        <LinkButton onClick={() => refreshPersons()} disabled={!!loading} color="link" style={{ marginRight: 10 }}>
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
              const res = await addPerson(body);
              actions.setSubmitting(false);
              const existingPerson = persons.find((p) => p.name === body.name);
              if (existingPerson) return toastr.error('Un utilisateur existe déjà à ce nom');
              if (res.ok) {
                toastr.success('Création réussie !');
                setOpen(false);
                history.push(`/person/${res.data._id}`);
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
    </>
  );
};

export default CreatePerson;
