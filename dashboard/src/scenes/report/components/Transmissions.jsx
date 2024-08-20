import React, { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { encryptReport } from "../../../recoil/reports";
import API, { tryFetchExpectOk } from "../../../services/api";
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from "../../../components/tailwind/Modal";
import SelectAndCreateCollaboration from "../SelectAndCreateCollaboration";
import { dayjsInstance } from "../../../services/date";
import { useDataLoader } from "../../../components/DataLoader";
import { errorMessage } from "../../../utils";
import { decryptItem } from "../../../services/encryption";

export default function Transmissions({ period, selectedTeamsObject, reports }) {
  const [transmissionForModal, setTransmissionForModal] = useState(null);
  const [isTransmissionModalOpen, setIsTransmissionModalOpen] = useState(false);
  const days = useMemo(() => {
    const numberOfDays = Math.abs(dayjsInstance(period.startDate).diff(period.endDate, "day")) + 1;
    const days = Array.from({ length: numberOfDays }, (_, index) => dayjsInstance(period.startDate).add(index, "day").format("YYYY-MM-DD"));
    return days;
  }, [period]);

  return (
    <>
      <section>
        <TransmissionModal
          day={transmissionForModal?.day}
          team={transmissionForModal?.team}
          report={transmissionForModal?.report}
          isOpen={isTransmissionModalOpen}
          onClose={() => setIsTransmissionModalOpen(false)}
          onClosed={() => setTransmissionForModal(null)}
        />
        <h3 className="tw-w-full tw-px-3 tw-py-2 tw-text-base tw-font-medium tw-text-black">👋&nbsp;Comment s'est passée la&nbsp;journée&nbsp;?</h3>
        {days.map((day) => {
          return (
            <details open={days.length === 1} className="tw-my-2 tw-p-2" key={day}>
              <summary>
                <h4 className="tw-inline-block tw-text-base tw-capitalize">{dayjsInstance(day).format("dddd D MMM")}</h4>
              </summary>
              {Object.entries(selectedTeamsObject).map(([teamId, team]) => {
                const report = reports.find((report) => report.team === teamId && report.date === day);
                const key = team.name.replace(/[^a-zA-Z0-9]/g, "-") + day;
                return (
                  <Transmission
                    day={day}
                    onOpenTransmissionModal={() => {
                      setTransmissionForModal({ day, team, report: structuredClone(report) });
                      setIsTransmissionModalOpen(true);
                    }}
                    teamId={teamId}
                    report={report}
                    team={selectedTeamsObject[teamId]}
                    key={key}
                    reactSelectInputId={`report-select-collaboration-${key}`}
                  />
                );
              })}
            </details>
          );
        })}
      </section>
      <section
        aria-hidden="true"
        className="printonly tw-mt-12 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow"
      >
        <h3 className="tw-w-full tw-px-3 tw-py-2 tw-text-base tw-font-medium tw-text-black">👋&nbsp;Comment s'est passée la&nbsp;journée&nbsp;?</h3>
        {days.map((day) => {
          return (
            <div className="tw-border-t tw-border-zinc-200" key={day}>
              <h4 className="tw-inline-block tw-p-4 tw-text-base tw-capitalize">{dayjsInstance(day).format("dddd D MMM")}</h4>
              {Object.entries(selectedTeamsObject).map(([teamId, team]) => {
                const report = reports.find((report) => report.team === teamId && report.date === day);
                const key = team.name.replace(/[^a-zA-Z0-9]/g, "-") + day;
                return <TransmissionPrint report={report} team={selectedTeamsObject[teamId]} key={key} />;
              })}
            </div>
          );
        })}
      </section>
    </>
  );
}

function TransmissionPrint({ report, team }) {
  const collaborations = report?.collaborations ?? [];

  return (
    <>
      <div className="p-2 tw-mb-4 tw-flex tw-flex-col tw-rounded-2xl tw-bg-gray-100 tw-mx-4 tw-bg-transparent">
        <p className="tw-font-medium">
          {team?.nightSession ? "🌒" : "☀️ "} {team?.name || ""}
        </p>
        <div className="tw-ml-4 tw-border-l-2 tw-border-zinc-300 tw-pl-8">
          {!report?.description ? (
            <>
              <h5 className="tw-text-base tw-font-medium">Aucune transmission pour cette journée</h5>
            </>
          ) : (
            <>
              {report?.description?.length > 0 && <h5 className="tw-text-base tw-font-medium">Transmission :</h5>}
              <p className="tw-border-l tw-border-zinc-200 tw-pl-4">
                {report?.description?.split("\n").map((sentence, index) => (
                  <React.Fragment key={index}>
                    {sentence}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </>
          )}
          <hr />
          <div className="tw-my-2">
            {!!collaborations.length && (
              <>
                <p className="tw-mb-2">Co-interventions avec&nbsp;:</p>
                <p className="tw-border-l tw-border-zinc-200 tw-pl-4">{collaborations.join(", ")}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Transmission({ report, team, day, teamId, reactSelectInputId, onOpenTransmissionModal }) {
  const [collaborations, setCollaborations] = useState(report?.collaborations ?? []);
  // Désactivation temporaire du FIX des lutins d'internet https://github.com/mano-sesan/mano/pull/506/files
  // A rediscuter avec Arnaud, il pose problème pour la modification d'une transmission par deux personnes.
  // Aussi : au vu des tests que j'ai effectué, il semble que le problème de disparition soit lié justement
  // au composant qui peut se recharger, et donc la fenetre disparaitre.
  // Je pense qu'il n'y a plus besoin de ce fix (à discuter cependant)
  //
  // const [transmission, setTransmission] = useSessionStorage("transmission", "");
  const { refresh } = useDataLoader();

  const onSaveReport = async (body) => {
    const [error] = await tryFetchExpectOk(async () =>
      report?._id
        ? API.put({ path: `report/${report._id}`, body: await encryptReport(body) })
        : API.post({ path: "report", body: await encryptReport(body) })
    );
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    await refresh();
  };

  return (
    <>
      <div className="p-2 tw-mb-4 tw-flex tw-flex-col tw-rounded-2xl tw-bg-gray-100">
        <p className="tw-font-medium">
          {team?.nightSession ? "🌒" : "☀️ "} {team?.name || ""}
        </p>
        <div>
          {!report?.description ? (
            <>
              <button onClick={() => onOpenTransmissionModal()} className="tw-mx-auto tw-rounded-lg tw-border tw-border-main tw-px-3 tw-py-1">
                Ajouter une transmission
              </button>
            </>
          ) : (
            <>
              {report?.description?.length > 0 && <h5 className="tw-text-base tw-font-medium">Transmission :</h5>}
              <p>
                {report?.description?.split("\n").map((sentence, index) => (
                  <React.Fragment key={index}>
                    {sentence}
                    <br />
                  </React.Fragment>
                ))}
              </p>
              <button onClick={() => onOpenTransmissionModal()} className="tw-mx-auto tw-rounded-lg tw-border tw-border-main tw-px-3 tw-py-1">
                Modifier la transmission
              </button>
            </>
          )}
          <hr />
          <div className="tw-my-2">
            {!!collaborations.length && (
              <>
                <p className="tw-mb-2">Co-interventions avec&nbsp;:</p>
              </>
            )}
            <SelectAndCreateCollaboration
              values={collaborations}
              onChange={(e) => {
                const nextCollabs = e.currentTarget.value;
                setCollaborations(nextCollabs);
                onSaveReport({
                  ...report,
                  collaborations: nextCollabs,
                  team: teamId,
                  date: day,
                });
              }}
              inputId={reactSelectInputId}
            />
          </div>
        </div>
      </div>
    </>
  );
}
// Cette fonction (issue de chatGPT, parce que la flemme) permet de fusionner les deux textes de transmission.
// Si les deux textes à mettre à la suite commencent pareil (plus de 30 caractères), on supprime le préfixe commun du second texte.
function concatTransmissions(text1, text2) {
  function commonPrefixLength(s1, s2) {
    let minLength = Math.min(s1.length, s2.length);
    let i = 0;
    while (i < minLength && s1[i] === s2[i]) {
      i++;
    }
    return i;
  }
  let commonLength = commonPrefixLength(text1, text2);
  if (commonLength > 30) {
    text2 = text2.substring(commonLength);
  }
  return text1 + "\n\n" + text2;
}

function TransmissionModal({ onClose, onClosed, report, day, team, isOpen }) {
  const teamId = team?._id;
  const { refresh } = useDataLoader();

  const initialDescription = report?.description;
  const [remoteDescription, setRemoteDescription] = useState(initialDescription);
  const [remoteUpdatedAt, setRemoteUpdatedAt] = useState(report?.updatedAt);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemoteDescription(initialDescription);
    intervalRef.current = setInterval(
      () => {
        if (!report?._id) return;
        API.get({ path: `report/${report._id}` }).then(async (response) => {
          if (response.ok) {
            const decryptedReport = await decryptItem(response.data);
            setRemoteDescription(decryptedReport.description);
            setRemoteUpdatedAt(decryptedReport.updatedAt);
          }
        });
      },
      process.env.NODE_ENV === "development" ? 2000 : 5000
    );
    return () => clearInterval(intervalRef.current);
  }, [report?._id, initialDescription]);

  const hasBeenModified = remoteDescription !== initialDescription && remoteDescription !== "";

  return (
    <ModalContainer size="3xl" open={isOpen} onClose={() => onClose()} onAfterLeave={() => onClosed()}>
      <ModalHeader title={`Transmission du ${dayjsInstance(day).format("dddd D MMM")} - ${team?.nightSession ? "🌒" : "☀️ "} ${team?.name || ""}`} />
      <ModalBody className="tw-py-2">
        <form
          id={`edit-transmission-${day}-${teamId}`}
          className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const description = hasBeenModified ? concatTransmissions(remoteDescription, formData.get("description")) : formData.get("description");

            const body = {
              ...report,
              description,
              team: teamId,
              date: day,
            };

            const [error] = await tryFetchExpectOk(async () =>
              report?._id
                ? API.put({ path: `report/${report._id}`, body: await encryptReport(body) })
                : API.post({ path: "report", body: await encryptReport(body) })
            );
            if (error) {
              toast.error(errorMessage(error));
              return;
            }
            await refresh();
            onClose();
          }}
        >
          <div>
            {hasBeenModified ? (
              <div className="tw-text-xs">
                <span>Modifié par un utilisateur {dayjsInstance(remoteUpdatedAt).fromNow()}</span>
                <br />
                <span className="tw-opacity-50">
                  Votre transmission sera enregistrée à la suite. Vous pouvez l'enregistrer et la réouvrir pour voir les modifications.
                </span>
              </div>
            ) : (
              // La taille de la marge est importante ici pour que la hauteur soit la même selon les cas
              <label htmlFor="description" className="tailwindui !tw-my-1.5">
                Transmission
              </label>
            )}
            <textarea
              rows={20}
              className="tailwindui"
              autoComplete="off"
              id="description"
              name="description"
              type="text"
              placeholder="Entrez ici votre transmission de la journée"
              defaultValue={report?.description}
            />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          name="cancel"
          className="button-cancel"
          onClick={() => {
            onClose();
          }}
        >
          Annuler
        </button>
        <button type="submit" className="button-submit" form={`edit-transmission-${day}-${teamId}`}>
          Enregistrer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
}
