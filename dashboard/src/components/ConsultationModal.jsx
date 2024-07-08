import { useState, useMemo, useEffect, useRef } from "react";
import DatePicker from "./DatePicker";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { useLocation, useHistory } from "react-router-dom";
import { CANCEL, DONE, TODO } from "../recoil/actions";
import { currentTeamState, organisationState, teamsState, userState } from "../recoil/auth";
import { consultationsFieldsIncludingCustomFieldsSelector, encryptConsultation } from "../recoil/consultations";
import API, { tryFetchExpectOk } from "../services/api";
import { dayjsInstance } from "../services/date";
import CustomFieldInput from "./CustomFieldInput";
import { modalConfirmState } from "./ModalConfirm";
import SelectAsInput from "./SelectAsInput";
import SelectStatus from "./SelectStatus";
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from "./tailwind/Modal";
import SelectPerson from "./SelectPerson";
import { CommentsModule } from "./CommentsGeneric";
import SelectTeamMultiple from "./SelectTeamMultiple";
import UserName from "./UserName";
import PersonName from "./PersonName";
import TagTeam from "./TagTeam";
import CustomFieldDisplay from "./CustomFieldDisplay";
import { itemsGroupedByConsultationSelector } from "../recoil/selectors";
import { DocumentsModule } from "./DocumentsGeneric";
import TabsNav from "./tailwind/TabsNav";
import { useDataLoader } from "./DataLoader";
import { decryptItem } from "../services/encryption";

export default function ConsultationModal() {
  const consultationsObjects = useRecoilValue(itemsGroupedByConsultationSelector);
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentConsultationId = searchParams.get("consultationId");
  const newConsultation = searchParams.get("newConsultation");
  const currentConsultation = useMemo(() => {
    if (!currentConsultationId) return null;
    return consultationsObjects[currentConsultationId];
  }, [currentConsultationId, consultationsObjects]);
  const personId = searchParams.get("personId");
  const date = searchParams.get("dueAt") || searchParams.get("completedAt");

  const [open, setOpen] = useState(false);
  const consultationIdRef = useRef(currentConsultationId);
  const newConsultationRef = useRef(newConsultation);
  useEffect(() => {
    if (consultationIdRef.current !== currentConsultationId) {
      consultationIdRef.current = currentConsultationId;
      setOpen(!!currentConsultationId);
    }
    if (newConsultationRef.current !== newConsultation) {
      newConsultationRef.current = newConsultation;
      setOpen(!!newConsultation);
    }
  }, [newConsultation, currentConsultationId]);

  const manualCloseRef = useRef(false);
  const onAfterLeave = () => {
    if (manualCloseRef.current) history.goBack();
    manualCloseRef.current = false;
  };

  return (
    <ModalContainer open={open} size="full" onAfterLeave={onAfterLeave}>
      <ConsultationContent
        key={open}
        personId={personId}
        consultation={currentConsultation}
        date={date}
        onClose={() => {
          manualCloseRef.current = true;
          setOpen(false);
        }}
      />
    </ModalContainer>
  );
}

const newConsultationInitialState = (organisationId, personId, userId, date, teams) => ({
  _id: null,
  dueAt: date ? new Date(date) : new Date(),
  completedAt: new Date(),
  name: "",
  type: "",
  status: TODO,
  teams: teams.length === 1 ? [teams[0]._id] : [],
  user: userId,
  person: personId || null,
  organisation: organisationId,
  onlyVisibleBy: [],
  documents: [],
  comments: [],
  history: [],
  createdAt: new Date(),
});

