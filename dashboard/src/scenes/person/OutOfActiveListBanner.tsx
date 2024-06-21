import { Alert } from "reactstrap";
import { formatDateWithFullMonth } from "../../services/date";
import { currentTeamState } from "../../recoil/auth";
import { useRecoilValue } from "recoil";
import { PersonInstance } from "../../types/person";

type outOfTeamsInformation = {
  team: string;
  reasons: string[];
};
type HistoryEntryForOutOfTeamsInformations = {
  outOfTeamsInformations: outOfTeamsInformation[];
};

export default function OutOfActiveListBanner({ person }: { person: PersonInstance }) {
  const team = useRecoilValue(currentTeamState);

  if (person.outOfActiveList) {
    return (
      <Alert color="warning" className="noprint">
        {person?.name} est en dehors de la file active de l'organisation
        {person.outOfActiveListReasons?.length ? (
          <>
            , pour {person.outOfActiveListReasons.length > 1 ? "les motifs suivants" : "le motif suivant"} :{" "}
            <b>{person.outOfActiveListReasons.join(", ")}</b>
          </>
        ) : (
          ""
        )}{" "}
        {person.outOfActiveListDate && ` depuis le ${formatDateWithFullMonth(person.outOfActiveListDate)}`}
      </Alert>
    );
  }

  const isInSelectedTeam = person.assignedTeams?.some((assignedTeam) => assignedTeam === team._id);
  // On vérifie si la personne est hors de la file active de l'équipe sélectionnée
  if (!isInSelectedTeam && person.history) {
    for (let i = person.history.length - 1; i >= 0; i--) {
      const history = person.history[i];
      if (history.data.assignedTeams?.oldValue?.includes(team._id) && !history.data.assignedTeams?.newValue?.includes(team._id)) {
        const outOfTeamsInformations = (
          ((history.data as unknown as HistoryEntryForOutOfTeamsInformations).outOfTeamsInformations || []) as outOfTeamsInformation[]
        ).find((reason) => reason.team === team._id);
        return (
          <Alert color="warning" className="noprint">
            {person?.name} est sortie de la file active de l'équipe <b>{team.name}</b> depuis le {formatDateWithFullMonth(history.date)}
            {outOfTeamsInformations?.reasons?.length ? (
              <>
                , pour {outOfTeamsInformations.reasons?.length > 1 ? "les motifs suivants" : "le motif suivant"} :{" "}
                <b>{outOfTeamsInformations.reasons?.join(", ")}</b>
              </>
            ) : (
              ""
            )}
          </Alert>
        );
      }
    }
  }
}
