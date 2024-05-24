import React, { useState, useEffect, useMemo } from "react";
import { Col, FormGroup, Row, Label } from "reactstrap";
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
import DatePicker from "./DatePicker";
import { ModalBody, ModalContainer, ModalHeader, ModalFooter } from "./tailwind/Modal";
import SelectAndCreatePerson from "../scenes/reception/SelectAndCreatePerson";
import Rencontre from "./Rencontre";
import { prepareRencontreForEncryption, rencontresState } from "../recoil/rencontres";
import { useLocalStorage } from "../services/useLocalStorage";
import DateBloc, { TimeBlock } from "./DateBloc";
import PersonName from "./PersonName";
import UserName from "./UserName";
import TagTeam from "./TagTeam";
import Table from "./table";
import { useDataLoader } from "./DataLoader";

const CreateObservation = ({ observation = {}, forceOpen = 0 }) => {
  const [selectedPersons, setSelectedPersons] = useState([]);
  const user = useRecoilValue(userState);
  const teams = useRecoilValue(teamsState);
  const team = useRecoilValue(currentTeamState);
  const territories = useRecoilValue(territoriesState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const groupedCustomFieldsObs = useRecoilValue(groupedCustomFieldsObsSelector);
  const setTerritoryObservations = useSetRecoilState(territoryObservationsState);
  const fieldsGroupNames = groupedCustomFieldsObs.map((f) => f.name).filter((f) => f);
  const [open, setOpen] = useState(false);
  const [rencontre, setRencontre] = useState(undefined);
  const [activeTab, setActiveTab] = useState(fieldsGroupNames[0]);
  const [rencontresInProgress, setRencontresInProgress] = useState([]);
  const setRencontres = useSetRecoilState(rencontresState);
  const rencontres = useRecoilValue(rencontresState);
  const { refresh } = useDataLoader();

  const [sortBy, setSortBy] = useLocalStorage("in-observation-rencontre-sortBy", "dueAt");
  const [sortOrder, setSortOrder] = useLocalStorage("in-observation-rencontre-sortOrder", "ASC");

  const rencontresForObs = useMemo(() => {
    return rencontres?.filter((r) => observation._id && r.observation === observation._id) || [];
  }, [rencontres, observation]);

  useEffect(() => {
    if (forceOpen > 0) setOpen(true);
  }, [forceOpen]);

  const addTerritoryObs = async (obs) => {
    const res = await API.post({ path: "/territory-observation", body: prepareObsForEncryption(customFieldsObs)(obs) });
    if (res.ok) {
      await refresh();
    }
    return res;
  };

  const updateTerritoryObs = async (obs) => {
    const res = await API.put({ path: `/territory-observation/${obs._id}`, body: prepareObsForEncryption(customFieldsObs)(obs) });
    if (res.ok) {
      await refresh();
    }
    return res;
  };

  const onDelete = async (id) => {
    const confirm = window.confirm("Êtes-vous sûr ?");
    if (confirm) {
      const res = await API.delete({ path: `/territory-observation/${id}` });
      if (res.ok) {
        await refresh();
      }
      if (!res.ok) return;
      toast.success("Suppression réussie");
      setOpen(false);
    }
  };

  const onSelectPerson = (persons) => {
    persons = persons?.filter(Boolean) || [];
    setSelectedPersons(persons);
  };

  const currentRencontres = [...rencontresInProgress, ...rencontresForObs];
  return (
    <div className="tw-w-full tw-flex tw-justify-end">
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
            if (res.data._id && rencontresInProgress.length > 0) {
              let rencontreSuccess = true;
              for (const rencontre of rencontresInProgress) {
                const response = await API.post({
                  path: "/rencontre",
                  body: prepareRencontreForEncryption({ ...rencontre, observation: res.data._id }),
                });
                if (!response.ok) {
                  rencontreSuccess = false;
                }
              }
              if (rencontreSuccess) toast.success("Les rencontres ont également été sauvegardées");
              else toast.error("Une ou plusieurs rencontres n'ont pas pu être sauvegardées");
              await refresh();
            }
            setRencontresInProgress([]);
          }
        }}
      >
        {({ values, handleChange, handleSubmit, isSubmitting }) => (
          <ModalContainer open={open} onClose={() => setOpen(false)} size="full">
            <ModalHeader title={observation._id ? "Modifier l'observation" : "Créer une nouvelle observation"} />
            <ModalBody>
              <div className="tw-flex tw-h-full tw-w-full tw-flex-col">
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
                          {groupedCustomFieldsObs.length > 1 ? name : "Informations"}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("_rencontres");
                        }}
                        className={[
                          activeTab === "_rencontres" ? "tw-bg-main/10 tw-text-black" : "tw-hover:text-gray-700 tw-text-main",
                          "tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-font-medium",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        Rencontres {currentRencontres?.length > 0 ? `(${currentRencontres.length})` : ""}
                      </button>
                    </li>
                  </ul>
                </nav>
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
                  {activeTab === "_rencontres" ? (
                    <div>
                      <div className="tw-flex">
                        <div className="tw-grow">
                          <SelectAndCreatePerson
                            value={selectedPersons}
                            onChange={onSelectPerson}
                            inputId="person-select-and-create-reception"
                            classNamePrefix="person-select-and-create-reception"
                            showLinkToPerson={false}
                          />
                        </div>
                        <div className="tw-flex tw-justify-end tw-w-32 tw-min-w-32">
                          <div>
                            <button
                              className="button-submit"
                              onClick={() => {
                                setRencontre({
                                  persons: selectedPersons.map((p) => p._id),
                                  user: user._id,
                                  team: team._id,
                                });
                              }}
                            >
                              + Rencontre
                            </button>
                          </div>
                        </div>
                      </div>
                      <Table
                        className="Table"
                        noData="Aucune rencontre n'est associée à cette observation"
                        onRowClick={(rencontre) => {
                          if (!rencontre._id) {
                            // Si c'est une nouvelle rencontre (pas encore sauvegardée), on fait croire que c'est
                            // comme quand on ajoute une rencontre à la volée quand on l'édite. C'est tordu, mais
                            // ça me fait gagner du temps.
                            setRencontre({
                              ...rencontre,
                              person: undefined,
                              persons: [rencontre.person],
                            });
                          } else {
                            setRencontre(rencontre);
                          }
                        }}
                        data={currentRencontres}
                        rowKey={"_id"}
                        columns={[
                          {
                            title: "Date",
                            dataKey: "date",
                            onSortOrder: setSortOrder,
                            onSortBy: setSortBy,
                            sortBy,
                            sortOrder,
                            render: (rencontre) => {
                              return (
                                <>
                                  <DateBloc date={rencontre.date} />
                                  <TimeBlock time={rencontre.date} />
                                </>
                              );
                            },
                          },
                          {
                            title: "Personne suivie",
                            dataKey: "person",
                            onSortOrder: setSortOrder,
                            onSortBy: setSortBy,
                            sortBy,
                            sortOrder,
                            render: (rencontre) =>
                              rencontre.person ? (
                                <PersonName showOtherNames item={rencontre} />
                              ) : (
                                <span style={{ opacity: 0.3, fontStyle: "italic" }}>Anonyme</span>
                              ),
                          },
                          {
                            title: "Enregistré par",
                            dataKey: "user",
                            onSortOrder: setSortOrder,
                            onSortBy: setSortBy,
                            sortBy,
                            sortOrder,
                            render: (rencontre) => (rencontre.user ? <UserName id={rencontre.user} /> : null),
                          },
                          { title: "Commentaire", dataKey: "comment", onSortOrder: setSortOrder, onSortBy: setSortBy, sortBy, sortOrder },
                          {
                            title: "Équipe en charge",
                            dataKey: "team",
                            render: (rencontre) => <TagTeam teamId={rencontre?.team} />,
                          },
                          {
                            title: "Actions",
                            dataKey: "actions",
                            small: true,
                            render: (rencontre) => {
                              return !rencontre._id ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRencontresInProgress((rencontresInProgress) =>
                                      rencontresInProgress.filter((r) => r.person !== rencontre.person)
                                    );
                                  }}
                                  className="button-destructive"
                                >
                                  Retirer
                                </button>
                              ) : null;
                            },
                          },
                        ]}
                      />
                    </div>
                  ) : null}
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
              <button
                className="button-cancel"
                onClick={() => {
                  setRencontresInProgress([]);
                  setOpen(false);
                }}
              >
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
      {
        // On traite de deux manières différentes la modale de rencontre, en fonction de :
        // - si on est en train d'ajouter une rencontre pour des personnes dans l'observation (les rencontres en devenir)
        // - si on édite une rencontre déjà existante (une rencontre déjà enregistrée)
        rencontre?.persons ? (
          <Rencontre
            rencontre={rencontre}
            disableAccessToPerson
            onFinished={() => {
              setRencontre(undefined);
              setSelectedPersons([]);
            }}
            onSave={(rencontres) => {
              setRencontresInProgress((rencontresInProgress) => [
                ...rencontresInProgress.filter((r) => !rencontres.map((e) => e.person).includes(r.person)),
                ...rencontres,
              ]);
            }}
          />
        ) : (
          <Rencontre
            rencontre={rencontre}
            disableAccessToPerson
            onFinished={() => {
              setRencontre(undefined);
            }}
          />
        )
      }
    </div>
  );
};

export default CreateObservation;