function ConsultationContent({ personId, consultation, date, onClose }) {
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const setModalConfirmState = useSetRecoilState(modalConfirmState);
  const consultationsFieldsIncludingCustomFields = useRecoilValue(consultationsFieldsIncludingCustomFieldsSelector);
  const { refresh } = useDataLoader();

  const newConsultationInitialStateRef = useRef(newConsultationInitialState(organisation._id, personId, user._id, date, teams));

  const [isEditing, setIsEditing] = useState(!consultation);

  const initialState = useMemo(() => {
    if (consultation) {
      return {
        documents: [],
        comments: [],
        history: [],
        teams: consultation.teams ?? teams.length === 1 ? [teams[0]._id] : [],
        ...consultation,
      };
    }
    return newConsultationInitialStateRef.current;
  }, [consultation, teams]);

  const [data, setData] = useState(initialState);

  const isNewConsultation = !data._id;

  useEffect(() => {
    setData(initialState);
  }, [initialState]);

  const [activeTab, setActiveTab] = useState("Informations");

  async function handleSubmit({ newData = {}, closeOnSubmit = false } = {}) {
    const body = { ...data, ...newData };
    if (!body.type) return toast.error("Veuillez choisir un type de consultation");
    if (!body.dueAt) return toast.error("Vous devez préciser une date prévue");
    if (!body.person) return toast.error("Veuillez sélectionner une personne suivie");
    const orgTeamIds = teams.map((t) => t._id);
    if (!body.teams?.filter((teamId) => orgTeamIds.includes(teamId)).length) return toast.error("Veuillez sélectionner au moins une équipe");
    if ([DONE, CANCEL].includes(body.status)) {
      body.completedAt = body.completedAt || new Date();
    } else {
      body.completedAt = null;
    }

    if (!isNewConsultation && !!consultation) {
      const historyEntry = {
        date: new Date(),
        user: user._id,
        data: {},
      };
      for (const key in body) {
        if (!consultationsFieldsIncludingCustomFields.map((field) => field.name).includes(key)) continue;
        if (body[key] !== consultation[key]) historyEntry.data[key] = { oldValue: consultation[key], newValue: body[key] };
      }
      if (Object.keys(historyEntry.data).length) body.history = [...(consultation.history || []), historyEntry];
    }

    const [error, response] = await tryFetchExpectOk(async () =>
      isNewConsultation
        ? API.post({
            path: "/consultation",
            body: await encryptConsultation(organisation.consultations)(body),
          })
        : API.put({
            path: `/consultation/${data._id}`,
            body: await encryptConsultation(organisation.consultations)(body),
          })
    );
    if (error) return false;
    const decryptedData = await decryptItem(response.data, data);
    if (decryptedData) {
      setData(decryptedData);
      await refresh();
    }
    if (closeOnSubmit) onClose();
    return true;
  }

  const canSave = useMemo(() => {
    if (data.status !== initialState.status) return true;
    if (JSON.stringify(data.onlyVisibleBy) !== JSON.stringify(initialState.onlyVisibleBy)) return true;
    if (JSON.stringify(data.completedAt) !== JSON.stringify(initialState.completedAt)) return true;
    return false;
  }, [data, initialState]);

  // const canEdit = useMemo(() => !consultation || consultation.user === user._id, [consultation, user._id]);
  const canEdit = true;

  const handleChange = (event) => {
    const target = event.currentTarget || event.target;
    const { name, value } = target;
    setData((data) => ({ ...data, [name]: value }));
    setIsEditing(true);
  };

  return (
    <>
      <ModalHeader
        title={
          <div className="tw-flex tw-mr-12 tw-gap-2">
            <div className="tw-grow">
              {isNewConsultation && "Ajouter une consultation"}
              {!isNewConsultation && !isEditing && "Consultation"}
              {!isNewConsultation && isEditing && "Modifier la consultation"}
            </div>
            {!isNewConsultation && consultation?.user && (
              <div>
                <UserName className="tw-text-base tw-font-normal tw-italic" id={consultation.user} wrapper={(name) => ` (créée par ${name})`} />
              </div>
            )}
          </div>
        }
        onClose={() => {
          if (JSON.stringify(data) === JSON.stringify(initialState)) return onClose();
          setModalConfirmState({
            open: true,
            options: {
              title: "Quitter la consultation sans enregistrer ?",
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
            renderTab={(tab) => {
              if (tab.includes("Constantes"))
                return (
                  <>
                    Constantes <span className="tw-rounded tw-border-none tw-bg-red-700 tw-px-1.5 tw-py-0.5 tw-text-xs tw-text-white">beta</span>
                  </>
                );
              return tab;
            }}
            tabs={[
              "Informations",
              "Constantes",
              `Documents ${data?.documents?.length ? `(${data.documents.length})` : ""}`,
              `Commentaires ${data?.comments?.length ? `(${data.comments.length})` : ""}`,
              "Historique",
            ]}
            onClick={(tab) => {
              if (tab.includes("Informations")) setActiveTab("Informations");
              if (tab.includes("Constantes")) setActiveTab("Constantes");
              if (tab.includes("Documents")) setActiveTab("Documents");
              if (tab.includes("Commentaires")) setActiveTab("Commentaires");
              if (tab.includes("Historique")) setActiveTab("Historique");
              refresh();
            }}
            activeTabIndex={["Informations", "Constantes", "Documents", "Commentaires", "Historique"].findIndex((tab) => tab === activeTab)}
          />
          <form
            id="add-consultation-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit({ closeOnSubmit: true });
            }}
          >
            <div className={["tw-flex tw-w-full tw-flex-wrap tw-p-4", activeTab !== "Informations" && "tw-hidden"].filter(Boolean).join(" ")}>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="create-consultation-team">
                  Personne suivie
                </label>
                {isEditing ? (
                  <SelectPerson noLabel value={data.person} onChange={handleChange} isMulti={false} inputId="create-consultation-person-select" />
                ) : (
                  <PersonName item={data} />
                )}
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="create-consultation-team">
                  Équipe(s) en charge
                </label>
                {isEditing ? (
                  <SelectTeamMultiple
                    onChange={(teamIds) => setData({ ...data, teams: teamIds })}
                    value={data.teams}
                    colored
                    inputId="create-consultation-team-select"
                    classNamePrefix="create-consultation-team-select"
                  />
                ) : (
                  <div className="tw-flex tw-flex-col">
                    {data.teams.map((teamId) => (
                      <TagTeam key={teamId} teamId={teamId} />
                    ))}
                  </div>
                )}
              </div>

              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="create-consultation-name">
                  Nom (facultatif)
                </label>
                {isEditing ? (
                  <input
                    className="tailwindui"
                    autoComplete="off"
                    id="create-consultation-name"
                    name="name"
                    value={data.name}
                    onChange={handleChange}
                  />
                ) : (
                  <CustomFieldDisplay type="text" value={data.name} />
                )}
              </div>

              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="type">
                  Type
                </label>
                {isEditing ? (
                  <SelectAsInput
                    id="type"
                    name="type"
                    inputId="consultation-modal-type"
                    classNamePrefix="consultation-modal-type"
                    value={data.type}
                    onChange={handleChange}
                    placeholder="-- Type de consultation --"
                    options={organisation.consultations.map((e) => e.name)}
                  />
                ) : (
                  <CustomFieldDisplay type="text" value={data.type} />
                )}
              </div>
              {organisation.consultations
                .find((e) => e.name === data.type)
                ?.fields.filter((f) => f.enabled || f.enabledTeams?.includes(currentTeam._id))
                .map((field) => {
                  if (!isEditing) {
                    return (
                      <div data-test-id={field.label} key={field.name} className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                        <label className="tw-text-sm tw-font-semibold tw-text-blue-900" htmlFor="type">
                          {field.label}
                        </label>
                        <CustomFieldDisplay key={field.name} type={field.type} value={data[field.name]} />
                      </div>
                    );
                  }
                  return (
                    <CustomFieldInput
                      colWidth={field.type === "textarea" ? 12 : 6}
                      model="person"
                      values={data}
                      handleChange={handleChange}
                      field={field}
                      key={field.name}
                    />
                  );
                })}
              {data.user === user._id && (
                <>
                  <hr className="tw-basis-full" />
                  <div className="tw-basis-full tw-px-4 tw-pt-2">
                    <label htmlFor="create-consultation-onlyme">
                      <input
                        type="checkbox"
                        id="create-consultation-onlyme"
                        style={{ marginRight: "0.5rem" }}
                        name="onlyVisibleByCreator"
                        checked={data.onlyVisibleBy?.includes(user._id)}
                        onChange={() => {
                          setData({ ...data, onlyVisibleBy: data.onlyVisibleBy?.includes(user._id) ? [] : [user._id] });
                        }}
                      />
                      Seulement visible par moi
                    </label>
                  </div>
                </>
              )}
              <hr className="tw-basis-full" />
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={canEdit ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="new-consultation-select-status">
                  Statut
                </label>
                {canEdit ? (
                  <SelectStatus
                    name="status"
                    value={data.status || ""}
                    onChange={handleChange}
                    inputId="new-consultation-select-status"
                    classNamePrefix="new-consultation-select-status"
                  />
                ) : (
                  <CustomFieldDisplay type="text" value={data.status} />
                )}
              </div>
              <div className="tw-basis-1/2 tw-px-4 tw-py-2">
                <label className={canEdit ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="create-consultation-dueat">
                  Date prévue
                </label>
                <div>
                  {canEdit ? (
                    <DatePicker
                      withTime
                      id="create-consultation-dueat"
                      name="dueAt"
                      defaultValue={data.dueAt ?? new Date()}
                      onChange={handleChange}
                      onInvalid={() => setActiveTab("Informations")}
                    />
                  ) : (
                    <CustomFieldDisplay type="date-with-time" value={data.dueAt} />
                  )}
                </div>
              </div>

              <div className={["tw-basis-1/2 tw-px-4 tw-py-2", [DONE, CANCEL].includes(data.status) ? "tw-visible" : "tw-invisible"].join(" ")} />
              <div className={["tw-basis-1/2 tw-px-4 tw-py-2", [DONE, CANCEL].includes(data.status) ? "tw-visible" : "tw-invisible"].join(" ")}>
                <label className={canEdit ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="create-consultation-completedAt">
                  Date réalisée
                </label>
                <div>
                  {canEdit ? (
                    <DatePicker
                      withTime
                      id="create-consultation-completedAt"
                      name="completedAt"
                      defaultValue={data.completedAt ?? new Date()}
                      onChange={handleChange}
                      onInvalid={() => setActiveTab("Informations")}
                    />
                  ) : (
                    <CustomFieldDisplay type="date-with-time" value={data.completedAt} />
                  )}
                </div>
              </div>
            </div>
            <div
              className={["tw-flex tw-h-[50vh] tw-w-full tw-flex-col tw-gap-4 tw-overflow-y-auto", activeTab !== "Constantes" && "tw-hidden"]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="tw-m-2">
                <div className="tw-mx-auto tw-max-w-2xl tw-border-l-4 tw-border-blue-500 tw-bg-blue-100 tw-p-4 tw-text-blue-700" role="alert">
                  Notez les constantes pour observer leur évolution sous forme de graphiques dans le dossier médical de la personne.
                </div>
              </div>
              <div className="tw-grid tw-grid-cols-4 tw-gap-4 tw-p-4">
                <div>
                  <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="constantes-poids">
                    Poids (kg)
                  </label>
                  {!isEditing ? (
                    <div>
                      <CustomFieldDisplay type="number" value={data["constantes-poids"]} />
                    </div>
                  ) : (
                    <input
                      className="tailwindui"
                      autoComplete="off"
                      value={data["constantes-poids"]}
                      onChange={handleChange}
                      type="number"
                      step="0.001"
                      min="1"
                      max="400"
                      onInvalid={() => setActiveTab("Constantes")}
                      name="constantes-poids"
                      placeholder="100"
                    />
                  )}
                </div>
                <div>
                  <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="constantes-taille">
                    Taille (cm)
                  </label>
                  {!isEditing ? (
                    <div>
                      <CustomFieldDisplay type="number" value={data["constantes-taille"]} />
                    </div>
                  ) : (
                    <input
                      value={data["constantes-taille"]}
                      onChange={handleChange}
                      className="tailwindui"
                      autoComplete="off"
                      type="number"
                      min="20"
                      max="280"
                      onInvalid={() => setActiveTab("Constantes")}
                      name="constantes-taille"
                      placeholder="160"
                    />
                  )}
                </div>
                <div>
                  <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="constantes-frequence-cardiaque">
                    Fréquence cardiaque (bpm)
                  </label>
                  {!isEditing ? (
                    <div>
                      <CustomFieldDisplay type="number" value={data["constantes-frequence-cardiaque"]} />
                    </div>
                  ) : (
                    <input
                      value={data["constantes-frequence-cardiaque"]}
                      onChange={handleChange}
                      className="tailwindui"
                      autoComplete="off"
                      type="number"
                      min="20"
                      max="240"
                      onInvalid={() => setActiveTab("Constantes")}
                      name="constantes-frequence-cardiaque"
                      placeholder="60"
                    />
                  )}
                </div>
                <div>
                  <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="constantes-frequence-respiratoire">
                    Fréq. respiratoire (mvts/min)
                  </label>
                  {!isEditing ? (
                    <div>
                      <CustomFieldDisplay type="number" value={data["constantes-frequence-respiratoire"]} />{" "}
                    </div>
                  ) : (
                    <input
                      value={data["constantes-frequence-respiratoire"]}
                      onChange={handleChange}
                      className="tailwindui"
                      autoComplete="off"
                      type="number"
                      min="1"
                      max="90"
                      onInvalid={() => setActiveTab("Constantes")}
                      name="constantes-frequence-respiratoire"
                      placeholder="15"
                    />
                  )}
                </div>
                <div>
                  <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="constantes-saturation-o2">
                    Saturation en oxygène (%)
                  </label>
                  {!isEditing ? (
                    <div>
                      <CustomFieldDisplay type="number" value={data["constantes-saturation-o2"]} />{" "}
                    </div>
                  ) : (
                    <input
                      value={data["constantes-saturation-o2"]}
                      onChange={handleChange}
                      className="tailwindui"
                      autoComplete="off"
                      type="number"
                      min="50"
                      max="150"
                      onInvalid={() => setActiveTab("Constantes")}
                      name="constantes-saturation-o2"
                      placeholder="95"
                    />
                  )}
                </div>
                <div>
                  <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="constantes-glycemie-capillaire">
                    Glycémie capillaire (g/L)
                  </label>
                  {!isEditing ? (
                    <div>
                      <CustomFieldDisplay type="number" value={data["constantes-glycemie-capillaire"]} />
                    </div>
                  ) : (
                    <input
                      value={data["constantes-glycemie-capillaire"]}
                      onChange={handleChange}
                      className="tailwindui"
                      autoComplete="off"
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      onInvalid={() => setActiveTab("Constantes")}
                      name="constantes-glycemie-capillaire"
                      placeholder="1"
                    />
                  )}
                </div>

                <div>
                  <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="constantes-temperature">
                    Température (°C)
                  </label>
                  {!isEditing ? (
                    <div>
                      <CustomFieldDisplay type="number" value={data["constantes-temperature"]} />{" "}
                    </div>
                  ) : (
                    <input
                      value={data["constantes-temperature"]}
                      onChange={handleChange}
                      className="tailwindui"
                      autoComplete="off"
                      type="number"
                      min="35"
                      max="43"
                      step="0.1"
                      onInvalid={() => setActiveTab("Constantes")}
                      name="constantes-temperature"
                      placeholder="38"
                    />
                  )}
                </div>
                <div>
                  <label
                    className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"}
                    htmlFor="constantes-tension-arterielle-systolique"
                  >
                    Tension artérielle (mmHg)
                  </label>
                  <div className="tw-grid tw-grid-cols-2 tw-gap-1">
                    {!isEditing ? (
                      <CustomFieldDisplay
                        type="text"
                        value={
                          data["constantes-tension-arterielle-systolique"] ? `${data["constantes-tension-arterielle-systolique"]} syst.` : undefined
                        }
                      />
                    ) : (
                      <input
                        value={data["constantes-tension-arterielle-systolique"]}
                        onChange={handleChange}
                        className="tailwindui"
                        autoComplete="off"
                        type="number"
                        min="0"
                        onInvalid={() => setActiveTab("Constantes")}
                        name="constantes-tension-arterielle-systolique"
                        placeholder="Systolique"
                      />
                    )}
                    {!isEditing ? (
                      <CustomFieldDisplay
                        type="text"
                        value={
                          data["constantes-tension-arterielle-diastolique"] ? `${data["constantes-tension-arterielle-diastolique"]} dias.` : undefined
                        }
                      />
                    ) : (
                      <input
                        value={data["constantes-tension-arterielle-diastolique"]}
                        onChange={handleChange}
                        className="tailwindui"
                        autoComplete="off"
                        type="number"
                        min="0"
                        onInvalid={() => setActiveTab("Constantes")}
                        name="constantes-tension-arterielle-diastolique"
                        placeholder="Diastolique"
                      />
                    )}
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
              personId={data.person}
              color="blue-900"
              showAssociatedItem={false}
              documents={data.documents.map((doc) => ({
                ...doc,
                type: doc.type ?? "document", // or 'folder'
                linkedItem: { _id: consultation?._id, type: "consultation" },
              }))}
              onAddDocuments={async (nextDocuments) => {
                const newData = {
                  ...data,
                  documents: [...data.documents, ...nextDocuments],
                };
                setData(newData);
                if (isNewConsultation) return;
                const ok = await handleSubmit({ newData });
                if (ok && nextDocuments.length > 1) toast.success("Documents ajoutés");
              }}
              onDeleteDocument={async (document) => {
                const newData = { ...data, documents: data.documents.filter((d) => d._id !== document._id) };
                setData(newData);
                if (isNewConsultation) return;
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
                if (isNewConsultation) return;
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
              comments={data.comments.map((c) => ({ ...c, type: "consultation", consultation }))}
              color="blue-900"
              canToggleShareComment
              typeForNewComment="consultation"
              onDeleteComment={async (comment) => {
                const newData = { ...data, comments: data.comments.filter((c) => c._id !== comment._id) };
                setData(newData);
                if (isNewConsultation) return;
                const ok = await handleSubmit({ newData });
                if (ok) toast.success("Commentaire supprimé");
              }}
              onSubmitComment={async (comment, isNewComment) => {
                const newData = isNewComment
                  ? { ...data, comments: [{ ...comment, _id: uuidv4() }, ...data.comments] }
                  : { ...data, comments: data.comments.map((c) => (c._id === comment._id ? comment : c)) };
                setData(newData);
                if (isNewConsultation) return;
                const ok = await handleSubmit({ newData });
                if (ok) toast.success("Commentaire enregistré");
              }}
            />
          </div>
          <div
            className={["tw-flex tw-h-[50vh] tw-w-full tw-flex-col tw-gap-4 tw-overflow-y-auto", activeTab !== "Historique" && "tw-hidden"]
              .filter(Boolean)
              .join(" ")}
          >
            <ConsultationHistory consultation={consultation} />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button name="Fermer" type="button" className="button-cancel" onClick={() => onClose()}>
          Fermer
        </button>
        {!isNewConsultation && !!isEditing && (
          <button
            type="button"
            name="cancel"
            disabled={!canEdit}
            title="Supprimer cette consultation - seul le créateur peut supprimer une consultation"
            className="button-destructive"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm("Voulez-vous supprimer cette consultation ?")) return;
              const [error] = await tryFetchExpectOk(async () => API.delete({ path: `/consultation/${consultation._id}` }));
              if (error) {
                toast.error("Impossible de supprimer cette consultation");
                return;
              }
              await refresh();
              toast.success("Consultation supprimée !");
              onClose();
            }}
          >
            Supprimer
          </button>
        )}
        {(isEditing || canSave) && (
          <button
            title="Sauvegarder cette consultation"
            type="submit"
            className="button-submit !tw-bg-blue-900"
            form="add-consultation-form"
            disabled={!canEdit}
          >
            Sauvegarder
          </button>
        )}
        {!isEditing && (
          <button
            title="Modifier cette consultation - seul le créateur peut modifier une consultation"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(true);
            }}
            className={[
              "button-submit !tw-bg-blue-900",
              activeTab === "Informations" || activeTab === "Constantes" ? "tw-visible" : "tw-invisible",
            ].join(" ")}
            disabled={!canEdit}
          >
            Modifier
          </button>
        )}
      </ModalFooter>
    </>
  );
}

function ConsultationHistory({ consultation }) {
  const history = useMemo(() => [...(consultation?.history || [])].reverse(), [consultation?.history]);
  const teams = useRecoilValue(teamsState);
  const consultationsFieldsIncludingCustomFields = useRecoilValue(consultationsFieldsIncludingCustomFieldsSelector);

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
                    const consultationField = consultationsFieldsIncludingCustomFields.find((f) => f.name === key);

                    if (key === "teams") {
                      return (
                        <p className="tw-flex tw-flex-col" key={key}>
                          <span>{consultationField?.label} : </span>
                          <code>"{(value.oldValue || []).map((teamId) => teams.find((t) => t._id === teamId)?.name).join(", ")}"</code>
                          <span>↓</span>
                          <code>"{(value.newValue || []).map((teamId) => teams.find((t) => t._id === teamId)?.name).join(", ")}"</code>
                        </p>
                      );
                    }

                    if (key === "onlyVisibleBy") {
                      return (
                        <p key={key}>
                          {consultationField?.label} : <br />
                          <code>{value.oldValue.length ? "Oui" : "Non"}</code> ➔ <code>{value.newValue.length ? "Oui" : "Non"}</code>
                        </p>
                      );
                    }

                    if (key === "person") {
                      return (
                        <p key={key}>
                          {consultationField?.label} : <br />
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
                        data-test-id={`${consultationField?.label}: ${JSON.stringify(value.oldValue || "")} ➔ ${JSON.stringify(value.newValue)}`}
                      >
                        {consultationField?.label} : <br />
                        <code>{JSON.stringify(value.oldValue || "")}</code> ➔ <code>{JSON.stringify(value.newValue)}</code>
                      </p>
                    );
                  })}
                </td>
              </tr>
            );
          })}
          {consultation?.createdAt && (
            <tr key={consultation.createdAt} className="tw-cursor-default">
              <td>{dayjsInstance(consultation.createdAt).format("DD/MM/YYYY HH:mm")}</td>
              <td>
                <UserName id={consultation.user} />
              </td>
              <td className="tw-max-w-prose">
                <p>Création de la consultation</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
