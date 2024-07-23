import React, { useMemo } from "react";
import { useRecoilValue } from "recoil";
import { customFieldsPersonsSelector } from "../../../recoil/persons";
import { currentTeamAuthentifiedState, teamsState, userState } from "../../../recoil/auth";
import { dayjsInstance, formatDateTimeWithNameOfDay, formatDateWithNameOfDay, formatTime } from "../../../services/date";
import CustomFieldDisplay from "../../../components/CustomFieldDisplay";
import { CANCEL, DONE, getName } from "../../../recoil/actions";
import { PersonPopulated } from "../../../types/person";
import UserName from "../../../components/UserName";

export function SummaryPrint({ person }: { person: PersonPopulated }) {
  const user = useRecoilValue(userState);
  const team = useRecoilValue(currentTeamAuthentifiedState);
  const teams = useRecoilValue(teamsState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);
  const actions = person.actions || [];
  const personPassages = useMemo(
    () => [...(person?.passages || [])].sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), "day") ? 1 : -1)),
    [person]
  );
  const personRencontres = useMemo(
    () => [...(person?.rencontres || [])].sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), "day") ? 1 : -1)),
    [person]
  );
  const comments = useMemo(
    () =>
      [...(person?.comments || [])].sort((r1, r2) =>
        dayjsInstance(r1.date || r1.createdAt).isBefore(dayjsInstance(r2.date || r2.createdAt), "day") ? 1 : -1
      ),
    [person]
  );

  return (
    <div className="printonly tw-px-4 [&_strong]:tw-font-medium">
      <h1>Dossier social de {person?.name}</h1>
      <small className="tw-pl-8">extrait le {formatDateTimeWithNameOfDay(dayjsInstance())}</small>
      <div className="tw-mx-0 tw-mb-5 tw-mt-8 tw-flex tw-items-center">
        <h2 className="tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Informations générales</h2>
      </div>
      <div className="tw-px-8">
        {person.alertness && <p>Personne très vulnérable, ou ayant besoin d'une attention particulière</p>}
        <div>
          <strong>Date de naissance</strong>&nbsp;: <CustomFieldDisplay type="date" value={person.birthdate} />
        </div>
        <div>
          <strong>Genre</strong>&nbsp;: <CustomFieldDisplay type="text" value={person.gender} />
        </div>
        <div>
          <strong>Suivi·e depuis le</strong>&nbsp;: <CustomFieldDisplay type="date" value={person.followedSince || person.createdAt} />
        </div>
        {person.wanderingAt ? (
          <div>
            <strong>En rue depuis le</strong>&nbsp;:
            <CustomFieldDisplay type="date" value={person.wanderingAt} />
          </div>
        ) : null}
        <div>
          <strong>Téléphone</strong>&nbsp;: <CustomFieldDisplay type="text" value={person.phone} />
        </div>
        <div>
          <strong>Email</strong>&nbsp;: <CustomFieldDisplay type="text" value={person.email} />
        </div>
      </div>
      <hr className="tw-my-8" />
      {customFieldsPersons.map(({ name, fields }, i) => {
        const enabledFields = fields.filter((f) => f.enabled || f.enabledTeams?.includes(team._id));
        return (
          <React.Fragment key={name + i}>
            <div className="tw-mx-0 tw-mb-5 tw-mt-16 tw-flex tw-items-center">
              <h2 className="tw-flex tw-justify-between tw-text-xl tw-font-extrabold">{name}</h2>
            </div>
            <div className="tw-px-8">
              {enabledFields.map((field, i) => {
                return (
                  <div key={field.label + i}>
                    <strong>{field.label}</strong>&nbsp;: <CustomFieldDisplay type={field.type} value={person[field.name]} />
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        );
      })}
      <hr className="tw-my-8" />
      <div className="tw-mx-0 tw-mb-5 tw-mt-16 tw-flex tw-items-center">
        <h2 className="tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Actions</h2>
      </div>
      <div className="tw-px-8">
        {Boolean(actions.length > 0) &&
          actions.map((action, i) => {
            const date = formatDateWithNameOfDay([DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt);
            const time = action.withTime && action.dueAt ? ` ${formatTime(action.dueAt)}` : "";
            return (
              <div key={action._id + i}>
                <div>
                  <b>{getName(action)}</b>
                </div>
                <div className="tw-px-8">
                  <div>
                    <strong>Date&nbsp;:</strong> {`${date}${time}`}
                  </div>
                  {Boolean(action.categories) && (
                    <div>
                      <strong>Catégories&nbsp;: </strong>
                      {action.categories?.join(", ")}
                    </div>
                  )}
                  {action.urgent ? <div>Action prioritaire</div> : null}
                  {action.description ? (
                    <div>
                      <strong>Description&nbsp;: </strong> {action.description}
                    </div>
                  ) : null}
                  {action.status ? (
                    <div>
                      <strong>Statut&nbsp;: </strong> {action.status}
                    </div>
                  ) : null}

                  <div>
                    <strong>Créée par&nbsp;: </strong>
                    <UserName id={action.user} />
                  </div>
                  {Boolean(action.group) && <div>Action familiale</div>}
                  <div>
                    <strong>Équipe(s)&nbsp;: </strong>
                    {Array.isArray(action?.teams) ? (
                      action.teams.map((e: string, i: number) => {
                        const team = teams.find((u) => u._id === e);
                        return (
                          <div className="tw-ml-5" key={team?.name + i}>
                            {team?.name}
                          </div>
                        );
                      })
                    ) : (
                      <span>{teams.find((u) => u._id === action.team)?.name}</span>
                    )}
                  </div>
                </div>
                <br />
              </div>
            );
          })}
      </div>

      {!["restricted-access"].includes(user!.role) && (
        <>
          <div className="tw-mx-0 tw-mb-5 tw-mt-16 tw-flex tw-items-center">
            <h2 className="tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Commentaires</h2>
          </div>
          <div className="tw-px-8">
            {Boolean(comments.length > 0) &&
              comments.map((comment, i) => (
                <div key={comment._id + i}>
                  {Boolean(comment.urgent) && <div>Commentaire prioritaire</div>}
                  <div>
                    <strong>Date&nbsp;:</strong> {formatDateTimeWithNameOfDay(comment.date || comment.createdAt)}
                  </div>
                  <div>
                    <strong>Écrit par&nbsp;:</strong> <UserName id={comment.user} />
                  </div>
                  {Boolean(comment.group) && <div>Commentaire familial</div>}
                  <div className="tw-pl-4">
                    {(comment.comment || "").split("\n").map((e: string, i: number) => (
                      <p key={e + i} className="tw-mb-0">
                        {e}
                      </p>
                    ))}
                  </div>
                  <br />
                </div>
              ))}
          </div>

          <div className="tw-mx-0 tw-mb-5 tw-mt-16 tw-flex tw-items-center">
            <h2 className="tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Passages</h2>
          </div>
          <div className="tw-px-8">
            {Boolean(personPassages.length > 0) &&
              personPassages.map((passage, i) => (
                <div key={passage._id + i}>
                  <div>
                    <b>{formatDateTimeWithNameOfDay(passage.date || passage.createdAt)}</b>
                  </div>
                  {passage.comment && (
                    <div className="tw-max-w-fit">
                      <strong>Commentaire&nbsp;: </strong>
                      {(passage.comment || "")
                        .split("\n")
                        .filter((e: string) => e)
                        .map((e: string, i: number) => (
                          <p key={e + i} className="tw-mb-0 tw-pl-4">
                            {e}
                          </p>
                        ))}
                    </div>
                  )}
                  <div>
                    <strong>Créé par&nbsp;: </strong>
                    <UserName id={passage.user} />
                  </div>
                  <div className="tw-max-w-fit">
                    <strong>Équipe&nbsp;: </strong>
                    <span>{teams.find((u) => u._id === passage.team)?.name}</span>
                  </div>
                  <br />
                </div>
              ))}
          </div>
          <div className="tw-mx-0 tw-mb-5 tw-mt-16 tw-flex tw-items-center">
            <h2 className="tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Rencontres</h2>
          </div>
          <div className="tw-px-8">
            {Boolean(personRencontres.length > 0) &&
              personRencontres.map((rencontre, i) => (
                <div key={rencontre._id + i}>
                  <div>
                    <b>{formatDateTimeWithNameOfDay(rencontre.date || rencontre.createdAt)}</b>
                  </div>
                  {rencontre.comment && (
                    <div className="tw-max-w-fit">
                      <strong>Commentaire&nbsp;: </strong>
                      {(rencontre.comment || "")
                        .split("\n")
                        .filter((e: string) => e)
                        .map((e: string, i: number) => (
                          <p key={e + i} className="tw-mb-0 tw-pl-4">
                            {e}
                          </p>
                        ))}
                    </div>
                  )}
                  <div>
                    <strong>Créée par&nbsp;: </strong>
                    <UserName id={rencontre.user} />
                  </div>
                  <div className="tw-max-w-fit">
                    <strong>Équipe&nbsp;: </strong>
                    <span>{teams.find((u) => u._id === rencontre.team)?.name}</span>
                  </div>
                  <br />
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
