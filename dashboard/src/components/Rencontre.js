import React, { useEffect, useState } from 'react';
import { Modal, Input, Col, Row, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap';
import { toastr } from 'react-redux-toastr';
import DatePicker from 'react-datepicker';
import { Formik } from 'formik';

import ButtonCustom from './ButtonCustom';
import SelectUser from './SelectUser';
import { teamsState, userState } from '../recoil/auth';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { dateForDatePicker } from '../services/date';
import useApi from '../services/api';
import { rencontresState, prepareRencontreForEncryption } from '../recoil/rencontres';
import SelectTeam from './SelectTeam';
import SelectPerson from './SelectPerson';

const Rencontre = ({ rencontre, onFinished }) => {
  const user = useRecoilValue(userState);
  const teams = useRecoilValue(teamsState);
  const [open, setOpen] = useState(false);
  const API = useApi();

  const setRencontres = useSetRecoilState(rencontresState);

  useEffect(() => {
    setOpen(!!rencontre);
  }, [rencontre]);

  const onCancelRequest = () => {
    setOpen(false);
    onFinished();
  };

  const onDeleteRencontre = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const rencontreRes = await API.delete({ path: `/rencontre/${rencontre._id}` });
      if (rencontreRes.ok) {
        toastr.success('Suppression réussie');
        setOpen(false);
        setRencontres((rencontres) => rencontres.filter((p) => p._id !== rencontre._id));
      }
    }
  };

  const isNew = !rencontre?._id;
  const isForPerson = !!rencontre?.person;
  const showMultiSelect = isNew && !isForPerson;

  return (
    <>
      <Modal isOpen={!!open && !!rencontre} toggle={onCancelRequest} size="lg" backdrop="static">
        <ModalHeader toggle={onCancelRequest}>{isNew ? 'Enregistrer une rencontre' : 'Éditer la rencontre'}</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ ...rencontre, anonymousNumberOfRencontres: 1, persons: rencontre?.person ? [rencontre.person] : [] }}
            onSubmit={async (body, actions) => {
              if (!body.user) return toastr.error('Erreur!', "L'utilisateur est obligatoire");
              if (!body.date) return toastr.error('Erreur!', 'La date est obligatoire');
              if (!body.team) return toastr.error('Erreur!', "L'équipe est obligatoire");
              if (!body.anonymous && (showMultiSelect ? !body.persons?.length : !body.person?.length))
                return toastr.error('Erreur!', 'Veuillez spécifier une personne');

              if (isNew) {
                const newRencontre = {
                  date: body.date,
                  team: body.team,
                  user: body.user,
                  comment: body.comment,
                };

                if (showMultiSelect) {
                  for (const person of body.persons) {
                    const response = await API.post({
                      path: '/rencontre',
                      body: prepareRencontreForEncryption({ ...newRencontre, person }),
                    });
                    if (response.ok) {
                      setRencontres((rencontres) => [response.decryptedData, ...rencontres]);
                    }
                  }
                } else {
                  const response = await API.post({
                    path: '/rencontre',
                    body: prepareRencontreForEncryption({ ...newRencontre, person: body.person }),
                  });
                  if (response.ok) {
                    setRencontres((rencontres) => [response.decryptedData, ...rencontres]);
                  }
                }

                setOpen(false);
                onFinished();
                toastr.success(body.person.length > 1 ? 'Rencontre enregistré' : 'Rencontres enregistrés');
                actions.setSubmitting(false);
                return;
              }
              const response = await API.put({
                path: `/rencontre/${rencontre._id}`,
                body: prepareRencontreForEncryption(body),
              });
              if (response.ok) {
                setRencontres((rencontres) =>
                  rencontres.map((p) => {
                    if (p._id === rencontre._id) return response.decryptedData;
                    return p;
                  })
                );
              }
              if (!response.ok) return;
              setOpen(false);
              onFinished();
              toastr.success('Rencontre mis à jour');
              actions.setSubmitting(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => {
              return (
                <React.Fragment>
                  <Row>
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
                        {showMultiSelect ? (
                          <SelectPerson value={values.persons} onChange={handleChange} isClearable isMulti name="persons" />
                        ) : (
                          <SelectPerson value={values.person} onChange={handleChange} />
                        )}
                      </FormGroup>
                    </Col>
                    <Col md={12}>
                      <FormGroup>
                        <Label htmlFor="update-rencontre-comment">Commentaire</Label>
                        <Input name="comment" type="textarea" value={values.comment} onChange={handleChange} id="update-rencontre-comment" />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="update-rencontre-user-select">Créé par</Label>
                        <SelectUser
                          inputId="update-rencontre-user-select"
                          value={values.user || user._id}
                          onChange={(userId) => handleChange({ target: { value: userId, name: 'user' } })}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="update-rencontre-team-select">Sous l'équipe</Label>
                        <SelectTeam
                          teams={user.role === 'admin' ? teams : user.teams}
                          teamId={values.team}
                          onChange={(team) => handleChange({ target: { value: team._id, name: 'team' } })}
                          inputId="update-rencontre-team-select"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <br />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    {!isNew && <ButtonCustom title="Supprimer" type="button" color="danger" onClick={onDeleteRencontre} />}
                    <ButtonCustom title="Enregistrer" loading={isSubmitting} onClick={() => !isSubmitting && handleSubmit()} />
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

export default Rencontre;
