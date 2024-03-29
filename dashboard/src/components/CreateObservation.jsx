import React, { useState, useEffect } from "react";
import { Col, FormGroup, Row, Label } from "reactstrap";
import styled from "styled-components";
import { Formik } from "formik";
import { toast } from "react-toastify";

import {
  customFieldsObsSelector,
  groupedCustomFieldsObsSelector,
  prepareObsForEncryption,
  territoryObservationsState,
} from "../recoil/territoryObservations";
import SelectTeam from "./SelectTeam";
import ButtonCustom from "./ButtonCustom";
import SelectCustom from "./SelectCustom";
import CustomFieldInput from "./CustomFieldInput";
import { currentTeamState, teamsState, userState } from "../recoil/auth";
import { territoriesState } from "../recoil/territory";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { dayjsInstance, outOfBoundariesDate } from "../services/date";
import API from "../services/api";
import useCreateReportAtDateIfNotExist from "../services/useCreateReportAtDateIfNotExist";
import DatePicker from "./DatePicker";
import { ModalBody, ModalContainer, ModalHeader, ModalFooter } from "./tailwind/Modal";

const CreateObservation = ({ observation = {}, forceOpen = 0 }) => {
  const user = useRecoilValue(userState);
  const teams = useRecoilValue(teamsState);
  const team = useRecoilValue(currentTeamState);
  const territories = useRecoilValue(territoriesState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const groupedCustomFieldsObs = useRecoilValue(groupedCustomFieldsObsSelector);
  const setTerritoryObservations = useSetRecoilState(territoryObservationsState);
  const fieldsGroupNames = groupedCustomFieldsObs.map((f) => f.name).filter((f) => f);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(fieldsGroupNames[0]);

  useEffect(() => {
    if (forceOpen > 0) setOpen(true);
  }, [forceOpen]);

  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const addTerritoryObs = async (obs) => {
    const res = await API.post({ path: "/territory-observation", body: prepareObsForEncryption(customFieldsObs)(obs) });
    if (res.ok) {
      setTerritoryObservations((territoryObservations) =>
        [res.decryptedData, ...territoryObservations].sort((a, b) => new Date(b.observedAt || b.createdAt) - new Date(a.observedAt || a.createdAt))
      );
      await createReportAtDateIfNotExist(res.decryptedData.observedAt);
    }
    return res;
  };

  const updateTerritoryObs = async (obs) => {
    const res = await API.put({ path: `/territory-observation/${obs._id}`, body: prepareObsForEncryption(customFieldsObs)(obs) });
    if (res.ok) {
      setTerritoryObservations((territoryObservations) =>
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

  const onDelete = async (id) => {
    const confirm = window.confirm("Êtes-vous sûr ?");
    if (confirm) {
      const res = await API.delete({ path: `/territory-observation/${id}` });
      if (res.ok) {
        setTerritoryObservations((territoryObservations) => territoryObservations.filter((p) => p._id !== id));
      }
      if (!res.ok) return;
      toast.success("Suppression réussie");
      setOpen(false);
    }
  };

  return (
    <CreateStyle>
      <Formik
        key={open}
        initialValues={observation}
        onSubmit={async (values, actions) => {
          if (!values.team) return toast.error("L'équipe est obligatoire");
          if (!values.territory) return toast.error("Le territoire est obligatoire");
          if (values.observedAt && outOfBoundariesDate(values.observedAt))
            return toast.error("La date d'observation est hors limites (entre 1900 et 2100)");
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
            toast.success(observation._id ? "Observation mise à jour" : "Création réussie !");
            setOpen(false);
          }
        }}
      >
        {({ values, handleChange, handleSubmit, isSubmitting }) => (
          <ModalContainer open={open} onClose={() => setOpen(false)} size="full">
            <ModalHeader title={observation._id ? "Modifier l'observation" : "Créer une nouvelle observation"} />
            <ModalBody>
              <div className="tw-flex tw-h-full tw-w-full tw-flex-col">
                {groupedCustomFieldsObs.length > 1 && (
                  <nav className="noprint tw-flex tw-w-full" aria-label="Tabs">
                    <ul className={`tw-w-full tw-list-none tw-flex tw-gap-2 tw-px-3 tw-py-2 tw-border-b tw-border-main tw-border-opacity-20`}>
                      {fieldsGroupNames.map((name) => (
                        <li key={name}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab(name);
                            }}
                            className={[
                              activeTab === name ? "tw-bg-main/10 tw-text-black" : "tw-hover:text-gray-700 tw-text-main",
                              "tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-font-medium",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
                <div className="tw-p-4 tw-min-h-[30vh] tw-grow">
                  {groupedCustomFieldsObs.map((group) => (
                    <Row key={group.name} hidden={group.name !== activeTab}>
                      {group.fields
                        .filter((f) => f)
                        .filter((f) => f.enabled || (f.enabledTeams || []).includes(team._id))
                        .map((field) => (
                          <CustomFieldInput model="observation" values={values} handleChange={handleChange} field={field} key={field.name} />
                        ))}
                    </Row>
                  ))}
                </div>
                <div className="tw-p-4">
                  <Row>
                    <Col md={12}>
                      <hr />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <FormGroup>
                        <Label htmlFor="observation-observedat">Observation faite le</Label>
                        <div>
                          <DatePicker
                            withTime
                            id="observation-observedat"
                            name="observedAt"
                            defaultValue={(values.observedAt || values.createdAt) ?? new Date()}
                            onChange={handleChange}
                          />
                        </div>
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label htmlFor="observation-select-team">Sous l'équipe</Label>
                        <SelectTeam
                          menuPlacement="top"
                          name="team"
                          teams={user.role === "admin" ? teams : user.teams}
                          teamId={values.team}
                          onChange={(team) => handleChange({ target: { value: team._id, name: "team" } })}
                          colored
                          inputId="observation-select-team"
                          classNamePrefix="observation-select-team"
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label htmlFor="observation-select-territory">Territoire</Label>
                        <SelectCustom
                          menuPlacement="top"
                          options={territories}
                          name="place"
                          onChange={(territory) => handleChange({ currentTarget: { value: territory._id, name: "territory" } })}
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
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <button className="button-cancel" onClick={() => setOpen(false)}>
                Annuler
              </button>
              {observation._id ? (
                <button className="button-destructive !tw-ml-0" onClick={() => onDelete(observation._id)}>
                  Supprimer
                </button>
              ) : null}
              <ButtonCustom disabled={isSubmitting} loading={isSubmitting} onClick={() => !isSubmitting && handleSubmit()} title="Sauvegarder" />
            </ModalFooter>
          </ModalContainer>
        )}
      </Formik>
    </CreateStyle>
  );
};

const CreateStyle = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

export default CreateObservation;
