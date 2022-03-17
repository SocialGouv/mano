/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Col, Row, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap';
import { toastr } from 'react-redux-toastr';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Formik } from 'formik';

import ButtonCustom from './ButtonCustom';
import SelectUser from './SelectUser';
import { teamsState, userState } from '../recoil/auth';
import { useRecoilState, useRecoilValue } from 'recoil';
import { dateForDatePicker } from '../services/date';
import useApi from '../services/api';
import { passagesState, preparePassageForEncryption } from '../recoil/passages';
import SelectTeam from './SelectTeam';
import SelectPerson from './SelectPerson';

const EditPassage = ({ id, onFinished }) => {
  const user = useRecoilValue(userState);
  const teams = useRecoilValue(teamsState);
  const [open, setOpen] = useState(false);
  const API = useApi();

  const [passages, setPassages] = useRecoilState(passagesState);

  useEffect(() => {
    setOpen(!!id);
  }, [id]);

  const onCancelRequest = () => {
    setOpen(false);
    onFinished();
  };

  const passage = useMemo(() => passages.find((p) => p._id === id), [id]);

  return (
    <>
      <Modal isOpen={!!open && !!passage} toggle={onCancelRequest} size="lg">
        <ModalHeader toggle={onCancelRequest}>Éditer le passage</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={passage}
            onSubmit={async (body, actions) => {
              if (!body.user) return toastr.error('Erreur!', "L'utilisateur est obligatoire");
              if (!body.date) return toastr.error('Erreur!', 'La date est obligatoire');
              if (!body.team) return toastr.error('Erreur!', 'La date est obligatoire');
              const response = await API.put({
                path: `/passage/${id}`,
                body: preparePassageForEncryption(body),
              });
              if (response.ok) {
                setPassages((passages) =>
                  passages.map((p) => {
                    if (p._id === id) return response.decryptedData;
                    return p;
                  })
                );
              }
              if (!response.ok) return;
              setOpen(false);
              onFinished();
              toastr.success('Passage mis-à-jour');
              actions.setSubmitting(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Date</Label>
                      <div>
                        <DatePicker
                          locale="fr"
                          className="form-control"
                          selected={dateForDatePicker(values.date)}
                          onChange={(date) => handleChange({ target: { value: date, name: 'date' } })}
                          timeInputLabel="Heure :"
                          dateFormat="dd/MM/yyyy HH:mm"
                          showTimeInput
                        />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <SelectPerson value={values.person} onChange={handleChange} isClearable />
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Commentaire</Label>
                      <Input name="comment" type="textarea" value={values.comment} onChange={handleChange} id="update-passage-comment" />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Créé par</Label>
                      <SelectUser
                        inputId="update-passage-user-select"
                        value={values.user || user._id}
                        onChange={(userId) => handleChange({ target: { value: userId, name: 'user' } })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Sous l'équipe</Label>
                      <SelectTeam
                        teams={user.role === 'admin' ? teams : user.teams}
                        teamId={values.team}
                        onChange={(team) => handleChange({ target: { value: team._id, name: 'team' } })}
                        inputId="update-passage-team-select"
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom
                  type="submit"
                  color="info"
                  disabled={isSubmitting}
                  onClick={() => !isSubmitting && handleSubmit()}
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

export default EditPassage;
