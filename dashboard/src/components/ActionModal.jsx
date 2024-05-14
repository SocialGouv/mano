import { useState, useMemo, useEffect, useRef } from "react";
import DatePicker from "./DatePicker";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { useLocation, useHistory } from "react-router-dom";
import { CANCEL, DONE, TODO } from "../recoil/actions";
import { currentTeamState, organisationState, teamsState, userState } from "../recoil/auth";
import { allowedActionFieldsInHistory, prepareActionForEncryption } from "../recoil/actions";
import API from "../services/api";
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
import { prepareCommentForEncryption } from "../recoil/comments";
import { capture } from "../services/sentry";

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
  const [isEditing, setIsEditing] = useState(!action);

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

    if (!body.name) return toast.error("Le nom est obligatoire");
    if (!body.teams?.length) return toast.error("Une action doit être associée à au moins une équipe");
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

      const actionResponse = await API.put({
        path: `/action/${data._id}`,
        body: prepareActionForEncryption(body),
      });

      if (!actionResponse.ok) {
        toast.error("Erreur lors de la mise à jour de l'action, les données n'ont pas été sauvegardées.");
        capture("error updating action", { extra: { actionId: action._id } });
        return false;
      }

      const actionCancelled = action.status !== CANCEL && body.status === CANCEL;
      if (actionCancelled && window.confirm("Cette action est annulée, voulez-vous la dupliquer ? Avec une date ultérieure par exemple")) {
        const { name, person, dueAt, withTime, description, categories, urgent, teams } = data;
        const response = await API.post({
          path: "/action",
          body: prepareActionForEncryption({
            name,
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
        });
        if (!response.ok) {
          toast.error("Erreur lors de la duplication de l'action, les données n'ont pas été sauvegardées.");
          capture("error duplicating action", { extra: { actionId: action._id } });
          return;
        }
        for (let c of action.comments.filter((c) => c.action === action._id)) {
          const body = {
            comment: c.comment,
            action: response.decryptedData._id,
            user: c.user || user._id,
            team: c.team || currentTeam._id,
            organisation: c.organisation,
          };
          const res = await API.post({ path: "/comment", body: prepareCommentForEncryption(body) });
          if (!res.ok) {
            toast.error("Erreur lors de la duplication des commentaires de l'action, les données n'ont pas été sauvegardées.");
            capture("error duplicating comments", { extra: { actionId: action._id, newActionId: response.decryptedData._id } });
            return;
          }
        }
        const searchParams = new URLSearchParams(history.location.search);
        searchParams.set("actionId", response.decryptedData._id);
        history.replace(`?${searchParams.toString()}`);
      }

      toast.success("Mise à jour !");
    } else {
      const actionsId = [];
      if (Array.isArray(body.person)) {
        for (const person of body.person) {
          const actionResponse = await API.post({
            path: "/action",
            body: prepareActionForEncryption({ ...body, person }),
          });
          if (!actionResponse.ok) {
            toast.error("Erreur lors de la création de l'action, les données n'ont pas été sauvegardées.");
            capture("error creating action", { extra: { personId: JSON.stringify(person) } });
            return false;
          }
          actionsId.push(actionResponse.decryptedData._id);
        }
      } else {
        const actionResponse = await API.post({
          path: "/action",
          body: prepareActionForEncryption(body),
        });
        if (!actionResponse.ok) {
          toast.error("Erreur lors de la création de l'action, les données n'ont pas été sauvegardées.");
          capture("error creating action", { extra: { personId: JSON.stringify(body.person) } });
          return false;
        }
        actionsId.push(actionResponse.decryptedData._id);
      }
      // Creer les commentaires.
      for (const actionId of actionsId) {
        if (body.comments?.length) {
          for (const comment of body.comments) {
            const commentResponse = await API.post({
              path: "/comment",
              body: prepareCommentForEncryption({ ...comment, action: actionId }),
            });
            if (!commentResponse.ok) {
              toast.error("Erreur lors de la création du commentaire, l'action a été sauvegardée mais pas les commentaires.");
              capture("error creating comment", { extra: { actionId } });
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

  const canEdit = true;

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
              {!isNewAction && !isEditing && `Action: ${action?.name}`}
              {!isNewAction && isEditing && `Modifier l'action: ${action?.name}`}
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
                const confirm = window.confirm("Voulez-vous vraiment supprimer ce commentaire ?");
                if (!confirm) return false;
                const newData = { ...data, comments: data.comments.filter((c) => c._id !== comment._id) };
                setData(newData);
                if (isNewAction) {
                  const res = await API.delete({ path: `/comment/${comment._id}` });
                  if (!res.ok) return false;
                  toast.success("Suppression réussie");
                  refresh();
                  return true;
                }
              }}
              onSubmitComment={async (comment, isNewComment) => {
                const newData = isNewComment
                  ? { ...data, comments: [{ ...comment, _id: uuidv4() }, ...data.comments] }
                  : { ...data, comments: data.comments.map((c) => (c._id === comment._id ? comment : c)) };
                setData(newData);
                if (isNewAction) return;

                if (isNewComment) {
                  const response = await API.post({ path: "/comment", body: prepareCommentForEncryption(comment) });
                  if (!response.ok) {
                    toast.error("Erreur lors de l'ajout du commentaire");
                    return;
                  }
                  toast.success("Commentaire ajouté !");
                } else {
                  const response = await API.put({
                    path: `/comment/${comment._id}`,
                    body: prepareCommentForEncryption(comment),
                  });
                  if (!response.ok) {
                    toast.error("Erreur lors de l'ajout du commentaire");
                    return;
                  }
                  toast.success("Commentaire mis à jour");
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
        <button name="Fermer" type="button" className="button-cancel" onClick={() => onClose()}>
          Fermer
        </button>
        {!["restricted-access"].includes(user.role) && !isNewAction && !!isEditing && (
          <button
            type="button"
            name="cancel"
            disabled={!canEdit}
            title="Supprimer cette action - seul le créateur peut supprimer une action"
            className="button-destructive"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm("Voulez-vous supprimer cette action ?")) return;
              const response = await API.delete({ path: `/action/${action._id}` });
              if (!response.ok) {
                toast.error("Erreur lors de la suppression de l'action");
                return;
              }
              for (let comment of action.comments) {
                if (!comment._id) continue;
                const commentRes = await API.delete({ path: `/comment/${comment._id}` });
                if (!commentRes.ok) {
                  toast.error("Erreur lors de la suppression des commentaires liés à l'action");
                  return;
                }
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
          <button title="Sauvegarder cette action" type="submit" className="button-submit" form="add-action-form" disabled={!canEdit}>
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
            disabled={!canEdit}
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
