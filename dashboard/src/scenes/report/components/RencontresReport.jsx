import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from "../../../components/tailwind/Modal";
import { FullScreenIcon } from "../../../assets/icons/FullScreenIcon";
import Table from "../../../components/table";
import { currentTeamState, userState, usersState } from "../../../recoil/auth";
import { useRecoilValue } from "recoil";
import UserName from "../../../components/UserName";
import TagTeam from "../../../components/TagTeam";
import PersonName from "../../../components/PersonName";
import DateBloc, { TimeBlock } from "../../../components/DateBloc";
import Rencontre from "../../../components/Rencontre";
import { personsObjectSelector } from "../../../recoil/selectors";
import { sortRencontres } from "../../../recoil/rencontres";
import { useLocalStorage } from "../../../services/useLocalStorage";

export const RencontresReport = ({ rencontres, period, selectedTeams }) => {
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <>
      <section title="Rencontres" className="noprint tw-relative tw-m-2 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-main">
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-2xl tw-font-semibold tw-text-white">{rencontres.length}</p>
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-sm tw-font-normal tw-text-white">rencontre{rencontres.length > 1 ? "s" : ""}</p>
        <button
          title="Passer les rencontres en plein écran"
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
          <h3 className="tw-m-0 tw-text-base tw-font-medium">Rencontres ({rencontres.length})</h3>
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
          <RencontresTable rencontres={rencontres} period={period} selectedTeams={selectedTeams} />
        </div>
      </section>
      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`Rencontres (${rencontres.length})`} onClose={() => setFullScreen(false)} />
        <ModalBody>
          <RencontresTable rencontres={rencontres} period={period} selectedTeams={selectedTeams} />
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

const RencontresTable = ({ period, rencontres, selectedTeams }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const persons = useRecoilValue(personsObjectSelector);
  const user = useRecoilValue(userState);
  const users = useRecoilValue(usersState);
  const [rencontreToEdit, setRencontreToEdit] = useState(null);

  const [sortBy, setSortBy] = useLocalStorage("report-rencontre-sortBy", "dueAt");
  const [sortOrder, setSortOrder] = useLocalStorage("report-rencontre-sortOrder", "ASC");

  const rencontresPopulated = useMemo(() => {
    return rencontres.map((rencontre) => {
      return {
        ...rencontre,
        personPopulated: persons[rencontre.person],
        userPopulated: rencontre.user ? users.find((u) => u._id === rencontre.user) : undefined,
      };
    });
  }, [rencontres, persons, users]);

  const rencontresSorted = useMemo(() => {
    return [...rencontresPopulated].sort(sortRencontres(sortBy, sortOrder));
  }, [rencontresPopulated, sortBy, sortOrder]);

  return (
    <>
      <div className="tw-px-4 tw-py-2 print:tw-mb-4 print:tw-px-0">
        <div className="noprint tw-mb-5 tw-flex tw-justify-end">
          <div>
            <button
              type="button"
              className="button-submit tw-mb-2 tw-ml-auto"
              onClick={() =>
                setRencontreToEdit({
                  date: dayjs(period.startDate),
                  user: user._id,
                  team: selectedTeams?.length === 1 ? selectedTeams[0]._id : currentTeam._id,
                })
              }
            >
              Ajouter une rencontre
            </button>
          </div>
        </div>
        <Rencontre rencontre={rencontreToEdit} personId={rencontreToEdit?.person} onFinished={() => setRencontreToEdit(null)} />
        {!!rencontres.length && (
          <Table
            className="Table"
            onRowClick={setRencontreToEdit}
            data={rencontresSorted}
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
                title: "Territoire",
                dataKey: "territory",
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortBy,
                sortOrder,
                render: (r) => {
                  if (!r.territoryObject) return null;
                  return (
                    <div className="tw-flex tw-items-center tw-justify-center">
                      <div className="tw-bg-black tw-py-0.5 tw-px-1 tw-rounded tw-w-fit tw-text-white tw-text-xs">
                        {r.territoryObject?.name || ""}
                      </div>
                    </div>
                  );
                },
              },
              {
                title: "Équipe en charge",
                dataKey: "team",
                render: (rencontre) => <TagTeam teamId={rencontre?.team} />,
              },
            ]}
          />
        )}
      </div>
    </>
  );
};
