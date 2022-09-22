import React, { useState } from 'react';
import { Col, Button, FormGroup, Row, Modal, ModalBody, ModalHeader, Input } from 'reactstrap';
import styled from 'styled-components';
import { Formik } from 'formik';
import { toast } from 'react-toastify';

import ButtonCustom from './ButtonCustom';
import { theme } from '../config';
import { useRecoilValue } from 'recoil';
import { userState } from '../recoil/auth';

const DeleteButtonAndConfirmModal = ({ title, children, textToConfirm, onConfirm, buttonWidth = null }) => {
  const user = useRecoilValue(userState);
  const [open, setOpen] = useState(false);
  return (
    <>
      <ButtonCustom
        title="Supprimer"
        color="danger"
        onClick={() => {
          if (!['admin', 'superadmin'].includes(user.role)) return toast.error("Désolé, seul un admin peut supprimer ce type d'élément");
          setOpen(true);
        }}
        width={buttonWidth}
      />
      <StyledModal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)} color="danger">
          <span style={{ color: theme.redDark, textAlign: 'center', display: 'block' }}>{title}</span>
        </ModalHeader>
        <ModalBody center>
          {children}
          <p style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
            Veuillez taper le texte ci-dessous pour confirmer
            <br />
            en respectant les majuscules, minuscules ou accents
            <br />
          </p>
          <p style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
            <b style={{ color: theme.redDark }}>{textToConfirm}</b>
          </p>
          <Formik
            initialValues={{ textToConfirm: '' }}
            onSubmit={async (values, { setSubmitting }) => {
              if (!values.textToConfirm) return toast.error('Veuillez rentrer le texte demandé');
              if (values.textToConfirm.trim().toLocaleLowerCase() !== textToConfirm.trim().toLocaleLowerCase()) {
                return toast.error('Le texte renseigné est incorrect');
              }
              if (values.textToConfirm.trim() !== textToConfirm.trim()) {
                return toast.error('Veuillez respecter les minuscules/majuscules');
              }
              await onConfirm();
              setOpen(false);
              setSubmitting(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row style={{ justifyContent: 'center' }}>
                  <Col md={6}>
                    <FormGroup>
                      <Input name="textToConfirm" value={values.textToConfirm} onChange={handleChange} />
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

export default DeleteButtonAndConfirmModal;
