import { useState, useMemo, useEffect, useRef } from "react";
import DatePicker from "./DatePicker";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { useLocation, useHistory } from "react-router-dom";
import { CANCEL, DONE, TODO } from "../recoil/actions";
import { currentTeamState, organisationState, teamsState, userState } from "../recoil/auth";
import { allowedActionFieldsInHistory, encryptAction } from "../recoil/actions";
import API, { tryFetchExpectOk } from "../services/api";
import { dayjsInstance, outOfBoundariesDate } from "../services/date";
import { modalConfirmState } from "./ModalConfirm";
import SelectStatus from "./SelectStatus";
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from "./tailwind/Modal";
import SelectPerson from "./SelectPerson";
import { CommentsModule } from "./CommentsGeneric";
import SelectTeamMultiple from "./SelectTeamMultiple";
import UserName from "./UserName";
import PersonName from "./PersonName";
import TagTeam from "./TagTeam";
import CustomFieldDisplay from "./CustomFieldDisplay";
import { itemsGroupedByActionSelector } from "../recoil/selectors";
import { DocumentsModule } from "./DocumentsGeneric";
import TabsNav from "./tailwind/TabsNav";
import { useDataLoader } from "./DataLoader";
import ActionsCategorySelect from "./tailwind/ActionsCategorySelect";
import AutoResizeTextarea from "./AutoresizeTextArea";
import { groupsState } from "../recoil/groups";
import { encryptComment } from "../recoil/comments";

export default function ActionModal() {
  const actionsObjects = useRecoilValue(itemsGroupedByActionSelector);
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentActionId = searchParams.get("actionId");
  const newAction = searchParams.get("newAction");
  const currentAction = useMemo(() => {
    if (!currentActionId) return null;
    return actionsObjects[currentActionId];
  }, [currentActionId, actionsObjects]);
  const personId = searchParams.get("personId");
  const personIds = searchParams.get("personIds")?.split(",").filter(Boolean);
  const dueAt = searchParams.get("dueAt");
  const completedAt = searchParams.get("completedAt");

  const [open, setOpen] = useState(false);
  const actionIdRef = useRef(currentActionId);
  const newActionRef = useRef(newAction);
  useEffect(() => {
    if (actionIdRef.current !== currentActionId) {
      actionIdRef.current = currentActionId;
      setOpen(!!currentActionId);
    }
    if (newActionRef.current !== newAction) {
      newActionRef.current = newAction;
      setOpen(!!newAction);
    }
  }, [newAction, currentActionId]);

  const manualCloseRef = useRef(false);
  const onAfterLeave = () => {
    if (manualCloseRef.current) history.goBack();
    manualCloseRef.current = false;
  };

  return (
    <ModalContainer open={open} size="full" onAfterLeave={onAfterLeave}>
      <ActionContent
        key={open}
        personId={personId}
        personIds={personIds}
        isMulti={!currentActionId && !personId}
        action={currentAction}
        completedAt={completedAt}
        dueAt={dueAt}
        onClose={() => {
          manualCloseRef.current = true;
          setOpen(false);
        }}
      />
    </ModalContainer>
  );
}

const newActionInitialState = (organisationId, personId, userId, dueAt, completedAt, teams, isMulti, personIds) => ({
  _id: null,
  dueAt: dueAt || (completedAt ? new Date(completedAt) : new Date()),
  withTime: false,
  completedAt,
  status: completedAt ? DONE : TODO,
  teams: teams.length === 1 ? [teams[0]._id] : [],
  user: userId,
  person: isMulti ? personIds : personId,
  organisation: organisationId,
  categories: [],
  documents: [],
  comments: [],
  history: [],
  name: "",
  description: "",
  urgent: false,
  group: false,
  createdAt: new Date(),
});

