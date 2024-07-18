import { Col, FormGroup, Input, Label, Row } from "reactstrap";
import structuredClone from "@ungap/structured-clone";
import SelectAsInput from "../../../components/SelectAsInput";
import {
  allowedPersonFieldsInHistorySelector,
  customFieldsPersonsSelector,
  fieldsPersonsCustomizableOptionsSelector,
  flattenedCustomFieldsPersonsSelector,
  personFieldsSelector,
  personsState,
  usePreparePersonForEncryption,
} from "../../../recoil/persons";
import { dayjsInstance, outOfBoundariesDate } from "../../../services/date";
import SelectTeamMultiple from "../../../components/SelectTeamMultiple";
import { currentTeamState, teamsState, userState } from "../../../recoil/auth";
import { useRecoilState, useRecoilValue } from "recoil";
import CustomFieldInput from "../../../components/CustomFieldInput";
import { useMemo, useState } from "react";
import ButtonCustom from "../../../components/ButtonCustom";
import { Formik } from "formik";
import { toast } from "react-toastify";
import API, { tryFetchExpectOk } from "../../../services/api";
import DatePicker from "../../../components/DatePicker";
import { customFieldsMedicalFileSelector, encryptMedicalFile, groupedCustomFieldsMedicalFileSelector } from "../../../recoil/medicalFiles";
import { useDataLoader } from "../../../components/DataLoader";
import { cleanHistory } from "../../../utils/person-history";
import { ModalContainer, ModalHeader, ModalBody, ModalFooter } from "../../../components/tailwind/Modal";
import SelectCustom from "../../../components/SelectCustom";

