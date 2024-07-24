import React, { useState, useMemo } from "react";
import { Formik, FormikHelpers } from "formik";
import { toast } from "react-toastify";

import { customFieldsObsSelector, encryptObs, groupedCustomFieldsObsSelector } from "../recoil/territoryObservations";
import SelectTeam from "./SelectTeam";
import ButtonCustom from "./ButtonCustom";
import SelectCustom from "./SelectCustom";
import CustomFieldInput from "./CustomFieldInput";
import { currentTeamAuthentifiedState, organisationAuthentifiedState, teamsState, userAuthentifiedState } from "../recoil/auth";
import { territoriesState } from "../recoil/territory";
import { useRecoilValue } from "recoil";
import { dayjsInstance, outOfBoundariesDate } from "../services/date";
import API, { tryFetchExpectOk } from "../services/api";
import DatePicker from "./DatePicker";
import { ModalBody, ModalContainer, ModalHeader, ModalFooter } from "./tailwind/Modal";
import SelectAndCreatePerson from "../scenes/reception/SelectAndCreatePerson";
import Rencontre from "./Rencontre";
import { encryptRencontre, rencontresState } from "../recoil/rencontres";
import { useLocalStorage } from "../services/useLocalStorage";
import DateBloc, { TimeBlock } from "./DateBloc";
import PersonName from "./PersonName";
import UserName from "./UserName";
import TagTeam from "./TagTeam";
import Table from "./table";
import { useDataLoader } from "./DataLoader";
import type { TerritoryObservationInstance } from "../types/territoryObs";
import type { RencontreInstance } from "../types/rencontre";

