import React, { useEffect, useState } from 'react';
import { Modal, Input, Col, Row, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap';
import { toastr } from 'react-redux-toastr';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Formik } from 'formik';

import ButtonCustom from './ButtonCustom';
import SelectUser from './SelectUser';
import { teamsState, userState } from '../recoil/auth';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { dateForDatePicker } from '../services/date';
import useApi from '../services/api';
import { passagesState, preparePassageForEncryption } from '../recoil/passages';
import SelectTeam from './SelectTeam';
import SelectPerson from './SelectPerson';

const Passage = ({ passage, onFinished }) => {
  const user = useRecoilValue(userState);
  const teams = useRecoilValue(teamsState);
  const [open, setOpen] = useState(false);
  const API = useApi();

  const setPassages = useSetRecoilState(passagesState);

  useEffect(() => {
    setOpen(!!passage);
  }, [passage]);

  const onCancelRequest = () => {
    setOpen(false);
    onFinished();
  };

  const onDeletePassage = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const passageRes = await API.delete({ path: `/passage/${passage._id}` });
      if (passageRes.ok) {
        toastr.success('Suppression réussie');
        setOpen(false);
        setPassages((passages) => passages.filter((p) => p._id !== passage._id));
      }
    }
  };

  const isNew = !passage?._id;
  const isForPerson = !!passage?.person;

  return (
    <>
      <Modal isOpen={!!open && !!passage} toggle={onCancelRequest} size="lg" backdrop="static">
        <ModalHeader toggle={onCancelRequest}>{isNew ? 'Enregistrer un passage' : 'Éditer le passage'}</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ ...passage, anonymousNumberOfPassages: 1, persons: passage?.person ? [passage.person] : [] }}
            onSubmit={async (body, actions) => {
              if (!body.user) return toastr.error('Erreur!', "L'utilisateur est obligatoire");
              if (!body.date) return toastr.error('Erreur!', 'La date est obligatoire');
              if (!body.team) return toastr.error('Erreur!', "L'équipe est obligatoire");
              if (body.anonymous && !body.anonymousNumberOfPassages)
                return toastr.error('Erreur!', 'Veuillez spécifier le nombre de passages anonymes');
              if (!body.anonymous && !body.persons?.length) return toastr.error('Erreur!', 'Veuillez spécifier une personne');

              if (isNew) {
                const newPassage = {
                  date: body.date,
                  team: body.team,
                  user: body.user,
                  comment: body.comment,
                };

                if (body.anonymous) {
                  for (let i = 0; i < body.anonymousNumberOfPassages; i++) {
                    const response = await API.post({
                      path: '/passage',
                      body: preparePassageForEncryption(newPassage),
                    });
                    if (response.ok) {
                      setPassages((passages) => [response.decryptedData, ...passages]);
                    }
                  }
                } else {
                  for (const person of body.persons) {
                    const response = await API.post({
                      path: '/passage',
                      body: preparePassageForEncryption({ ...newPassage, person }),
                    });
                    if (response.ok) {
                      setPassages((passages) => [response.decryptedData, ...passages]);
                    }
                  }
                }

                setOpen(false);
                onFinished();
                toastr.success(body.person.length > 1 ? 'Passage enregistré' : 'Passages enregistrés');
                actions.setSubmitting(false);
                return;
              }
              const response = await API.put({
                path: `/passage/${passage._id}`,
                body: preparePassageForEncryption(body),
              });
              if (response.ok) {
                setPassages((passages) =>
                  passages.map((p) => {
                    if (p._id === passage._id) return response.decryptedData;
                    return p;
                  })
                );
              }
              if (!response.ok) return;
              setOpen(false);
              onFinished();
              toastr.success('Passage mis à jour');
              actions.setSubmitting(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => {
              return (
                <React.Fragment>
                  <Row>
                    {!!isNew && !isForPerson && (
                      <Col md={12}>
                        <FormGroup>
                          <Label htmlFor="create-anonymous-passages">
                            <input
                              type="checkbox"
                              id="create-anonymous-passages"
                              style={{ marginRight: '0.5rem' }}
                              name="anonymous"
                              checked={values.anonymous}
                              onChange={() => handleChange({ target: { value: !values.anonymous, name: 'anonymous' } })}
                            />
                            Passage(s) anonyme(s) <br />
                            <small className="text-muted">Cochez cette case pour enregistrer plutôt des passages anonymes</small>
                          </Label>
                        </FormGroup>
                      </Col>
                    )}
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="date">Date</Label>
                        <div>
                          <DatePicker
                            id="date"
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
                        {values.anonymous ? (
                          <>
                            <Label htmlFor="number-of-anonymous-passages">Nombre de passages anonymes</Label>
                            <Input
                              name="anonymousNumberOfPassages"
                              type="number"
                              value={values.anonymousNumberOfPassages}
                              onChange={handleChange}
                              id="number-of-anonymous-passages"
                            />
                          </>
                        ) : isNew && !isForPerson ? (
                          <SelectPerson value={values.persons} onChange={handleChange} isClearable isMulti name="persons" />
                        ) : (
                          <SelectPerson value={values.person} onChange={handleChange} />
                        )}
                      </FormGroup>
                    </Col>
                    <Col md={12}>
                      <FormGroup>
                        <Label htmlFor="update-passage-comment">Commentaire</Label>
                        <Input name="comment" type="textarea" value={values.comment} onChange={handleChange} id="update-passage-comment" />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="update-passage-user-select">Créé par</Label>
                        <SelectUser
                          inputId="update-passage-user-select"
                          value={values.user || user._id}
                          onChange={(userId) => handleChange({ target: { value: userId, name: 'user' } })}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="update-passage-team-select">Sous l'équipe</Label>
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {!isNew && (
                      <ButtonCustom
                        title="Supprimer"
                        type="button"
                        style={{ marginRight: 10 }}
                        color="danger"
                        onClick={onDeletePassage}
                        width={200}
                      />
                    )}
                    <ButtonCustom title="Enregistrer" loading={isSubmitting} onClick={() => !isSubmitting && handleSubmit()} width={200} />
                  </div>
                </React.Fragment>
              );
            }}
          </Formik>
        </ModalBody>
      </Modal>
    </>
  );
};

export default Passage;