export default function EditModal({ person, selectedPanel, onClose, isMedicalFile = false }) {
  const { refresh } = useDataLoader();
  const [openPanels, setOpenPanels] = useState([selectedPanel]);
  const user = useRecoilValue(userState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);
  const flattenedCustomFieldsPersons = useRecoilValue(flattenedCustomFieldsPersonsSelector);
  const allowedFieldsInHistory = useRecoilValue(allowedPersonFieldsInHistorySelector);
  const team = useRecoilValue(currentTeamState);
  const [persons] = useRecoilState(personsState);
  const flatCustomFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const groupedCustomFieldsMedicalFile = useRecoilValue(groupedCustomFieldsMedicalFileSelector);
  const [isOutOfTeamsModalOpen, setIsOutOfTeamsModalOpen] = useState(false);
  const [updatedPersonFormValues, setUpdatedPersonFormValues] = useState();
  const medicalFile = person.medicalFile;

  const groupedCustomFieldsMedicalFileWithLegacyFields = useMemo(() => {
    const c = structuredClone(groupedCustomFieldsMedicalFile);
    const structureMedical = flattenedCustomFieldsPersons.find((e) => e.name === "structureMedical");
    if (structureMedical) {
      c[0].fields = [structureMedical, ...c[0].fields];
    }
    const healthInsurances = flattenedCustomFieldsPersons.find((e) => e.name === "healthInsurances");
    if (healthInsurances) {
      c[0].fields = [healthInsurances, ...c[0].fields];
    }
    return c;
  }, [groupedCustomFieldsMedicalFile, flattenedCustomFieldsPersons]);

  const { encryptPerson } = usePreparePersonForEncryption();
  const personFields = useRecoilValue(personFieldsSelector);

  async function saveAndClose(body, outOfActiveListReasons = null) {
    body.entityKey = person.entityKey;

    const historyEntry = {
      date: new Date(),
      user: user._id,
      userName: user.name,
      data: {},
    };
    for (const key in body) {
      if (!allowedFieldsInHistory.includes(key)) continue;
      if (body[key] !== person[key]) historyEntry.data[key] = { oldValue: person[key], newValue: body[key] };
      if (key === "assignedTeams" && outOfActiveListReasons && Object.keys(outOfActiveListReasons).length) {
        historyEntry.data["outOfTeamsInformations"] = Object.entries(outOfActiveListReasons).map(([team, reasons]) => ({ team, reasons }));
      }
    }
    if (Object.keys(historyEntry.data).length) body.history = [...cleanHistory(person.history || []), historyEntry];
    const [error] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/person/${person._id}`,
        body: await encryptPerson(body),
      })
    );
    if (!error) {
      await refresh();
      toast.success("Mis à jour !");
      onClose();
    } else {
      toast.error("Erreur de l'enregistrement, les données n'ont pas été enregistrées");
    }
  }

  return (
    <>
      <OutOfTeamsModal
        open={isOutOfTeamsModalOpen}
        onClose={(outOfActiveListReasons) => {
          setIsOutOfTeamsModalOpen(false);
          saveAndClose(updatedPersonFormValues, outOfActiveListReasons);
        }}
        removedTeams={isOutOfTeamsModalOpen ? person.assignedTeams.filter((t) => !updatedPersonFormValues.assignedTeams.includes(t)) : []}
      />
      <ModalContainer open={true} toggle={() => onClose()} size="4xl" backdrop="static">
        <ModalHeader title={`Modifier ${person.name}`} />
        <ModalBody>
          <div className="tw-p-4">
            <Formik
              enableReinitialize
              initialValues={updatedPersonFormValues || person}
              onSubmit={async (body) => {
                if (!body.name?.trim()?.length) {
                  setOpenPanels(["main"]);
                  return toast.error("Une personne doit avoir un nom");
                }
                const existingPerson = persons.find((p) => p.name === body.name && p._id !== person._id);
                if (existingPerson) {
                  setOpenPanels(["main"]);
                  return toast.error("Une personne existe déjà à ce nom");
                }
                if (!body.followedSince) body.followedSince = person.createdAt;
                if (!body.assignedTeams?.length) {
                  setOpenPanels(["main"]);
                  return toast.error("Une personne doit être suivie par au moins une équipe");
                }
                if (outOfBoundariesDate(body.followedSince)) {
                  setOpenPanels(["main"]);
                  return toast.error("La date de suivi est hors limites (entre 1900 et 2100)");
                }
                if (body.birthdate && outOfBoundariesDate(body.birthdate)) {
                  setOpenPanels(["main"]);
                  return toast.error("La date de naissance est hors limites (entre 1900 et 2100)");
                }
                if (body.birthdate && dayjsInstance(body.birthdate).isAfter(dayjsInstance())) {
                  setOpenPanels(["main"]);
                  return toast.error("La date de naissance ne peut pas être dans le futur");
                }
                if (body.wanderingAt && outOfBoundariesDate(body.wanderingAt)) {
                  setOpenPanels(["main"]);
                  return toast.error("La date temps passé en rue est hors limites (entre 1900 et 2100)");
                }

                // Ce state a deux utilités:
                // 1. Eviter un flash des anciennes valeurs au moment de l'enregistrement
                // 2. Retrouver les valeurs si on est passé par la modale de motifs de sortie
                setUpdatedPersonFormValues(body);

                // Ouverture de la modale si et seulement si il y a des équipes qui ont été retirées
                const teamsRemoved = person.assignedTeams.filter((t) => !body.assignedTeams.includes(t));
                if (teamsRemoved.length) {
                  return setIsOutOfTeamsModalOpen(true);
                } else {
                  await saveAndClose(body);
                }
              }}
            >
              {({ values, handleChange, handleSubmit, isSubmitting }) => {
                return (
                  <>
                    <div className="tw-text-sm">
                      <div>
                        <div
                          className="tw-mb-4 tw-flex tw-cursor-pointer tw-border-b tw-pb-2 tw-text-lg tw-font-semibold"
                          onClick={() => {
                            if (openPanels.includes("main")) {
                              setOpenPanels(openPanels.filter((p) => p !== "main"));
                            } else {
                              setOpenPanels([...openPanels, "main"]);
                            }
                          }}
                        >
                          <div className="tw-flex-1">Informations principales</div>
                          <div>{!openPanels.includes("main") ? "+" : "-"}</div>
                        </div>
                        {openPanels.includes("main") && (
                          <>
                            <Row>
                              <Col md={4}>
                                <FormGroup>
                                  <Label htmlFor="name">Nom prénom ou Pseudonyme</Label>
                                  <Input autoComplete="off" name="name" id="name" value={values.name || ""} onChange={handleChange} />
                                </FormGroup>
                              </Col>
                              <Col md={4}>
                                <FormGroup>
                                  <Label htmlFor="otherNames">Autres pseudos</Label>
                                  <Input
                                    autoComplete="off"
                                    name="otherNames"
                                    id="otherNames"
                                    value={values.otherNames || ""}
                                    onChange={handleChange}
                                  />
                                </FormGroup>
                              </Col>
                              <Col md={4}>
                                <Label htmlFor="person-select-gender">Genre</Label>
                                <SelectAsInput
                                  options={personFields.find((f) => f.name === "gender").options}
                                  name="gender"
                                  value={values.gender || ""}
                                  onChange={handleChange}
                                  inputId="person-select-gender"
                                  classNamePrefix="person-select-gender"
                                />
                              </Col>

                              <Col md={4}>
                                <FormGroup>
                                  <Label htmlFor="person-birthdate">Date de naissance</Label>
                                  <div>
                                    <DatePicker name="birthdate" id="person-birthdate" defaultValue={values.birthdate} onChange={handleChange} />
                                  </div>
                                </FormGroup>
                              </Col>
                              <Col md={4}>
                                <FormGroup>
                                  <Label htmlFor="person-wanderingAt">En rue depuis le</Label>
                                  <div>
                                    <DatePicker
                                      name="wanderingAt"
                                      id="person-wanderingAt"
                                      defaultValue={values.wanderingAt}
                                      onChange={handleChange}
                                    />
                                  </div>
                                </FormGroup>
                              </Col>
                              <Col md={4}>
                                <FormGroup>
                                  <Label htmlFor="person-followedSince">Suivi(e) depuis le / Créé(e) le</Label>
                                  <div>
                                    <DatePicker
                                      id="person-followedSince"
                                      name="followedSince"
                                      defaultValue={values.followedSince || values.createdAt}
                                      onChange={handleChange}
                                    />
                                  </div>
                                </FormGroup>
                              </Col>
                              <Col md={4}>
                                <FormGroup>
                                  <Label htmlFor="person-select-assigned-team">Équipe(s) en charge</Label>
                                  <div>
                                    <SelectTeamMultiple
                                      onChange={(teamIds) => handleChange({ target: { value: teamIds, name: "assignedTeams" } })}
                                      value={values.assignedTeams}
                                      colored
                                      inputId="person-select-assigned-team"
                                      classNamePrefix="person-select-assigned-team"
                                    />
                                  </div>
                                </FormGroup>
                              </Col>
                              <Col md={4}>
                                <FormGroup>
                                  <Label htmlFor="phone">Téléphone</Label>
                                  <Input autoComplete="off" name="phone" id="phone" value={values.phone || ""} onChange={handleChange} />
                                </FormGroup>
                              </Col>
                              <Col md={4}>
                                <FormGroup>
                                  <Label htmlFor="email">Email</Label>
                                  <Input autoComplete="off" type="email" name="email" id="email" value={values.email || ""} onChange={handleChange} />
                                </FormGroup>
                              </Col>
                              {!["restricted-access"].includes(user.role) && (
                                <Col md={12}>
                                  <FormGroup>
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                      type="textarea"
                                      className="!tw-text-sm"
                                      rows={5}
                                      name="description"
                                      id="description"
                                      value={values.description || ""}
                                      onChange={handleChange}
                                    />
                                  </FormGroup>
                                </Col>
                              )}
                              <Col md={12}>
                                <FormGroup>
                                  <div style={{ display: "flex", flexDirection: "column", marginLeft: 20 }}>
                                    <label htmlFor="person-alertness-checkbox">
                                      Personne très vulnérable, ou ayant besoin d'une attention particulière
                                    </label>
                                    <Input
                                      id="person-alertness-checkbox"
                                      type="checkbox"
                                      name="alertness"
                                      checked={values.alertness}
                                      onChange={() => handleChange({ target: { value: !values.alertness, name: "alertness" } })}
                                    />
                                  </div>
                                </FormGroup>
                              </Col>
                            </Row>
                            {isMedicalFile && (
                              <div className="tw-flex tw-w-full tw-items-end tw-justify-end tw-gap-2">
                                <ButtonCustom disabled={isSubmitting} color="secondary" onClick={onClose} title="Annuler" />
                                <ButtonCustom
                                  disabled={isSubmitting || JSON.stringify(person) === JSON.stringify(values)}
                                  color="primary"
                                  type="submit"
                                  onClick={handleSubmit}
                                  title="Enregistrer"
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {!isMedicalFile &&
                        !["restricted-access"].includes(user.role) &&
                        customFieldsPersons.map(({ name, fields }, index) => {
                          if (!fields.filter((f) => f.enabled || f.enabledTeams?.includes(team._id)).length) return null;
                          return (
                            <div key={name + index}>
                              <div
                                className="tw-mb-4 tw-flex tw-cursor-pointer tw-border-b tw-pb-2 tw-text-lg tw-font-semibold"
                                onClick={() => {
                                  if (openPanels.includes(name)) {
                                    setOpenPanels(openPanels.filter((p) => p !== name));
                                  } else {
                                    setOpenPanels([...openPanels, name]);
                                  }
                                }}
                              >
                                <div className="tw-flex-1">{name}</div>
                                <div>{!openPanels.includes(name) ? "+" : "-"}</div>
                              </div>

                              <div className="[overflow-wrap:anywhere]">
                                {openPanels.includes(name) && (
                                  <Row>
                                    {fields
                                      .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                                      .map((field) => (
                                        <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                                      ))}
                                  </Row>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {!isMedicalFile && (
                      <div className="tw-flex tw-items-end tw-justify-end tw-gap-2">
                        <ButtonCustom disabled={isSubmitting} color="secondary" onClick={onClose} title="Annuler" />
                        <ButtonCustom
                          disabled={isSubmitting || JSON.stringify(person) === JSON.stringify(values)}
                          color="primary"
                          type="submit"
                          onClick={handleSubmit}
                          title="Enregistrer"
                        />
                      </div>
                    )}
                  </>
                );
              }}
            </Formik>
            {isMedicalFile && (
              <Formik
                enableReinitialize
                initialValues={{
                  ...medicalFile,
                  structureMedical: person.structureMedical,
                  healthInsurances: person.healthInsurances,
                }}
                onSubmit={async (body) => {
                  body.entityKey = medicalFile.entityKey;
                  const bodyMedicalFile = body;

                  const historyEntry = {
                    date: new Date(),
                    user: user._id,
                    data: {},
                  };
                  for (const key in bodyMedicalFile) {
                    if (!flatCustomFieldsMedicalFile.map((field) => field.name).includes(key)) continue;
                    if (bodyMedicalFile[key] !== medicalFile[key]) {
                      historyEntry.data[key] = { oldValue: medicalFile[key], newValue: bodyMedicalFile[key] };
                    }
                  }
                  if (Object.keys(historyEntry.data).length) {
                    bodyMedicalFile.history = [...(medicalFile.history || []), historyEntry];
                  }

                  const [mfError] = await tryFetchExpectOk(async () =>
                    API.put({
                      path: `/medical-file/${medicalFile._id}`,
                      body: await encryptMedicalFile(flatCustomFieldsMedicalFile)({ ...medicalFile, ...bodyMedicalFile }),
                    })
                  );
                  let success = !mfError;
                  if (success) {
                    await refresh();
                  }

                  // We have to save legacy fields in person
                  const structureMedical = flattenedCustomFieldsPersons.find((e) => e.name === "structureMedical");
                  const healthInsurances = flattenedCustomFieldsPersons.find((e) => e.name === "healthInsurances");
                  if (structureMedical || healthInsurances) {
                    const bodySocial = {
                      ...person,
                      structureMedical: structureMedical ? body.structureMedical : undefined,
                      healthInsurances: healthInsurances ? body.healthInsurances : undefined,
                    };

                    const historyEntry = {
                      date: new Date(),
                      user: user._id,
                      data: {},
                    };
                    for (const key in bodySocial) {
                      if (!allowedFieldsInHistory.includes(key)) continue;
                      if (bodySocial[key] !== person[key]) historyEntry.data[key] = { oldValue: person[key], newValue: bodySocial[key] };
                      if (Object.keys(historyEntry.data).length) bodySocial.history = [...cleanHistory(person.history || []), historyEntry];
                    }
                    if (Object.keys(historyEntry.data).length) bodySocial.history = [...(person.history || []), historyEntry];

                    const [personError] = await tryFetchExpectOk(async () =>
                      API.put({
                        path: `/person/${person._id}`,
                        body: await encryptPerson(bodySocial),
                      })
                    );
                    if (!personError) {
                      await refresh();
                    } else {
                      success = false;
                    }
                  }

                  if (!success) {
                    toast.error("Les données médicales n'ont pas été enregistrées");
                  } else {
                    toast.success("Mis à jour !");
                    onClose();
                  }
                }}
              >
                {({ values, handleChange, handleSubmit, isSubmitting }) => {
                  return (
                    <>
                      {groupedCustomFieldsMedicalFileWithLegacyFields.map(({ name, fields }) => {
                        const key = groupedCustomFieldsMedicalFileWithLegacyFields.length === 1 ? "Dossier Médical" : name;
                        return (
                          <div key={key}>
                            <div
                              className="tw-mb-4 tw-flex tw-cursor-pointer tw-border-b tw-pb-2 tw-text-lg tw-font-semibold"
                              onClick={() => {
                                if (openPanels.includes(key)) {
                                  setOpenPanels(openPanels.filter((p) => p !== key));
                                } else {
                                  setOpenPanels([...openPanels, key]);
                                }
                              }}
                            >
                              <div className="tw-flex-1">{key}</div>
                              <div>{!openPanels.includes(key) ? "+" : "-"}</div>
                            </div>

                            <div className="[overflow-wrap:anywhere]">
                              {openPanels.includes(key) && (
                                <>
                                  <Row>
                                    {fields
                                      .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                                      .map((field) => (
                                        <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                                      ))}
                                  </Row>
                                  <div className="tw-flex tw-items-end tw-justify-end tw-gap-2">
                                    <ButtonCustom disabled={isSubmitting} color="secondary" onClick={onClose} title="Annuler" />
                                    <ButtonCustom
                                      disabled={isSubmitting || JSON.stringify(person) === JSON.stringify(values)}
                                      color="primary"
                                      type="submit"
                                      onClick={handleSubmit}
                                      title="Enregistrer"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                }}
              </Formik>
            )}
          </div>
        </ModalBody>
      </ModalContainer>
    </>
  );
}

function OutOfTeamsModal({ open, onClose, removedTeams }) {
  const teams = useRecoilValue(teamsState);
  const fieldsPersonsCustomizableOptions = useRecoilValue(fieldsPersonsCustomizableOptionsSelector);
  const [outOfActiveListReasons, setOutOfActiveListReasons] = useState(removedTeams.reduce((acc, team) => ({ ...acc, [team]: [] }), {}));
  return (
    <ModalContainer open={open} size="3xl" backdrop="static">
      <ModalHeader title="Motifs de sorties d'équipes" />
      <ModalBody>
        <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-p-4">
          Vous pouvez indiquer des motifs de sortie pour les équipes retirées (optionnel)
          <div className="tw-grid tw-gap-4 tw-my-4">
            {removedTeams.map((team) => (
              <div key={team} className="tw-mb-4">
                <div className="tw-mb-1">
                  Motif de sortie de l'équipe <b>{teams.find((t) => t._id === team)?.name}</b>
                </div>
                <SelectCustom
                  options={fieldsPersonsCustomizableOptions
                    .find((f) => f.name === "outOfActiveListReasons")
                    .options?.map((_option) => ({ value: _option, label: _option }))}
                  name="outOfActiveListReasons"
                  onChange={(values) => setOutOfActiveListReasons({ ...outOfActiveListReasons, [team]: values.map((v) => v.value) })}
                  isClearable={false}
                  isMulti
                  inputId="person-select-outOfActiveListReasons"
                  classNamePrefix="person-select-outOfActiveListReasons"
                  value={outOfActiveListReasons[team]?.map((_option) => ({ value: _option, label: _option })) || []}
                  placeholder={"Choisir..."}
                  getOptionValue={(i) => i.value}
                  getOptionLabel={(i) => i.label}
                />
              </div>
            ))}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <ButtonCustom color="secondary" onClick={() => onClose()} title="Ignorer cette étape" />
        <ButtonCustom
          color="primary"
          onClick={() => {
            onClose(
              Object.entries(outOfActiveListReasons)
                .filter(([, reasons]) => reasons.length)
                .reduce((acc, [team, reasons]) => ({ ...acc, [team]: reasons }), {})
            );
          }}
          title="Enregistrer"
        />
      </ModalFooter>
    </ModalContainer>
  );
}
