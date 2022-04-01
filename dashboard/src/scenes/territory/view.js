import React, { useState } from 'react';
import { Row, Col, FormGroup, Input, Label, Button as CloseButton, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useParams, useHistory } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
import { Formik } from 'formik';
import styled from 'styled-components';
import 'react-datepicker/dist/react-datepicker.css';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from 'react-datepicker';
import { SmallerHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import Box from '../../components/Box';
import ButtonCustom from '../../components/ButtonCustom';
import SelectCustom from '../../components/SelectCustom';
import { territoryTypes, territoriesState, prepareTerritoryForEncryption } from '../../recoil/territory';
import { useRecoilState, useSetRecoilState, useRecoilValue } from 'recoil';
import { refreshTriggerState } from '../../components/Loader';
import useApi from '../../services/api';
import { customFieldsObsSelector } from '../../recoil/territoryObservations';
import { teamsState, userState } from '../../recoil/auth';
import UserName from '../../components/UserName';
import { dateForDatePicker, formatDateTimeWithNameOfDay } from '../../services/date';
import CustomFieldDisplay from '../../components/CustomFieldDisplay';
import CustomFieldInput from '../../components/CustomFieldInput';
import SelectTeam from '../../components/SelectTeam';

const View = () => {
  const { id } = useParams();
  const history = useHistory();
  const user = useRecoilValue(userState);
  const [openObservationModale, setOpenObservationModale] = useState(false);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const [observation, setObservation] = useState({});
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const territory = territories.find((t) => t._id === id);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const API = useApi();

  async function deleteData() {
    if (!window.confirm('Êtes-vous sûr·e de vouloir supprimer ce territoire et toutes ses observations ?')) return;
    const res = await API.delete({ path: `/territory/${id}` });
    if (res.ok) {
      setTerritories((territories) => territories.filter((t) => t._id !== id));
      toastr.success('Suppression réussie');
      history.goBack();
    }
    return res;
  }

  async function updateTerritory(data) {
    const res = await API.put({
      path: `/territory/${territory._id}`,
      body: prepareTerritoryForEncryption(data),
    });
    if (res.ok) {
      setTerritories((territories) =>
        territories.map((a) => {
          if (a._id === territory._id) return res.decryptedData;
          return a;
        })
      );
      toastr.success('Mis à jour !');
    }
  }

  async function deleteObservation(observationIdToDelete) {
    if (!window.confirm('Êtes-vous sûr·e de vouloir supprimer cette observation ?')) return;
    await updateTerritory({
      ...territory,
      observations: territory.observations.filter((o) => o._id !== observationIdToDelete),
    });
  }

  if (!territory) return <Loading />;

  return (
    <>
      <SmallerHeaderWithBackButton
        onRefresh={() =>
          setRefreshTrigger({
            status: true,
            options: { initialLoad: false, showFullScreen: false },
          })
        }
      />
      <Box>
        <Formik
          initialValues={territory}
          onSubmit={async (body) => {
            await updateTerritory(body);
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => {
            return (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nom</Label>
                      <Input name="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>Types</Label>
                      <SelectCustom
                        options={territoryTypes}
                        name="types"
                        onChange={(v) => handleChange({ currentTarget: { value: v, name: 'types' } })}
                        isClearable={false}
                        isMulti
                        value={values.types}
                        placeholder={' -- Choisir -- '}
                        getOptionValue={(i) => i}
                        getOptionLabel={(i) => i}
                        inputId="territory-select-types"
                        classNamePrefix="territory-select-types"
                      />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>Périmètre</Label>
                      <Input name="perimeter" value={values.perimeter} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} width={200} />
                  <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                </div>
              </React.Fragment>
            );
          }}
        </Formik>
      </Box>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col md={9}>
          <Title>Observations</Title>
        </Col>
      </Row>
      <Box>
        <Row style={{ marginBottom: '30px', justifyContent: 'flex-end' }}>
          <Col md={3}>
            <ButtonCustom
              onClick={() => {
                setObservation({});
                setOpenObservationModale(true);
              }}
              color="primary"
              title="Nouvelle observation"
              padding="12px 24px"
            />
          </Col>
        </Row>
        {territory.observations.map((obs) => (
          <Observation
            key={obs._id}
            obs={obs}
            onDelete={deleteObservation}
            onClick={() => {
              setObservation(obs);
              setOpenObservationModale(true);
            }}
          />
        ))}
      </Box>
      <Modal isOpen={openObservationModale} toggle={() => setOpenObservationModale(false)} size="lg">
        <ModalHeader toggle={() => setOpenObservationModale(false)}>
          {observation._id ? "Modifier l'observation" : 'Créer une nouvelle observation'}
        </ModalHeader>
        <ModalBody>
          <Formik
            // MAYBE IT SHOULD BE RESOLVED.
            // key={openObservationModale}
            initialValues={observation}
            onSubmit={async (values, actions) => {
              if (!values.team) return toastr.error('Erreur!', "L'équipe est obligatoire");
              const updatedObservation = {
                observedAt: values.observedAt,
                team: values.team,
                user: values.user || user._id,
                _id: observation._id || uuidv4(),
              };
              for (const customField of customFieldsObs.filter((f) => f).filter((f) => f.enabled)) {
                updatedObservation[customField.name] = values[customField.name];
              }
              await updateTerritory({
                ...territory,
                observations: [...territory.observations.filter((o) => o._id !== observation._id), updatedObservation],
              });
              actions.setSubmitting(false);
              setOpenObservationModale(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  {customFieldsObs
                    .filter((f) => f)
                    .filter((f) => f.enabled)
                    .map((field) => (
                      <CustomFieldInput model="observation" values={values} handleChange={handleChange} field={field} key={field.name} />
                    ))}
                  <Col md={6}>
                    <FormGroup>
                      <Label>Observation faite le</Label>
                      <div>
                        <DatePicker
                          locale="fr"
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
                      <Label>Sous l'équipe</Label>
                      <SelectTeam
                        teams={user.teams}
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
                      <Label>Territoire</Label>
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
                <ButtonCustom
                  color="info"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  onClick={() => !isSubmitting && handleSubmit()}
                  title="Sauvegarder"
                />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </>
  );
};

const fieldIsEmpty = (value) => {
  if (value === null) return true;
  if (value === undefined) return true;
  if (typeof value === 'string' && !value.length) return true;
  if (Array.isArray(value) && !value.length) return true;
  return false;
};

const Observation = ({ obs, onDelete, onClick, noBorder }) => {
  const teams = useRecoilValue(teamsState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);

  return (
    <StyledObservation noBorder={noBorder}>
      {!!onDelete && <CloseButton close onClick={() => onDelete(obs._id)} />}
      <div style={{ display: 'flex' }}>
        <UserName id={obs.user} wrapper={(name) => <span className="author">{name}</span>} />
        <i style={{ marginLeft: 10 }}>(équipe {teams.find((t) => obs.team === t._id)?.name})</i>
      </div>
      <div className="time">{formatDateTimeWithNameOfDay(obs.observedAt || obs.createdAt)}</div>
      <div onClick={onClick ? () => onClick(obs) : null} className="content">
        {customFieldsObs
          .filter((f) => f)
          .filter((f) => f.enabled)
          .map((field) => {
            const { name, label } = field;
            return (
              <Item key={name} fieldIsEmpty={fieldIsEmpty(obs[name])}>
                {label}: <CustomFieldDisplay field={field} value={obs[field.name]} />
              </Item>
            );
          })}
      </div>
    </StyledObservation>
  );
};

const Title = styled.h1`
  font-size: 20px;
  font-weight: 800;
`;

const Item = styled.span`
  display: inline-block;
  ${(props) => props.fieldIsEmpty && 'opacity: 0.25;'}
`;

const StyledObservation = styled.div`
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  ${(props) => !props.noBorder && 'border-top: 1px solid #cacaca;'}
  .author {
    font-weight: bold;
    color: #0056b3;
  }
  .territory {
    font-weight: bold;
    /* font-size: 1.2em; */
  }
  .content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-top: 8px;
    font-style: italic;
    &:hover {
      cursor: pointer;
    }
  }
  .time {
    font-size: 10px;
    color: #9b9999;
    font-style: italic;
  }
`;

export default View;
