import { useMemo, useRef, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useHistory, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { organisationState, userState } from "../../../recoil/auth";
import { dayjsInstance, outOfBoundariesDate } from "../../../services/date";
import API, { tryFetchExpectOk } from "../../../services/api";
import { allowedTreatmentFieldsInHistory, encryptTreatment } from "../../../recoil/treatments";
import DatePicker from "../../../components/DatePicker";
import { CommentsModule } from "../../../components/CommentsGeneric";
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from "../../../components/tailwind/Modal";
import { itemsGroupedByTreatmentSelector } from "../../../recoil/selectors";
import { modalConfirmState } from "../../../components/ModalConfirm";
import CustomFieldDisplay from "../../../components/CustomFieldDisplay";
import UserName from "../../../components/UserName";
import { DocumentsModule } from "../../../components/DocumentsGeneric";
import TabsNav from "../../../components/tailwind/TabsNav";
import PersonName from "../../../components/PersonName";
import { useDataLoader } from "../../../components/DataLoader";
import { errorMessage } from "../../../utils";
import { decryptItem } from "../../../services/encryption";

export default function TreatmentModal() {
  const treatmentsObjects = useRecoilValue(itemsGroupedByTreatmentSelector);
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTreatmentId = searchParams.get("treatmentId");
  const newTreatment = searchParams.get("newTreatment");
  const currentTreatment = useMemo(() => {
    if (!currentTreatmentId) return null;
    return treatmentsObjects[currentTreatmentId];
  }, [currentTreatmentId, treatmentsObjects]);
  const personId = searchParams.get("personId");

  const [open, setOpen] = useState(false);
  const consultationIdRef = useRef(currentTreatmentId);
  const newConsultationRef = useRef(newTreatment);
  useEffect(() => {
    if (consultationIdRef.current !== currentTreatmentId) {
      consultationIdRef.current = currentTreatmentId;
      setOpen(!!currentTreatmentId);
    }
    if (newConsultationRef.current !== newTreatment) {
      newConsultationRef.current = newTreatment;
      setOpen(!!newTreatment);
    }
  }, [newTreatment, currentTreatmentId]);

  const manualCloseRef = useRef(false);
  const onAfterLeave = () => {
    if (manualCloseRef.current) history.goBack();
    manualCloseRef.current = false;
  };

  return (
    <ModalContainer open={open} size="3xl" onAfterLeave={onAfterLeave}>
      <TreatmentContent
        key={open}
        personId={personId}
        treatment={currentTreatment}
        onClose={() => {
          manualCloseRef.current = true;
          setOpen(false);
        }}
      />
    </ModalContainer>
  );
}

/**
 * @param {Object} props
 * @param {Function} props.onClose
 * @param {Boolean} props.isNewTreatment
 * @param {Object} props.treatment
 * @param {Object} props.person
 */

// if we create those objects within the component,
// it will be re-created on each dependency change
// and intialState will be re-created on each dependency change
const newTreatmentInitialState = (user, personId, organisation) => ({
  _id: null,
  startDate: new Date(),
  endDate: null,
  name: "",
  dosage: "",
  frequency: "",
  indication: "",
  user: user._id,
  person: personId,
  organisation: organisation._id,
  documents: [],
  comments: [],
  history: [],
});

function TreatmentContent({ onClose, treatment, personId }) {
  const setModalConfirmState = useSetRecoilState(modalConfirmState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const { refresh } = useDataLoader();

  const newTreatmentInitialStateRef = useRef(newTreatmentInitialState(user, personId, organisation));

  const initialState = useMemo(() => {
    if (treatment) {
      return {
        documents: [],
        comments: [],
        history: [],
        ...treatment,
      };
    }
    return newTreatmentInitialStateRef.current;
  }, [treatment]);

  const [activeTab, setActiveTab] = useState("Informations");
  const [data, setData] = useState(initialState);
  const isNewTreatment = !data?._id;

  useEffect(() => {
    setData(initialState);
  }, [initialState]);

  const canEdit = useMemo(() => !treatment || treatment.user === user._id, [treatment, user._id]);

  const [isEditing, setIsEditing] = useState(isNewTreatment);

  const handleChange = (event) => {
    const target = event.currentTarget || event.target;
    const { name, value } = target;
    setData((data) => ({ ...data, [name]: value }));
  };

  async function handleSubmit({ newData = {}, closeOnSubmit = false } = {}) {
    const body = { ...data, ...newData };
    if (!body.name) {
      setActiveTab("Informations");
      toast.error("Le nom est obligatoire");
      return false;
    }
    if (!body.startDate) {
      toast.error("La date de début est obligatoire");
      return false;
    }
    if (outOfBoundariesDate(body.startDate)) {
      setActiveTab("Informations");
      toast.error("La date de début de traitement est hors limites (entre 1900 et 2100)");
      return false;
    }
    if (body.endDate && outOfBoundariesDate(body.endDate)) {
      setActiveTab("Informations");
      toast.error("La date de fin de traitement est hors limites (entre 1900 et 2100)");
      return false;
    }

    if (!isNewTreatment && !!treatment) {
      const historyEntry = {
        date: new Date(),
        user: user._id,
        data: {},
      };
      for (const key in body) {
        if (!allowedTreatmentFieldsInHistory.map((field) => field.name).includes(key)) continue;
        if (body[key] !== treatment[key]) historyEntry.data[key] = { oldValue: treatment[key], newValue: body[key] };
      }
      if (Object.keys(historyEntry.data).length) {
        const prevHistory = Array.isArray(treatment.history) ? treatment.history : [];
        body.history = [...prevHistory, historyEntry];
      }
    }

    const [error, treatmentResponse] = await tryFetchExpectOk(async () =>
      isNewTreatment
        ? API.post({
            path: "/treatment",
            body: await encryptTreatment(body),
          })
        : API.put({
            path: `/treatment/${data._id}`,
            body: await encryptTreatment({ ...body, user: data.user || user._id }),
          })
    );
    if (error) {
      toast.error(errorMessage(error));
      return false;
    }
    const decryptedData = await decryptItem(treatmentResponse.data);
    if (!decryptedData) {
      toast.error("Erreur lors de la récupération des données du traitement");
      return false;
    }
    setData(decryptedData);
    await refresh();
    if (closeOnSubmit) onClose();
    return true;
  }

  return (
    <>
      <ModalHeader
        title={
          <>
            {isNewTreatment && "Ajouter un traitement"}
            {!isNewTreatment && !isEditing && `Traitement: ${data?.name}`}
            {!isNewTreatment && isEditing && `Modifier le traitement: ${data?.name}`}
            {!isNewTreatment && treatment?.user && (
              <UserName
                className="tw-block tw-text-right tw-text-base tw-font-normal tw-italic"
                id={treatment.user}
                wrapper={(name) => ` (créée par ${name})`}
              />
            )}
          </>
        }
        onClose={() => {
          if (JSON.stringify(data) === JSON.stringify(initialState)) return onClose();
          setModalConfirmState({
            open: true,
            options: {
              title: "Quitter le traitement sans enregistrer ?",
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
        <div>
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
            id="add-treatment-form"
            className={["tw-flex tw-h-[50vh] tw-w-full tw-flex-wrap tw-overflow-y-auto tw-p-4", activeTab !== "Informations" && "tw-hidden"]
              .filter(Boolean)
              .join(" ")}
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await handleSubmit({ closeOnSubmit: true });
              if (ok && isNewTreatment) toast.success("Traitement créé !");
              if (ok && !isNewTreatment) toast.success("Traitement mis à jour !");
            }}
          >
            <div className="tw-flex tw-w-full tw-flex-wrap">
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="medicine-name">
                  Nom
                </label>
                {isEditing ? (
                  <input
                    className="tailwindui"
                    required
                    onInvalid={() => setActiveTab("Informations")}
                    placeholder="Amoxicilline"
                    name="name"
                    id="medicine-name"
                    value={data.name}
                    onChange={handleChange}
                  />
                ) : (
                  <CustomFieldDisplay value={data.name} type="text" />
                )}
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="dosage">
                  Dosage
                </label>
                {isEditing ? (
                  <input className="tailwindui" placeholder="1mg" name="dosage" id="dosage" value={data.dosage} onChange={handleChange} />
                ) : (
                  <CustomFieldDisplay value={data.dosage} type="text" />
                )}
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="frequency">
                  Fréquence
                </label>
                {isEditing ? (
                  <input
                    className="tailwindui"
                    placeholder="1 fois par jour"
                    name="frequency"
                    id="frequency"
                    value={data.frequency}
                    onChange={handleChange}
                  />
                ) : (
                  <CustomFieldDisplay value={data.frequency} type="text" />
                )}
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="indication">
                  Indication
                </label>
                {isEditing ? (
                  <input
                    className="tailwindui"
                    placeholder="Angine"
                    name="indication"
                    id="indication"
                    value={data.indication}
                    onChange={handleChange}
                  />
                ) : (
                  <CustomFieldDisplay value={data.indication} type="text" />
                )}
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="startDate">
                  Date de début
                </label>
                {isEditing ? (
                  <DatePicker
                    id="startDate"
                    name="startDate"
                    defaultValue={data.startDate}
                    onChange={handleChange}
                    required
                    onInvalid={() => setActiveTab("Informations")}
                  />
                ) : (
                  <CustomFieldDisplay value={data.startDate} type="date" />
                )}
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label className={isEditing ? "" : "tw-text-sm tw-font-semibold tw-text-blue-900"} htmlFor="endDate">
                  Date de fin
                </label>
                {isEditing ? (
                  <DatePicker
                    id="endDate"
                    name="endDate"
                    defaultValue={data.endDate}
                    onChange={handleChange}
                    onInvalid={() => setActiveTab("Informations")}
                  />
                ) : (
                  <CustomFieldDisplay value={data.endDate} type="date" />
                )}
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
                linkedItem: { _id: treatment?._id, type: "treatment" },
              }))}
              onAddDocuments={async (nextDocuments) => {
                const newData = {
                  ...data,
                  documents: [...data.documents, ...nextDocuments],
                };
                setData(newData);
                if (isNewTreatment) return;
                const ok = await handleSubmit({ newData });
                if (ok && nextDocuments.length > 1) toast.success("Documents ajoutés");
              }}
              onDeleteDocument={async (document) => {
                const newData = { ...data, documents: data.documents.filter((d) => d._id !== document._id) };
                setData(newData);
                if (isNewTreatment) return;
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
                if (isNewTreatment) return;
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
              comments={data.comments.map((c) => ({ ...c, type: "treatment", treatment }))}
              color="blue-900"
              typeForNewComment="treatment"
              canToggleShareComment
              onDeleteComment={async (comment) => {
                const newData = { ...data, comments: data.comments.filter((c) => c._id !== comment._id) };
                setData(newData);
                if (isNewTreatment) return;
                const ok = await handleSubmit({ newData });
                if (ok) toast.success("Commentaire supprimé");
              }}
              onSubmitComment={async (comment, isNewComment) => {
                const newData = isNewComment
                  ? { ...data, comments: [{ ...comment, _id: uuidv4() }, ...data.comments] }
                  : { ...data, comments: data.comments.map((c) => (c._id === comment._id ? comment : c)) };
                setData(newData);
                if (isNewTreatment) return;
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
            <TreatmentHistory treatment={treatment} />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button name="Fermer" type="button" className="button-cancel" onClick={() => onClose()}>
          Fermer
        </button>
        {!isNewTreatment && !!isEditing && (
          <button
            type="button"
            name="cancel"
            className="button-destructive"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm("Voulez-vous supprimer ce traitement ?")) return;
              const [error] = await tryFetchExpectOk(async () => API.delete({ path: `/treatment/${treatment._id}` }));
              if (error) {
                toast.error(errorMessage(error));
                return;
              }
              await refresh();
              toast.success("Traitement supprimé !");
              onClose();
            }}
          >
            Supprimer
          </button>
        )}

        {isEditing && (
          <button
            title="Sauvegarder ce traitement"
            type="submit"
            className="button-submit !tw-bg-blue-900"
            form="add-treatment-form"
            disabled={!canEdit}
          >
            Sauvegarder
          </button>
        )}
        {!isEditing && (
          <button
            title="Modifier ce traitement - seul le créateur peut modifier un traitement"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(true);
            }}
            className={["button-submit !tw-bg-blue-900", activeTab === "Informations" ? "tw-visible" : "tw-invisible"].join(" ")}
            disabled={!canEdit}
          >
            Modifier
          </button>
        )}
      </ModalFooter>
    </>
  );
}

function TreatmentHistory({ treatment }) {
  const history = useMemo(() => [...(treatment?.history || [])].reverse(), [treatment?.history]);

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
                    const treatmentField = allowedTreatmentFieldsInHistory.find((f) => f.name === key);

                    if (key === "person") {
                      return (
                        <p key={key}>
                          {treatmentField?.label} : <br />
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
                        data-test-id={`${treatmentField?.label}: ${JSON.stringify(value.oldValue || "")} ➔ ${JSON.stringify(value.newValue)}`}
                      >
                        {treatmentField?.label} : <br />
                        <code>{JSON.stringify(value.oldValue || "")}</code> ➔ <code>{JSON.stringify(value.newValue)}</code>
                      </p>
                    );
                  })}
                </td>
              </tr>
            );
          })}
          {!!treatment?.createdAt && (
            <tr key={treatment.createdAt} className="tw-cursor-default">
              <td>{dayjsInstance(treatment.createdAt).format("DD/MM/YYYY HH:mm")}</td>
              <td>
                <UserName id={treatment.user} />
              </td>
              <td className="tw-max-w-prose">
                <p>Création du traitement</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
