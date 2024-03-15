import React, { useMemo } from "react";
import { useRecoilValue } from "recoil";
import { customFieldsPersonsSelector } from "../../../recoil/persons";
import { currentTeamAuthentifiedState, teamsState, userState, usersState } from "../../../recoil/auth";
import { dayjsInstance, formatDateTimeWithNameOfDay, formatDateWithNameOfDay, formatTime } from "../../../services/date";
import CustomFieldDisplay from "../../../components/CustomFieldDisplay";
import { CANCEL, DONE, getName } from "../../../recoil/actions";
import { PersonPopulated } from "../../../types/person";
import UserName from "../../../components/UserName";

export function SummaryPrint({ person }: { person: PersonPopulated }) {
  const user = useRecoilValue(userState);
  const users = useRecoilValue(usersState);
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
    <div className="printonly">
      <h1>Dossier social de {person?.name}</h1>
      <small>extrait le {formatDateTimeWithNameOfDay()}</small>
      <div className="tw-mx-0 tw-mb-5 tw-mt-8 tw-flex tw-items-center">
        <h2 className="tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Informations générales</h2>
      </div>
      <div>
        {person.alertness && <div>Personne très vulnérable, ou ayant besoin d'une attention particulière</div>}
        <div>
          Date de naissance&nbsp;: <CustomFieldDisplay type="date" value={person.birthdate} />
        </div>
        <div>
          Genre&nbsp;: <CustomFieldDisplay type="text" value={person.gender} />
        </div>
        <div>
          Suivi·e depuis le : <CustomFieldDisplay type="date" value={person.followedSince || person.createdAt} />
        </div>
        {person.wanderingAt ? (
          <div>
            En rue depuis le :<CustomFieldDisplay type="date" value={person.wanderingAt} />
          </div>
        ) : null}
        <div>
          Téléphone : <CustomFieldDisplay type="text" value={person.phone} />
        </div>
      </div>
      <hr className="tw-my-8" />
      {customFieldsPersons.map(({ name, fields }) => {
        const enabledFields = fields.filter((f) => f.enabled || f.enabledTeams?.includes(team._id));
        return (
          <React.Fragment key={name}>
            <div className="tw-mx-0 tw-mb-5 tw-mt-16 tw-flex tw-items-center">
              <h2 className="tw-flex tw-justify-between tw-text-xl tw-font-extrabold">{name}</h2>
            </div>
            <div>
              {enabledFields.map((field) => {
                return (
                  <div key={field.label}>
                    {field.label} : {person[field.name]}
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
      <div>
        {Boolean(actions.length > 0) &&
          actions.map((action) => {
            const date = formatDateWithNameOfDay([DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt);
            const time = action.withTime && action.dueAt ? ` ${formatTime(action.dueAt)}` : "";
            return (
              <div key={action._id}>
                <div>
                  <b>{getName(action)}</b>
                </div>
                <div>{`${date}${time}`}</div>
                {Boolean(action.categories) && (
                  <div>
                    Catégories :{" "}
                    {action.categories?.map((category: string) => (
                      <span key={category}>{category}</span>
                    ))}
                  </div>
                )}
                {action.urgent ? <div>Action prioritaire</div> : null}
                {action.description ? <div>Description : {action.description}</div> : null}
                {action.status ? <div>Statut : {action.status}</div> : null}

                <div>
                  <span>Créée par</span>
                  <UserName id={action.user} />
                </div>
                {Boolean(action.group) && <div>Action familiale</div>}
                <div>
                  Équipe(s) :{" "}
                  {Array.isArray(action?.teams) ? (
                    action.teams.map((e: string) => {
                      const team = teams.find((u) => u._id === e);
                      return (
                        <div className="tw-ml-5" key={team?.name}>
                          {team?.name}
                        </div>
                      );
                    })
                  ) : (
                    <span>{teams.find((u) => u._id === action.team)?.name}</span>
                  )}
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
          <div>
            {Boolean(comments.length > 0) &&
              comments.map((comment) => (
                <div key={comment._id}>
                  {Boolean(comment.urgent) && <div>Commentaire prioritaire</div>}
                  <div>Date : {formatDateTimeWithNameOfDay(comment.date || comment.createdAt)}</div>
                  {Boolean(comment.group) && <div>Commentaire familial</div>}
                  <div>
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
          <div>
            {Boolean(personPassages.length > 0) &&
              personPassages.map((passage: any) => (
                <div key={passage._id}>
                  <div>
                    <b>{formatDateTimeWithNameOfDay(passage.date || passage.createdAt)}</b>
                  </div>
                  <div>
                    {(passage.comment || "")
                      .split("\n")
                      .filter((e: string) => e)
                      .map((e: string, i: number) => (
                        <p key={e + i} className="tw-mb-0">
                          {e}
                        </p>
                      ))}
                  </div>
                  <div>Créée par {users.find((e) => e._id === passage.user)?.name}</div>
                  <div className="tw-max-w-fit">{teams.find((u) => u._id === passage.team)?.name}</div>
                  <br />
                </div>
              ))}
          </div>
          <div className="tw-mx-0 tw-mb-5 tw-mt-16 tw-flex tw-items-center">
            <h2 className="tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Rencontres</h2>
          </div>
          <div>
            {Boolean(personRencontres.length > 0) &&
              personRencontres.map((rencontre: any) => (
                <div key={rencontre._id}>
                  <div>
                    <b>{formatDateTimeWithNameOfDay(rencontre.date || rencontre.createdAt)}</b>
                  </div>
                  <div>
                    {(rencontre.comment || "")
                      .split("\n")
                      .filter((e: string) => e)
                      .map((e: string, i: number) => (
                        <p key={e + i} className="tw-mb-0">
                          {e}
                        </p>
                      ))}
                  </div>
                  <div>Créée par {users.find((e) => e._id === rencontre.user)?.name}</div>
                  <div className="tw-max-w-fit">{teams.find((u) => u._id === rencontre.team)?.name}</div>
                  <br />
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
