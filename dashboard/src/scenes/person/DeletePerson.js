import React, { useState } from 'react';
import { Col, Button, FormGroup, Row, Modal, ModalBody, ModalHeader, Input } from 'reactstrap';
import styled from 'styled-components';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import 'react-datepicker/dist/react-datepicker.css';
import { useRecoilState, useSetRecoilState } from 'recoil';

import ButtonCustom from '../../components/ButtonCustom';
import { theme } from '../../config';
import useApi from '../../services/api';
import { actionsState } from '../../recoil/actions';
import { personsState } from '../../recoil/persons';
import { useHistory } from 'react-router-dom';
import { commentsState } from '../../recoil/comments';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';

const DeletePerson = ({ person }) => {
  const [open, setOpen] = useState(false);
  const setPersons = useSetRecoilState(personsState);
  const [actions, setActions] = useRecoilState(actionsState);
  const [comments, setComments] = useRecoilState(commentsState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const API = useApi();
  const history = useHistory();

  return (
    <>
      <ButtonCustom title="Supprimer" color="danger" style={{ marginRight: 10 }} onClick={() => setOpen(true)} />
      <StyledModal isOpen={open} toggle={() => setOpen(false)} size="lg" centered>
        <ModalHeader toggle={() => setOpen(false)} color="danger">
          <span style={{ color: theme.redDark, textAlign: 'center', display: 'block' }}>Voulez-vous vraiment supprimer {person.name}</span>
        </ModalHeader>
        <ModalBody center>
          <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
            Cette opération est irréversible
            <br />
            et entrainera la suppression définitive de toutes les données liées à la personne&nbsp;:
            <br />
            actions, commentaires, lieux visités, passages, documents...
          </span>
          <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
            Veuillez taper le nom de la personne pour confirmer
            <br />
            en respectant les majuscules, minuscules ou accents
            <br />
            <b style={{ color: theme.redDark }}>{person.name}</b>
          </span>
          <Formik
            initialValues={{ name: '' }}
            onSubmit={async (values, { setSubmitting }) => {
              if (!values.name) return toastr.error('Le nom est obligatoire');
              if (values.name.trim().toLocaleLowerCase() !== person.name.trim().toLocaleLowerCase()) {
                return toastr.error('Le nom de la personne est incorrect');
              }
              if (values.name.trim() !== person.name.trim()) {
                return toastr.error('Veuillez respecter les minuscules/majuscules');
              }
              const personRes = await API.delete({ path: `/person/${person._id}` });
              if (personRes.ok) {
                setPersons((persons) => persons.filter((p) => p._id !== person._id));
                for (const action of actions.filter((a) => a.person === person._id)) {
                  const actionRes = await API.delete({ path: `/action/${action._id}` });
                  if (actionRes.ok) {
                    setActions((actions) => actions.filter((a) => a._id !== action._id));
                    for (let comment of comments.filter((c) => c.action === action._id)) {
                      const commentRes = await API.delete({ path: `/comment/${comment._id}` });
                      if (commentRes.ok) setComments((comments) => comments.filter((c) => c._id !== comment._id));
                    }
                  }
                }
                for (let comment of comments.filter((c) => c.person === person._id)) {
                  const commentRes = await API.delete({ path: `/comment/${comment._id}` });
                  if (commentRes.ok) setComments((comments) => comments.filter((c) => c._id !== comment._id));
                }
                for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.person === person._id)) {
                  const relRes = await API.delete({ path: `/relPersonPlace/${relPersonPlace._id}` });
                  if (relRes.ok) {
                    setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel._id !== relPersonPlace._id));
                  }
                }
              }
              if (personRes?.ok) {
                toastr.success('Suppression réussie');
                history.goBack();
              }
              setSubmitting(false);
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

export default DeletePerson;