function ActionContent({ onClose, action, personId = null, personIds = null, isMulti = false, completedAt = null, dueAt = null }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const teams = useRecoilValue(teamsState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const setModalConfirmState = useSetRecoilState(modalConfirmState);
  const groups = useRecoilValue(groupsState);
  const history = useHistory();
  const { refresh } = useDataLoader();

  const newActionInitialStateRef = useRef(
    newActionInitialState(organisation?._id, personId, user?._id, dueAt, completedAt, teams, isMulti, personIds)
  );
  const [isEditing, setIsEditing] = useState(!action || searchParams.get("isEditing") === "true");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialState = useMemo(() => {
    if (action) {
      return {
        documents: [],
        comments: [],
        history: [],
        teams: action.teams ?? teams.length === 1 ? [teams[0]._id] : [],
        ...action,
      };
    }
    return newActionInitialStateRef.current;
  }, [action, teams]);

  const [data, setData] = useState(initialState);
  const isNewAction = !data._id;
  useEffect(() => {
    setData(initialState);
  }, [initialState]);

  const [activeTab, setActiveTab] = useState("Informations");
  const isOnePerson = typeof data?.person === "string" || data?.person?.length === 1;
  const onlyPerson = !isOnePerson ? null : typeof data?.person === "string" ? data.person : data.person?.[0];
  const canToggleGroupCheck = !!organisation.groupsEnabled && !!onlyPerson && groups.find((group) => group.persons.includes(onlyPerson));

  async function handleSubmit({ newData = {}, closeOnSubmit = false } = {}) {
    const body = { ...data, ...newData };

    body.name = body.name.trim();

    if (!body.name.trim()?.length && !body.categories.length) return toast.error("L'action doit avoir au moins un nom ou une catégorie");
    const orgTeamIds = teams.map((t) => t._id);
    if (!body.teams?.filter((teamId) => orgTeamIds.includes(teamId)).length) {
      return toast.error("Une action doit être associée à au moins une équipe");
    }
    if (!isMulti && !body.person) return toast.error("La personne suivie est obligatoire");
    if (isMulti && !body.person?.length) return toast.error("Une personne suivie est obligatoire");
    if (!body.dueAt) return toast.error("La date d'échéance est obligatoire");
    if (outOfBoundariesDate(body.dueAt)) return toast.error("La date d'échéance est hors limites (entre 1900 et 2100)");
    if (body.completedAt && outOfBoundariesDate(body.completedAt)) return toast.error("La date de complétion est hors limites (entre 1900 et 2100)");

    if ([DONE, CANCEL].includes(body.status)) {
      body.completedAt = body.completedAt || new Date();
    } else {
      body.completedAt = null;
    }

    if (!isNewAction && action) {
      const historyEntry = {
        date: new Date(),
        user: user._id,
        data: {},
      };
      for (const key in body) {
        if (!allowedActionFieldsInHistory.map((field) => field.name).includes(key)) continue;
        if (body[key] !== action[key]) {
          // On ignore les changements de `null` à `""` et inversement.
          if (!body[key] && !action[key]) {
            continue;
          }
          historyEntry.data[key] = { oldValue: action[key], newValue: body[key] };
        }
      }
      if (Object.keys(historyEntry.data).length) body.history = [...(action.history || []), historyEntry];

      setIsSubmitting(true);

      const [actionError] = await tryFetchExpectOk(async () =>
        API.put({
          path: `/action/${data._id}`,
          body: await encryptAction(body),
        })
      );
      if (actionError) {
        toast.error("Erreur lors de la mise à jour de l'action, les données n'ont pas été sauvegardées.");
        setIsSubmitting(false);
        return false;
      }

      const actionCancelled = action.status !== CANCEL && body.status === CANCEL;
      toast.success("Mise à jour !");
      if (actionCancelled) {
        const { name, person, dueAt, withTime, description, categories, urgent, teams } = data;
        const comments = action.comments.filter((c) => c.action === action._id);
        setModalConfirmState({
          open: true,
          options: {
            title: "Cette action est annulée, voulez-vous la dupliquer ?",
            subTitle: "Avec une date ultérieure par exemple",
            buttons: [
              {
                text: "Non merci !",
                className: "button-cancel",
              },
              {
                text: "Oui",
                className: "button-submit",
                onClick: async () => {
                  const [actionError, actionReponse] = await tryFetchExpectOk(async () =>
                    API.post({
                      path: "/action",
                      body: await encryptAction({
                        name: name.trim(),
                        person,
                        teams,
                        user: user._id,
                        dueAt,
                        withTime,
                        status: TODO,
                        description,
                        categories,
                        urgent,
                      }),
                    })
                  );
                  if (actionError) {
                    toast.error("Erreur lors de la duplication de l'action, les données n'ont pas été sauvegardées.");
                    return;
                  }
                  for (let c of comments) {
                    const body = {
                      comment: c.comment,
                      action: actionReponse.data._id,
                      user: c.user || user._id,
                      team: c.team || currentTeam._id,
                      organisation: c.organisation,
                    };
                    const [error] = await tryFetchExpectOk(async () => API.post({ path: "/comment", body: await encryptComment(body) }));
                    if (error) {
                      toast.error("Erreur lors de la duplication des commentaires de l'action, les données n'ont pas été sauvegardées.");
                      return;
                    }
                  }
                  await refresh();
                  const searchParams = new URLSearchParams(history.location.search);
                  searchParams.set("actionId", actionReponse.data._id);
                  searchParams.set("isEditing", "true");
                  history.replace(`?${searchParams.toString()}`);
                },
              },
            ],
          },
        });
      }
    } else {
      let actionsId = [];
      if (Array.isArray(body.person)) {
        const [actionError, actionResponse] = await tryFetchExpectOk(async () =>
          API.post({
            path: "/action/multiple",
            body: await Promise.all(
              body.person.map((personId) =>
                encryptAction({
                  ...body,
                  person: personId,
                })
              )
            ),
          })
        );
        if (actionError) {
          toast.error("Erreur lors de la création des action, les données n'ont pas été sauvegardées.");
          setIsSubmitting(false);
          return false;
        }
        actionsId = actionResponse.data.map((a) => a._id);
      } else {
        const [actionError, actionResponse] = await tryFetchExpectOk(async () =>
          API.post({
            path: "/action",
            body: await encryptAction(body),
          })
        );
        if (actionError) {
          toast.error("Erreur lors de la création de l'action, les données n'ont pas été sauvegardées.");
          setIsSubmitting(false);
          return false;
        }
        actionsId.push(actionResponse.data._id);
      }
      // Creer les commentaires.
      for (const actionId of actionsId) {
        if (body.comments?.length) {
          for (const comment of body.comments) {
            const [actionError] = await tryFetchExpectOk(async () =>
              API.post({
                path: "/comment",
                body: await encryptComment({ ...comment, action: actionId }),
              })
            );
            if (actionError) {
              toast.error("Erreur lors de la création du commentaire, l'action a été sauvegardée mais pas les commentaires.");
              return false;
            }
          }
        }
      }
      toast.success("Création réussie !");
    }
    if (closeOnSubmit) onClose();
    refresh();
    return true;
  }
  const canSave = useMemo(() => {
    if (data.status !== initialState.status) return true;
    if (data.urgent !== initialState.urgent) return true;
    if (JSON.stringify(data.onlyVisibleBy) !== JSON.stringify(initialState.onlyVisibleBy)) return true;
    if (JSON.stringify(data.completedAt) !== JSON.stringify(initialState.completedAt)) return true;
    return false;
  }, [data, initialState]);

  const handleChange = (event) => {
    const target = event.currentTarget || event.target;
    const { name, value } = target;
    if (isMulti && name === "person" && Array.isArray(value) && value.length > 1 && data.documents?.length > 0) {
      toast.error("Vous ne pouvez pas sélectionner plusieurs personnes si des documents sont déjà associés à cette action.");
      return;
    }
    setData((data) => ({ ...data, [name]: value }));
    setIsEditing(true);
  };

  return (
    <>
      <ModalHeader
        title={
          <div className="tw-flex tw-mr-12 tw-gap-2">
            <div className="tw-grow">
              {isNewAction && "Ajouter une action"}
              {!isNewAction && !isEditing && `Action: ${action?.name?.trim() || action?.categories?.join(", ")}`}
              {!isNewAction && isEditing && `Modifier l'action: ${action?.name?.trim() || action?.categories?.join(", ")}`}
            </div>
            {!isNewAction && action?.user && (
              <div>
                <UserName className="tw-text-base tw-font-normal tw-italic" id={action.user} wrapper={(name) => ` (créée par ${name})`} />
              </div>
            )}
          </div>
        }
        onClose={() => {
          if (JSON.stringify(data) === JSON.stringify(initialState)) return onClose();
          setModalConfirmState({
            open: true,
            options: {
              title: "Quitter la action sans enregistrer ?",
              subTitle: "Toutes les modifications seront perdues.",
              buttons: [
                {
                  text: "Annuler",
                  className: "button-cancel",
                },
                {
                  text: "Oui",
                  className: "button-destructive",
                  onClick: () => onClose(),
                },
              ],
            },
          });
        }}
      />
      <ModalBody>
        <div className="tw-flex tw-h-full tw-w-full tw-flex-col">
          <TabsNav
            className="tw-px-3 tw-py-2"
            tabs={[
              "Informations",
              `Documents ${data?.documents?.length ? `(${data.documents.length})` : ""}`,
              `Commentaires ${data?.comments?.length ? `(${data.comments.length})` : ""}`,
              "Historique",
            ]}
            onClick={(tab) => {
              if (tab.includes("Informations")) setActiveTab("Informations");
              if (tab.includes("Documents")) setActiveTab("Documents");
              if (tab.includes("Commentaires")) setActiveTab("Commentaires");
              if (tab.includes("Historique")) setActiveTab("Historique");
              refresh();
            }}
            activeTabIndex={["Informations", "Documents", "Commentaires", "Historique"].findIndex((tab) => tab === activeTab)}
          />
          <form
            id="add-action-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit({ closeOnSubmit: true });
            }}
          >
            <div
              className={[
                "tw-flex tw-w-full tw-flex-wrap tw-overflow-hidden sm:tw-h-[60vh] sm:tw-min-h-min",
                activeTab !== "Informations" && "tw-hidden",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-overflow-y-auto tw-py-4 tw-text-left sm:tw-flex-row ">
                <div id="right" className="tw-grid tw-min-h-full tw-flex-[2] tw-basis-2/3 tw-grid-cols-[1fr_2px] tw-pl-4 tw-pr-8">
                  <div className="tw-flex tw-flex-col tw-pr-8">
                    <div className="tw-mb-4 tw-flex tw-flex-col tw-items-start tw-justify-start">
                      <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-main"} htmlFor="name">
                        Nom de l'action
                      </label>
                      {isEditing ? (
                        <textarea
                          name="name"
                          id="name"
                          value={data.name}
                          onChange={handleChange}
                          className="tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-1.5 tw-text-base tw-transition-all"
                        />
                      ) : (
                        <CustomFieldDisplay value={data.name} type="textarea" />
                      )}
                    </div>
                    <div className="tw-mb-4 tw-flex tw-flex-col tw-items-start tw-justify-start">
                      <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-main"} htmlFor="person">
                        {isMulti ? "Personne(s) suivie(s)" : "Personne suivie"}
                      </label>
                      {isEditing ? (
                        <div className="tw-w-full">
                          <SelectPerson noLabel value={data.person} onChange={handleChange} isMulti={isMulti} inputId="create-action-person-select" />
                        </div>
                      ) : (
                        <PersonName item={data} />
                      )}
                    </div>
                    <div className="tw-mb-4 tw-flex tw-flex-col tw-items-start tw-justify-start">
                      <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-main"} htmlFor="categories">
                        Catégorie(s)
                      </label>
                      {isEditing ? (
                        <div className="tw-w-full">
                          <ActionsCategorySelect
                            values={data.categories}
                            id="categories"
                            onChange={(v) => handleChange({ currentTarget: { value: v, name: "categories" } })}
                            withMostUsed
                          />
                        </div>
                      ) : (
                        <CustomFieldDisplay value={data.categories?.join(", ")} type="text" />
                      )}
                    </div>
                    {!["restricted-access"].includes(user.role) && (
                      <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col tw-items-start tw-justify-start">
                        <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-main"} htmlFor="description">
                          Description
                        </label>
                        {isEditing ? (
                          <div className="tw-block tw-w-full tw-overflow-hidden tw-rounded tw-border tw-border-gray-300 tw-text-base tw-transition-all">
                            <AutoResizeTextarea name="description" id="description" value={data.description} onChange={handleChange} rows={4} />
                          </div>
                        ) : (
                          <CustomFieldDisplay value={data.description} type="textarea" />
                        )}
                      </div>
                    )}
                    {!!canToggleGroupCheck && (
                      <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col tw-items-start tw-justify-start">
                        <label htmlFor="create-action-for-group">
                          {isEditing ? (
                            <>
                              <input
                                type="checkbox"
                                className="tw-mr-2"
                                id="create-action-for-group"
                                name="group"
                                checked={data.group}
                                onChange={() => {
                                  handleChange({ target: { name: "group", checked: Boolean(!data.group), value: Boolean(!data.group) } });
                                }}
                              />
                              Action familiale <br />
                              <small className="text-muted">Cette action sera à effectuer pour toute la famille</small>
                            </>
                          ) : data.group ? (
                            <>
                              Action familiale <br />
                              <small className="text-muted">Cette action sera à effectuer pour toute la famille</small>
                            </>
                          ) : null}
                        </label>
                      </div>
                    )}
                  </div>
                  <div id="separator" className="tw-flex tw-w-2 tw-shrink-0 tw-flex-col tw-pb-4">
                    <hr className="tw-m-0 tw-w-px tw-shrink-0 tw-basis-full tw-border tw-bg-gray-300" />
                  </div>
                </div>
                <div id="left" className="tw-flex tw-flex-[1] tw-basis-1/3 tw-flex-col tw-pr-4">
                  <div className="tw-mb-4 tw-flex tw-flex-col tw-items-start tw-justify-start">
                    <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-main"} htmlFor="dueAt">
                      À faire le
                    </label>
                    {isEditing ? (
                      <>
                        <DatePicker
                          withTime={data.withTime}
                          id="dueAt"
                          name="dueAt"
                          defaultValue={data.dueAt ?? new Date()}
                          onChange={handleChange}
                          onInvalid={() => setActiveTab("Informations")}
                        />
                        <div>
                          <input
                            type="checkbox"
                            id="withTime"
                            name="withTime"
                            className="tw-mr-2"
                            checked={data.withTime || false}
                            onChange={() => {
                              handleChange({ target: { name: "withTime", checked: Boolean(!data.withTime), value: Boolean(!data.withTime) } });
                            }}
                          />
                          <label htmlFor="withTime">Montrer l'heure</label>
                        </div>
                      </>
                    ) : (
                      <CustomFieldDisplay value={data.dueAt} type={data.withTime ? "date-with-time" : "date"} />
                    )}
                  </div>
                  <div className="tw-mb-4 tw-flex tw-flex-col tw-items-start tw-justify-start">
                    <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-main"} htmlFor="team">
                      Équipe(s) en charge
                    </label>
                    {isEditing ? (
                      <div className="tw-w-full">
                        <SelectTeamMultiple
                          onChange={(teamIds) => handleChange({ target: { value: teamIds, name: "teams" } })}
                          value={Array.isArray(data.teams) ? data.teams : [data.team]}
                          colored
                          inputId="create-action-team-select"
                          classNamePrefix="create-action-team-select"
                        />
                      </div>
                    ) : (
                      <div className="tw-flex tw-flex-col">
                        {(Array.isArray(data.teams) ? data.teams : [data.team]).map((teamId) => (
                          <TagTeam key={teamId} teamId={teamId} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="tw-mb-4 tw-flex tw-flex-col tw-items-start tw-justify-start">
                    <label htmlFor="create-action-urgent">
                      <input
                        type="checkbox"
                        id="create-action-urgent"
                        className="tw-mr-2"
                        name="urgent"
                        checked={data.urgent}
                        onChange={() => {
                          handleChange({ target: { name: "urgent", checked: Boolean(!data.urgent), value: Boolean(!data.urgent) } });
                        }}
                      />
                      Action prioritaire <br />
                      <small className="text-muted">Cette action sera mise en avant par rapport aux autres</small>
                    </label>
                  </div>
                  <div className="tw-mb-4 tw-flex tw-flex-col tw-items-start tw-justify-start">
                    <label htmlFor="update-action-select-status">Statut</label>
                    <div className="tw-w-full">
                      <SelectStatus
                        name="status"
                        value={data.status || ""}
                        onChange={handleChange}
                        inputId="update-action-select-status"
                        classNamePrefix="update-action-select-status"
                      />
                    </div>
                  </div>
                  <div
                    className={["tw-mb-4 tw-flex tw-flex-1 tw-flex-col", [DONE, CANCEL].includes(data.status) ? "tw-visible" : "tw-invisible"].join(
                      " "
                    )}
                  >
                    <label htmlFor="completedAt">{data.status === DONE ? "Faite le" : "Annulée le"}</label>
                    <div>
                      <DatePicker
                        withTime
                        id="completedAt"
                        name="completedAt"
                        defaultValue={data.completedAt ?? new Date()}
                        onChange={handleChange}
                        onInvalid={() => setActiveTab("Informations")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
          <div
            className={["tw-flex tw-h-[50vh] tw-w-full tw-flex-col tw-gap-4 tw-overflow-y-auto", activeTab !== "Documents" && "tw-hidden"]
              .filter(Boolean)
              .join(" ")}
          >
            <DocumentsModule
              personId={Array.isArray(data.person) && data.person.length === 1 ? data.person[0] : data.person}
              showAssociatedItem={false}
              documents={data.documents.map((doc) => ({
                ...doc,
                type: doc.type ?? "document", // or 'folder'
                linkedItem: { _id: action?._id, type: "action" },
              }))}
              onAddDocuments={async (nextDocuments) => {
                const newData = {
                  ...data,
                  documents: [...data.documents, ...nextDocuments],
                };
                setData(newData);
                if (isNewAction) return;
                const ok = await handleSubmit({ newData });
                if (ok && nextDocuments.length > 1) toast.success("Documents ajoutés");
              }}
              onDeleteDocument={async (document) => {
                const newData = { ...data, documents: data.documents.filter((d) => d._id !== document._id) };
                setData(newData);
                if (isNewAction) return true;
                const ok = await handleSubmit({ newData });
                if (ok) toast.success("Document supprimé");
                return ok;
              }}
              onSubmitDocument={async (document) => {
                const newData = {
                  ...data,
                  documents: data.documents.map((d) => {
                    if (d._id === document._id) return document;
                    return d;
                  }),
                };
                setData(newData);
                if (isNewAction) return;
                const ok = await handleSubmit({ newData });
                if (ok) toast.success("Document mis à jour");
              }}
            />
          </div>
          <div
            className={["tw-flex tw-h-[50vh] tw-w-full tw-flex-col tw-gap-4 tw-overflow-y-auto", activeTab !== "Commentaires" && "tw-hidden"]
              .filter(Boolean)
              .join(" ")}
          >
            <CommentsModule
              comments={data.comments
                .map((c) => ({ ...c, type: "action", action }))
                .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))}
              color="main"
              canToggleUrgentCheck
              typeForNewComment="action"
              actionId={action?._id}
              onDeleteComment={async (comment) => {
                const newData = { ...data, comments: data.comments.filter((c) => c._id !== comment._id) };
                setData(newData);
                if (!isNewAction) {
                  const [error] = await tryFetchExpectOk(() => API.delete({ path: `/comment/${comment._id}` }));
                  if (error) {
                    toast.error("Erreur lors de la suppression du commentaire");
                    return false;
                  }
                  toast.success("Suppression réussie");
                  refresh();
                  return true;
                }
              }}
              onSubmitComment={async (comment, isNewComment) => {
                if (isNewComment) {
                  if (isNewAction) {
                    // On a besoin d'un identifiant temporaire pour les nouveaux commentaires dans une nouvelle action
                    // Car on peut ajouter, supprimer, éditer des commentaires qui n'existent pas en base de données.
                    // Cet identifiant sera remplacé par l'identifiant de l'objet créé par le serveur.
                    setData({ ...data, comments: [{ ...comment, _id: uuidv4() }, ...data.comments] });
                    return;
                  } else {
                    const [error, response] = await tryFetchExpectOk(async () => API.post({ path: "/comment", body: await encryptComment(comment) }));
                    if (error) {
                      toast.error("Erreur lors de l'ajout du commentaire");
                      return;
                    }
                    setData({ ...data, comments: [{ ...comment, _id: response.data._id }, ...data.comments] });
                    toast.success("Commentaire ajouté !");
                    refresh();
                  }
                } else {
                  setData({ ...data, comments: data.comments.map((c) => (c._id === comment._id ? comment : c)) });
                  if (isNewAction) return;
                  const [error] = await tryFetchExpectOk(async () =>
                    API.put({
                      path: `/comment/${comment._id}`,
                      body: await encryptComment(comment),
                    })
                  );
                  if (error) {
                    toast.error("Erreur lors de l'ajout du commentaire");
                    return;
                  }
                  toast.success("Commentaire mis à jour");
                  refresh();
                }
              }}
            />
          </div>
          <div
            className={["tw-flex tw-h-[50vh] tw-w-full tw-flex-col tw-gap-4 tw-overflow-y-auto", activeTab !== "Historique" && "tw-hidden"]
              .filter(Boolean)
              .join(" ")}
          >
            <ActionHistory action={action} />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button name="Fermer" type="button" className="button-cancel" onClick={() => onClose()} disabled={isDeleting || isSubmitting}>
          Fermer
        </button>
        {!["restricted-access"].includes(user.role) && !isNewAction && !!isEditing && (
          <button
            type="button"
            name="cancel"
            disabled={isDeleting || isSubmitting}
            title="Supprimer cette action - seul le créateur peut supprimer une action"
            className="button-destructive"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm("Voulez-vous supprimer cette action ?")) return;
              setIsDeleting(true);
              const [error] = await tryFetchExpectOk(() =>
                API.delete({
                  path: `/action/${action._id}`,
                  body: {
                    commentIdsToDelete: action.comments.map((c) => c._id),
                  },
                })
              );
              if (error) {
                toast.error("Erreur lors de la suppression de l'action");
                setIsDeleting(false);
                return;
              }
              refresh();
              toast.success("Suppression réussie");
              onClose();
            }}
          >
            Supprimer
          </button>
        )}
        {(isEditing || canSave) && (
          <button
            title="Sauvegarder cette action"
            type="submit"
            className="button-submit"
            form="add-action-form"
            disabled={isDeleting || isSubmitting}
          >
            Sauvegarder
          </button>
        )}
        {!isEditing && (
          <button
            title="Modifier cette action - seul le créateur peut modifier une action"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(true);
            }}
            className={["button-submit", activeTab === "Informations" ? "tw-visible" : "tw-invisible"].join(" ")}
            disabled={isDeleting}
          >
            Modifier
          </button>
        )}
      </ModalFooter>
    </>
  );
}

