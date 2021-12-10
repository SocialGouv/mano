import React, { useState } from 'react';
import { Col, Button, FormGroup, Row, Modal, ModalBody, ModalHeader, Input } from 'reactstrap';
import styled from 'styled-components';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import 'react-datepicker/dist/react-datepicker.css';
import { useRecoilValue } from 'recoil';

import ButtonCustom from './ButtonCustom';
import { theme } from '../config';
import useApi from '../services/api';
import { organisationState, userState } from '../recoil/auth';

const DeleteOrganisation = () => {
  const [open, setOpen] = useState(false);

  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);

  const API = useApi();

  if (!['admin'].includes(user.role)) return null;

  return (
    <>
      <ButtonCustom title="Supprimer l'organisation" color="danger" onClick={() => setOpen(true)} />
      <StyledModal isOpen={open} toggle={() => setOpen(false)} size="lg" centered>
        <ModalHeader toggle={() => setOpen(false)} color="danger">
          <span style={{ color: theme.redDark, textAlign: 'center', display: 'block' }}>Voulez-vous vraiment supprimer l'organisation ?</span>
        </ModalHeader>
        <ModalBody center>
          <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
            Cette opération est irréversible, et entrainera la suppression définitive de toutes les données liées à l'organisation : équipes,
            utilisateurs, personnes suivies, actions, territoires, commentaires et observations, rapports...
          </span>
          <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
            Veuillez taper le nom de l'organisation <b style={{ color: theme.redDark }}>{organisation.name}</b> pour confirmer
          </span>
          <Formik
            initialValues={{ name: '' }}
            onSubmit={async (values, actions) => {
              try {
                if (!values.name) return toastr.error('Erreur!', 'Le nom est obligatoire');
                if (values.name !== organisation.name) return toastr.error('Erreur!', "Le nom de l'organisation est incorrect");
                const res = await API.delete({ path: `/organisation/${organisation._id}` });
                actions.setSubmitting(false);
                if (res.ok) {
                  toastr.success('Organisation supprimée');
                  API.logout();
                }
              } catch (organisationDeleteError) {
                console.log('erreur in organisation delete', organisationDeleteError);
                toastr.error('Erreur!', organisationDeleteError.message);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row style={{ justifyContent: 'center' }}>
                  <Col md={6}>
                    <FormGroup>
                      <Input name="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <Row style={{ justifyContent: 'center' }}>
                  <Button color="danger" disabled={isSubmitting} onClick={() => !isSubmitting && handleSubmit()}>
                    Supprimer
                  </Button>
                </Row>
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </StyledModal>
    </>
  );
};

const StyledModal = styled(Modal)`
  align-items: center;
  .modal-title {
    width: 100%;
    flex-grow: 1;
    padding: auto;
  }
`;

export default DeleteOrganisation;