interface CreateObservationProps {
  observation: TerritoryObservationInstance | null;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CreateObservation = ({ observation, open, setOpen }: CreateObservationProps) => {
  const user = useRecoilValue(userAuthentifiedState);
  const teams = useRecoilValue(teamsState);
  const organisation = useRecoilValue(organisationAuthentifiedState);
  const team = useRecoilValue(currentTeamAuthentifiedState);
  const territories = useRecoilValue(territoriesState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const groupedCustomFieldsObs = useRecoilValue(groupedCustomFieldsObsSelector);
  const fieldsGroupNames = groupedCustomFieldsObs.map((f) => f.name).filter((f) => f);
  const [newRencontre, setNewRencontre] = useState(false);
  const [rencontre, setRencontre] = useState<RencontreInstance>();
  const [activeTab, setActiveTab] = useState(fieldsGroupNames[0]);
  const [rencontresInProgress, setRencontresInProgress] = useState<Array<RencontreInstance>>([]);
  const rencontres = useRecoilValue<Array<RencontreInstance>>(rencontresState);
  const { refresh } = useDataLoader();

  const [sortBy, setSortBy] = useLocalStorage("in-observation-rencontre-sortBy", "dueAt");
  const [sortOrder, setSortOrder] = useLocalStorage("in-observation-rencontre-sortOrder", "ASC");

  const rencontresForObs = useMemo(() => {
    return rencontres?.filter((r) => observation?._id && r.observation === observation?._id) || [];
  }, [rencontres, observation]);

  const addTerritoryObs = async (obs: TerritoryObservationInstance) => {
    const [error, response] = await tryFetchExpectOk(async () =>
      API.post({ path: "/territory-observation", body: await encryptObs(customFieldsObs)(obs) })
    );
    if (!error) {
      await refresh();
    }
    return response;
  };

  const updateTerritoryObs = async (obs: TerritoryObservationInstance) => {
    const [error, response] = await tryFetchExpectOk(async () =>
      API.put({ path: `/territory-observation/${obs._id}`, body: await encryptObs(customFieldsObs)(obs) })
    );
    if (!error) {
      await refresh();
    }
    return response;
  };

  const onDelete = async (id: TerritoryObservationInstance["_id"]) => {
    const confirm = window.confirm("Êtes-vous sûr ?");
    if (confirm) {
      const [error] = await tryFetchExpectOk(async () => API.delete({ path: `/territory-observation/${id}` }));
      if (!error) {
        await refresh();
      }
      if (error) return;
      toast.success("Suppression réussie");
      setOpen(false);
    }
  };

  const currentRencontres = [...rencontresInProgress, ...rencontresForObs];

  const initObs = {
    user: user._id,
    team: null,
    observedAt: dayjsInstance().toDate(),
    createdAt: dayjsInstance().toDate(),
    territory: null,
  };

  return (
    <div className="tw-w-full tw-flex tw-justify-end">
      <ModalContainer open={open} onClose={() => setOpen(false)} size="full">
        <ModalHeader title={observation?._id ? "Modifier l'observation" : "Créer une nouvelle observation"} />
        <Formik
          initialValues={observation ?? initObs}
          enableReinitialize
          onSubmit={async (values: TerritoryObservationInstance, actions: FormikHelpers<TerritoryObservationInstance>) => {
            if (!values.team) return toast.error("L'équipe est obligatoire");
            if (!values.territory) return toast.error("Le territoire est obligatoire");
            if (values.observedAt && outOfBoundariesDate(values.observedAt))
              return toast.error("La date d'observation est hors limites (entre 1900 et 2100)");
            const body: TerritoryObservationInstance = {
              ...(observation ?? {}),
              observedAt: values.observedAt || dayjsInstance().toDate(),
              team: values.team,
              user: values.user || user._id,
              territory: values.territory,
              organisation: organisation._id,
            };
            for (const customField of customFieldsObs.filter((f) => f).filter((f) => f.enabled || (f.enabledTeams || []).includes(team._id))) {
              body[customField.name] = values[customField.name];
            }
            const res = observation?._id ? await updateTerritoryObs(body) : await addTerritoryObs(body);
            actions.setSubmitting(false);
            if (res.ok) {
              toast.success(observation?._id ? "Observation mise à jour" : "Création réussie !");
              setOpen(false);
              if (res.data._id && rencontresInProgress.length > 0) {
                let rencontreSuccess = true;
                console.log({ rencontresInProgress });
                for (const rencontre of rencontresInProgress) {
                  const [error] = await tryFetchExpectOk(async () =>
                    API.post({
                      path: "/rencontre",
                      body: await encryptRencontre({ ...rencontre, observation: res.data._id }),
                    })
                  );
                  if (error) {
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
            <>
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
                      {organisation.rencontresEnabled && (
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
                      )}
                    </ul>
                  </nav>
                  <div className="tw-p-4 tw-min-h-[30vh] tw-grow">
                    {groupedCustomFieldsObs.map((group) => (
                      <div className="tw-flex tw-flex-row tw-flex-wrap" key={group.name} hidden={group.name !== activeTab}>
                        {group.fields
                          .filter((f) => f)
                          .filter((f) => f.enabled || (f.enabledTeams || []).includes(team._id))
                          .map((field) => (
                            <CustomFieldInput model="observation" values={values ?? {}} handleChange={handleChange} field={field} key={field.name} />
                          ))}
                      </div>
                    ))}
                    {activeTab === "_rencontres" && (
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
                              person: rencontre.person,
                              user: user._id,
                              team: team._id,
                            });
                          } else {
                            setRencontre(rencontre);
                          }
                        }}
                        data={currentRencontres}
                        rowKey={"date"}
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
                              rencontre.person ? <PersonName item={rencontre} /> : <span className="tw-opacity-30 tw-italic">Anonyme</span>,
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
                    )}
                    <div className="tw-flex tw-justify-center tw-items-center tw-mt-4">
                      <button
                        className="button-submit"
                        onClick={() => {
                          setNewRencontre(true);
                        }}
                      >
                        + Rencontre
                      </button>
                    </div>
                  </div>
                  <div className="tw-p-4 tw-pt-0">
                    <div className="tw-flex tw-flex-row tw-flex-wrap">
                      <div className="tw-flex tw-basis-full tw-flex-col tw-px-4 tw-py-2">
                        <hr />
                      </div>
                    </div>
                    <div className="tw-flex tw-flex-row tw-flex-wrap">
                      <div className="tw-flex tw-basis-1/3 tw-flex-col tw-px-4 tw-py-2">
                        <div className="tw-mb-4">
                          <label htmlFor="observation-observedat">Observation faite le</label>
                          <div>
                            <DatePicker
                              withTime
                              id="observation-observedat"
                              name="observedAt"
                              defaultValue={new Date(values?.observedAt ?? values?.createdAt)}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="tw-flex tw-basis-1/3 tw-flex-col tw-px-4 tw-py-2">
                        <div className="tw-mb-4">
                          <label htmlFor="observation-select-team">Sous l'équipe</label>
                          <SelectTeam
                            menuPlacement="top"
                            name="team"
                            teams={user.role === "admin" ? teams : user.teams}
                            teamId={values?.team}
                            onChange={(team) => handleChange({ target: { value: team._id, name: "team" } })}
                            inputId="observation-select-team"
                            classNamePrefix="observation-select-team"
                          />
                        </div>
                      </div>
                      <div className="tw-flex tw-basis-1/3 tw-flex-col tw-px-4 tw-py-2">
                        <div className="tw-mb-4">
                          <label htmlFor="observation-select-territory">Territoire</label>
                          <SelectCustom
                            menuPlacement="top"
                            options={territories}
                            name="place"
                            onChange={(territory) => handleChange({ currentTarget: { value: territory?._id, name: "territory" } })}
                            isClearable={false}
                            value={territories.find((i) => i._id === values?.territory)}
                            getOptionValue={(i) => i._id}
                            getOptionLabel={(i) => i.name}
                            inputId="observation-select-territory"
                            classNamePrefix="observation-select-territory"
                          />
                        </div>
                      </div>
                    </div>
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
                {observation?._id ? (
                  <button className="button-destructive !tw-ml-0" onClick={() => onDelete(observation._id)}>
                    Supprimer
                  </button>
                ) : null}
                <ButtonCustom disabled={isSubmitting} loading={isSubmitting} onClick={() => !isSubmitting && handleSubmit()} title="Sauvegarder" />
              </ModalFooter>
            </>
          )}
        </Formik>
      </ModalContainer>
      {newRencontre && (
        <Rencontre
          rencontre={{
            persons: [],
            user: user._id,
            team: team._id,
          }}
          disableAccessToPerson
          onFinished={() => {
            setNewRencontre(false);
          }}
          onSave={(rencontres: Array<RencontreInstance>) => {
            if (!rencontres.length) return;
            setRencontresInProgress((rencontresInProgress) => [
              ...rencontresInProgress.filter((r) => !rencontres.map((e: RencontreInstance) => e.person).includes(r.person)),
              ...rencontres,
            ]);
          }}
        />
      )}
      {rencontre && (
        <Rencontre
          rencontre={rencontre}
          disableAccessToPerson
          onFinished={() => {
            setRencontre(undefined);
          }}
        />
      )}
    </div>
  );
};

export default CreateObservation;
