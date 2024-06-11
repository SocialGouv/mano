import { useMemo, useState } from "react";
import dayjs from "dayjs";
import Passage from "../../../components/Passage";
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from "../../../components/tailwind/Modal";
import { FullScreenIcon } from "../../../assets/icons/FullScreenIcon";
import Table from "../../../components/table";
import { currentTeamState, userState, usersState } from "../../../recoil/auth";
import { useRecoilValue } from "recoil";
import UserName from "../../../components/UserName";
import TagTeam from "../../../components/TagTeam";
import PersonName from "../../../components/PersonName";
import DateBloc, { TimeBlock } from "../../../components/DateBloc";
import { useLocalStorage } from "../../../services/useLocalStorage";
import { sortPassages } from "../../../recoil/passages";
import { personsObjectSelector } from "../../../recoil/selectors";

export const PassagesReport = ({ passages, period, selectedTeams }) => {
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <>
      <section title="Passages" className="noprint tw-relative tw-m-2 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-main">
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-2xl tw-font-semibold tw-text-white">{passages.length}</p>
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-sm tw-font-normal tw-text-white">passage{passages.length > 1 ? "s" : ""}</p>
        <button
          title="Passer les passages en plein écran"
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
          <h3 className="tw-m-0 tw-text-base tw-font-medium">Passages ({passages.length})</h3>
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
          <PassagesTable passages={passages} period={period} selectedTeams={selectedTeams} />
        </div>
      </section>
      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`Passages (${passages.length})`} onClose={() => setFullScreen(false)} />
        <ModalBody>
          <PassagesTable passages={passages} period={period} selectedTeams={selectedTeams} />
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

const PassagesTable = ({ period, passages, selectedTeams }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const persons = useRecoilValue(personsObjectSelector);
  const user = useRecoilValue(userState);
  const users = useRecoilValue(usersState);
  const [passageToEdit, setPassageToEdit] = useState(null);
  const [sortBy, setSortBy] = useLocalStorage("report-passage-sortBy", "dueAt");
  const [sortOrder, setSortOrder] = useLocalStorage("report-passage-sortOrder", "ASC");

  const passagesPopulated = useMemo(() => {
    return passages.map((passage) => {
      return {
        ...passage,
        personPopulated: persons[passage.person],
        userPopulated: users.find((u) => u._id === passage.user),
      };
    });
  }, [passages, persons, users]);

  const passagesSorted = useMemo(() => {
    return [...passagesPopulated].sort(sortPassages(sortBy, sortOrder));
  }, [passagesPopulated, sortBy, sortOrder]);

  return (
    <>
      <div className="tw-px-4 tw-py-2 print:tw-mb-4 print:tw-px-0">
        <div className="noprint tw-mb-5 tw-flex tw-justify-end">
          <div>
            <button
              type="button"
              className="button-submit tw-mb-2 tw-ml-auto"
              onClick={() =>
                setPassageToEdit({
                  date: dayjs(period.startDate),
                  user: user._id,
                  team: selectedTeams?.length === 1 ? selectedTeams[0]._id : currentTeam._id,
                })
              }
            >
              Ajouter un passage
            </button>
          </div>
        </div>
        <Passage passage={passageToEdit} personId={passageToEdit?.person} onFinished={() => setPassageToEdit(null)} />
        {!!passages.length && (
          <Table
            className="Table"
            onRowClick={setPassageToEdit}
            data={passagesSorted}
            rowKey={"_id"}
            columns={[
              {
                title: "Date",
                dataKey: "date",
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortBy,
                sortOrder,
                render: (passage) => {
                  return (
                    <>
                      <DateBloc date={passage.date} />
                      <TimeBlock time={passage.date} />
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
                render: (passage) =>
                  passage.person ? <PersonName showOtherNames item={passage} /> : <span style={{ opacity: 0.3, fontStyle: "italic" }}>Anonyme</span>,
              },
              {
                title: "Enregistré par",
                dataKey: "user",
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortBy,
                sortOrder,
                render: (passage) => (passage.user ? <UserName id={passage.user} /> : null),
              },
              { title: "Commentaire", dataKey: "comment", onSortOrder: setSortOrder, onSortBy: setSortBy, sortBy, sortOrder },
              {
                title: "Équipe en charge",
                dataKey: "team",
                render: (passage) => <TagTeam teamId={passage?.team} />,
              },
            ]}
          />
        )}
      </div>
    </>
  );
};
