import { dayjsInstance } from "../../../services/date";
import React, { useState } from "react";
import EditModal from "./EditModal";
import TagTeam from "../../../components/TagTeam";
import ExclamationMarkButton from "../../../components/tailwind/ExclamationMarkButton";

export function InfosMain({ person, isMedicalFile }) {
  const [editModal, setEditModal] = useState(false);
  return (
    <div>
      {Boolean(editModal) && <EditModal isMedicalFile={isMedicalFile} person={person} selectedPanel={"main"} onClose={() => setEditModal(false)} />}
      <div
        className={["tw-flex tw-min-h-[350px] tw-items-center !tw-rounded-lg", isMedicalFile ? "!tw-bg-blue-900" : "!tw-bg-main"].join(" ")}
        data-test-id={person._id}
      >
        <div className="tw-flex-1 tw-p-5 tw-text-center tw-text-white">
          <div className="tw-border-b tw-border-white tw-pb-2 [overflow-wrap:anywhere]">
            {person.alertness && <ExclamationMarkButton className="tw-mr-2" />}
            <b>{person.name}</b>
            {person.otherNames && <span> ({person.otherNames})</span>}
            <Teams person={person} />
          </div>
          <div className="tw-flex tw-flex-col tw-gap-4 tw-pt-4 tw-text-sm ">
            {person.birthdate && (
              <div>
                <div>
                  <b>Âge :</b> {dayjsInstance(dayjsInstance()).diff(person.birthdate, "year")} ans
                </div>
                <i>{dayjsInstance(person.birthdate).format("DD/MM/YYYY")}</i>
              </div>
            )}
            <div>
              <b>Genre : </b>
              {person.gender}
            </div>
            <div>
              <b>Suivi·e depuis le : </b>
              {dayjsInstance(person.followedSince || person.createdAt).format("DD/MM/YYYY")}
            </div>
            {person.wanderingAt ? (
              <div>
                <b>En rue depuis le : </b>
                {dayjsInstance(person.wanderingAt).format("DD/MM/YYYY")}
              </div>
            ) : null}
            <div>
              <b>Téléphone : </b>
              {person.phone}
            </div>
            <div>
              <b>Email : </b>
              {person.email ? (
                <a className="tw-text-white tw-underline" href={`mailto:${person.email}`} target="_blank" rel="noopener noreferrer">
                  {person.email}
                </a>
              ) : null}
            </div>
          </div>
          <div className="tw-mt-4 tw-flex tw-flex-row tw-items-center tw-justify-center tw-gap-2">
            <button className="tw-block tw-px-2 tw-py-1 tw-text-sm tw-text-white tw-underline tw-opacity-80" onClick={() => window.print()}>
              Imprimer
            </button>
            <button
              className={["tw-block tw-rounded tw-bg-white tw-px-2 tw-py-1 tw-text-sm", isMedicalFile ? "!tw-text-blue-900" : "!tw-text-main"].join(
                " "
              )}
              onClick={() => setEditModal(true)}
            >
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Teams = ({ person: { _id, assignedTeams } }) => (
  <div key={_id} className="tw-mt-2 tw-grid tw-gap-1">
    {assignedTeams?.map((teamId) => (
      <TagTeam key={teamId} teamId={teamId} />
    ))}
  </div>
);
