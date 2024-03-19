import { useEffect, useState } from "react";
import API from "../../services/api";
import { useHistory, useParams } from "react-router-dom";
import { UserInstance } from "../../types/user";
import { TeamInstance } from "../../types/team";
import { formatDateWithFullMonth } from "../../services/date";

export default function OrganisationUsers() {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [users, setUsers] = useState([]);
  const [isGeneratingLinkForUser, setIsGeneratingLinkForUser] = useState<false | string>(false);
  const [generatedLink, setGeneratedLink] = useState<[string, string] | undefined>();

  useEffect(() => {
    (async () => {
      const { data } = await API.get({ path: `/user`, query: { organisation: id } });
      setUsers(data);
    })();
  }, [id]);

  return (
    <div>
      <div className="tw-mb-6 tw-flex tw-items-center">
        <h1 className="tw-mt-2 tw-grow tw-text-xl">Utilisateurs de l’organisation</h1>
        <button
          className="button-cancel"
          onClick={() => {
            history.push(`/organisation`);
          }}
        >
          Retour
        </button>
      </div>
      <table className="table table-striped table-bordered tw-text-sm">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Équipes</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: UserInstance & { teams: TeamInstance[] }) => (
            <tr key={user._id}>
              <td>
                {user.name || "Pas de nom renseigné"}
                <div className="tw-mt-1 tw-text-xs tw-text-gray-500">
                  Créé·e le {formatDateWithFullMonth(user.createdAt)} -{" "}
                  {user.lastLoginAt ? `Dernière connexion le ${formatDateWithFullMonth(user.lastLoginAt)}` : "Jamais connecté·e"}
                </div>
                <div className="tw-mt-1 tw-text-xs">
                  {isGeneratingLinkForUser === user._id ? (
                    <div className="tw-flex tw-animate-pulse tw-items-center tw-text-orange-700">Génération du lien de connexion en cours…</div>
                  ) : (
                    <>
                      {generatedLink && generatedLink[0] === user._id && (
                        <div className="tw-flex tw-cursor-default tw-items-center tw-text-green-700">✅ {generatedLink[1]}</div>
                      )}
                      <button
                        className="tw-cursor-pointer tw-text-main hover:tw-underline focus:tw-underline"
                        onClick={() => {
                          setIsGeneratingLinkForUser(user._id);
                          setGeneratedLink(undefined);
                          (async () => {
                            const { data } = await API.post({ path: `/user/generate-link`, body: { _id: user._id } });
                            setGeneratedLink([user._id, data.link]);
                            setIsGeneratingLinkForUser(false);
                          })();
                        }}
                      >
                        {generatedLink && generatedLink[0] === user._id ? "🔄 Régénérer" : "Générer un lien de connexion"}
                      </button>
                    </>
                  )}
                </div>
              </td>
              <td>
                {user.email}
                {user.phone ? <div>{user.phone}</div> : ""}
              </td>
              <td>
                <div>{user.role}</div>
                {user.healthcareProfessional ? <div>🧑‍⚕️ professionnel·le de santé</div> : ""}
              </td>
              <td>
                <div className="tw-grid tw-gap-1">
                  {user.teams.map((team: TeamInstance) => (
                    <div
                      key={team?._id}
                      style={{
                        backgroundColor: "#255c99cc",
                        borderColor: "#255c99",
                      }}
                      className="tw-inline-flex tw-justify-center tw-gap-4 tw-rounded tw-border tw-px-2.5 tw-py-0.5 tw-text-center tw-text-xs tw-text-white"
                    >
                      {team.nightSession && <span>🌒</span>}
                      {team.name}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