function ActionHistory({ action }) {
  const history = useMemo(() => [...(action?.history || [])].reverse(), [action?.history]);
  const teams = useRecoilValue(teamsState);

  return (
    <div>
      <table className="table table-striped table-bordered">
        <thead>
          <tr className="tw-cursor-default">
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Donnée</th>
          </tr>
        </thead>
        <tbody className="small">
          {history.map((h) => {
            return (
              <tr key={h.date} className="tw-cursor-default">
                <td>{dayjsInstance(h.date).format("DD/MM/YYYY HH:mm")}</td>
                <td>
                  <UserName id={h.user} />
                </td>
                <td className="tw-max-w-prose">
                  {Object.entries(h.data).map(([key, value]) => {
                    const actionField = allowedActionFieldsInHistory.find((f) => f.name === key);
                    if (key === "teams") {
                      return (
                        <p className="tw-flex tw-flex-col" key={key}>
                          <span>{actionField?.label} : </span>
                          <code>"{(value.oldValue || []).map((teamId) => teams.find((t) => t._id === teamId)?.name).join(", ")}"</code>
                          <span>↓</span>
                          <code>"{(value.newValue || []).map((teamId) => teams.find((t) => t._id === teamId)?.name).join(", ")}"</code>
                        </p>
                      );
                    }
                    if (key === "person") {
                      return (
                        <p key={key}>
                          {actionField?.label} : <br />
                          <code>
                            <PersonName item={{ person: value.oldValue }} />
                          </code>{" "}
                          ➔{" "}
                          <code>
                            <PersonName item={{ person: value.newValue }} />
                          </code>
                        </p>
                      );
                    }

                    return (
                      <p
                        key={key}
                        data-test-id={`${actionField?.label}: ${JSON.stringify(value.oldValue || "")} ➔ ${JSON.stringify(value.newValue)}`}
                      >
                        {actionField?.label} : <br />
                        <code>{JSON.stringify(value.oldValue || "")}</code> ➔ <code>{JSON.stringify(value.newValue)}</code>
                      </p>
                    );
                  })}
                </td>
              </tr>
            );
          })}
          {action?.createdAt && (
            <tr key={action.createdAt} className="tw-cursor-default">
              <td>{dayjsInstance(action.createdAt).format("DD/MM/YYYY HH:mm")}</td>
              <td>
                <UserName id={action.user} />
              </td>
              <td className="tw-max-w-prose">
                <p>Création de l’action</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
