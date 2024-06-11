import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from "../../../components/tailwind/Modal";
import { FullScreenIcon } from "../../../assets/icons/FullScreenIcon";
import Table from "../../../components/table";
import UserName from "../../../components/UserName";
import TagTeam from "../../../components/TagTeam";
import PersonName from "../../../components/PersonName";
import DateBloc, { TimeBlock } from "../../../components/DateBloc";
import { useLocalStorage } from "../../../services/useLocalStorage";

export const PersonsReport = ({ personsCreated, period, selectedTeams }) => {
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <>
      <section title="Personnes créées" className="noprint tw-relative tw-m-2 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-main">
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-2xl tw-font-semibold tw-text-white">{personsCreated.length}</p>
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-sm tw-font-normal tw-text-white">
          personne{personsCreated.length > 1 ? "s" : ""} créée{personsCreated.length > 1 ? "s" : ""}
        </p>
        <button
          title="Passer les personnes créées en plein écran"
          className="tw-absolute -tw-right-1.5 -tw-top-1.5 tw-h-6 tw-w-6 tw-rounded-full tw-text-white tw-transition hover:tw-scale-125 disabled:tw-cursor-not-allowed disabled:tw-opacity-30"
          onClick={() => setFullScreen(true)}
        >
          <FullScreenIcon />
        </button>
      </section>
      <section
        aria-hidden="true"
        className="printonly tw-mt-12 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow"
      >
        <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
          <h3 className="tw-m-0 tw-text-base tw-font-medium">Personnes créées ({personsCreated.length})</h3>
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
          <PersonsTable personsCreated={personsCreated} period={period} selectedTeams={selectedTeams} />
        </div>
      </section>
      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`Personnes créées (${personsCreated.length})`} onClose={() => setFullScreen(false)} />
        <ModalBody>
          <PersonsTable personsCreated={personsCreated} period={period} selectedTeams={selectedTeams} />
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
            Fermer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

const PersonsTable = ({ personsCreated }) => {
  const [sortBy, setPersonSortBy] = useLocalStorage("person-sortBy", "name");
  const [sortOrder, setPersonSortOrder] = useLocalStorage("person-sortOrder", "ASC");
  const history = useHistory();

  return (
    <>
      <div className="tw-px-4 tw-py-2 print:tw-mb-4 print:tw-px-0">
        {!!personsCreated.length && (
          <Table
            className="Table"
            onRowClick={(person) => {
              if (person) history.push(`/person/${person._id}`);
            }}
            data={personsCreated}
            rowKey={"_id"}
            columns={[
              {
                title: "Date",
                dataKey: "date",
                render: (person) => {
                  return (
                    <>
                      <DateBloc date={person.createdAt} />
                      <TimeBlock time={person.createdAt} />
                    </>
                  );
                },
              },
              {
                title: "Personne (nom)",
                dataKey: "name",
                onSortOrder: setPersonSortOrder,
                onSortBy: setPersonSortBy,
                sortOrder,
                sortBy,
                render: (person) => <PersonName showOtherNames item={{ person: person._id }} />,
              },
              {
                title: "Utilisateur (créateur)",
                dataKey: "user",
                onSortOrder: setPersonSortOrder,
                onSortBy: setPersonSortBy,
                sortOrder,
                sortBy,
                render: (p) => <UserName id={p.user} />,
              },
              {
                title: "Équipe en charge",
                dataKey: "assignedTeams",
                render: (person) => (
                  <React.Fragment>
                    {person.assignedTeams?.map((teamId) => (
                      <TagTeam key={teamId} teamId={teamId} />
                    ))}
                  </React.Fragment>
                ),
              },
            ]}
          />
        )}
      </div>
    </>
  );
};
