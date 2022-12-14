import React, { useState, useEffect } from 'react';
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader, Label } from 'reactstrap';
import DatePicker from 'react-datepicker';
import styled from 'styled-components';
import { Formik } from 'formik';
import { toast } from 'react-toastify';

import { customFieldsObsSelector, prepareObsForEncryption, territoryObservationsState } from '../recoil/territoryObservations';
import SelectTeam from './SelectTeam';
import ButtonCustom from './ButtonCustom';
import SelectCustom from './SelectCustom';
import CustomFieldInput from './CustomFieldInput';
import { currentTeamState, teamsState, userState } from '../recoil/auth';
import { territoriesState } from '../recoil/territory';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { dateForDatePicker, dayjsInstance } from '../services/date';
import useApi from '../services/api';
import useCreateReportAtDateIfNotExist from '../services/useCreateReportAtDateIfNotExist';
export const policeSelect = ['Oui', 'Non'];
export const atmosphereSelect = ['Violences', 'Tensions', 'RAS'];

const CreateObservation = ({ observation = {}, forceOpen = 0 }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen > 0) setOpen(true);
  }, [forceOpen]);

  const user = useRecoilValue(userState);
  const teams = useRecoilValue(teamsState);
  const team = useRecoilValue(currentTeamState);
  const territories = useRecoilValue(territoriesState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const setTerritoryObs = useSetRecoilState(territoryObservationsState);
  const API = useApi();
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const addTerritoryObs = async (obs) => {
    const res = await API.post({ path: '/territory-observation', body: prepareObsForEncryption(customFieldsObs)(obs) });
    if (res.ok) {
      setTerritoryObs((territoryObservations) =>
        [res.decryptedData, ...territoryObservations].sort((a, b) => new Date(b.observedAt || b.createdAt) - new Date(a.observedAt || a.createdAt))
      );
      await createReportAtDateIfNotExist(res.decryptedData.observedAt);
    }
    return res;
  };

  const updateTerritoryObs = async (obs) => {
    const res = await API.put({ path: `/territory-observation/${obs._id}`, body: prepareObsForEncryption(customFieldsObs)(obs) });
    if (res.ok) {
      setTerritoryObs((territoryObservations) =>
        territoryObservations
          .map((a) => {
            if (a._id === obs._id) return res.decryptedData;
            return a;
          })
          .sort((a, b) => new Date(b.observedAt || b.createdAt) - new Date(a.observedAt || a.createdAt))
      );
      await createReportAtDateIfNotExist(res.decryptedData.observedAt);
    }
    return res;
  };

  return (
    <CreateStyle>
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
        <ModalHeader toggle={() => setOpen(false)}>{observation._id ? "Modifier l'observation" : 'Créer une nouvelle observation'}</ModalHeader>
        <ModalBody>
          <Formik
            key={open}
            initialValues={observation}
            onSubmit={async (values, actions) => {
              if (!values.team) return toast.error("L'équipe est obligatoire");
              if (!values.territory) return toast.error('Le territoire est obligatoire');
              const body = {
                observedAt: values.observedAt || dayjsInstance(),
                team: values.team,
                user: values.user || user._id,
                territory: values.territory,
                _id: observation._id,
              };
              for (const customField of customFieldsObs.filter((f) => f).filter((f) => f.enabled || (f.enabledTeams || []).includes(team._id))) {
                body[customField.name] = values[customField.name];
              }
              const res = observation._id ? await updateTerritoryObs(body) : await addTerritoryObs(body);
              actions.setSubmitting(false);
              if (res.ok) {
                toast.success(observation._id ? 'Observation mise à jour' : 'Création réussie !');
                setOpen(false);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  {customFieldsObs
                    .filter((f) => f)
                    .filter((f) => f.enabled || (f.enabledTeams || []).includes(team._id))
                    .map((field) => (
                      <CustomFieldInput model="observation" values={values} handleChange={handleChange} field={field} key={field.name} />
                    ))}
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="observation-observedat">Observation faite le</Label>
                      <div>
                        <DatePicker
                          locale="fr"
                          name="observedAt"
                          className="form-control"
                          selected={dateForDatePicker((values.observedAt || values.createdAt) ?? new Date())}
                          onChange={(date) => handleChange({ target: { value: date, name: 'observedAt' } })}
                          timeInputLabel="Heure :"
                          dateFormat="dd/MM/yyyy HH:mm"
                          showTimeInput
                          id="observation-observedat"
                        />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="observation-select-team">Sous l'équipe</Label>
                      <SelectTeam
                        name="team"
                        teams={user.role === 'admin' ? teams : user.teams}
                        teamId={values.team}
                        onChange={(team) => handleChange({ target: { value: team._id, name: 'team' } })}
                        colored
                        inputId="observation-select-team"
                        classNamePrefix="observation-select-team"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="observation-select-territory">Territoire</Label>
                      <SelectCustom
                        options={territories}
                        name="place"
                        onChange={(territory) => handleChange({ currentTarget: { value: territory._id, name: 'territory' } })}
                        isClearable={false}
                        value={territories.find((i) => i._id === values.territory)}
                        getOptionValue={(i) => i._id}
                        getOptionLabel={(i) => i.name}
                        inputId="observation-select-territory"
                        classNamePrefix="observation-select-territory"
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom disabled={isSubmitting} loading={isSubmitting} onClick={() => !isSubmitting && handleSubmit()} title="Sauvegarder" />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </CreateStyle>
  );
};

const CreateStyle = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

export default CreateObservation;
