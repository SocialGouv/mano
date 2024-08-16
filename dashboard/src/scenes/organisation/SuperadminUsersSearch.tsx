import { useCallback, useEffect, useState } from "react";
import API, { tryFetchExpectOk } from "../../services/api";
import { UserInstance } from "../../types/user";
import { TeamInstance } from "../../types/team";
import { OrganisationInstance } from "../../types/organisation";
import { formatDateWithFullMonth } from "../../services/date";
import { ModalContainer, ModalBody, ModalHeader, ModalFooter } from "../../components/tailwind/Modal";
import DeleteButtonAndConfirmModal from "../../components/DeleteButtonAndConfirmModal";
import { toast } from "react-toastify";
import { errorMessage } from "../../utils";
import Search from "../../components/search";

export default function SuperadminUsersSearch({
  open,
  setOpen,
  setSelectedOrganisation,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  setSelectedOrganisation: (organisation: OrganisationInstance) => void;
  setSearchUserModal: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingLinkForUser, setIsGeneratingLinkForUser] = useState<false | string>(false);
  const [generatedLink, setGeneratedLink] = useState<[string, string] | undefined>();

  const onClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    if (!search?.length || search.length < 3) {
      setUsers([]);
      return;
    }
    setIsLoading(true);
    tryFetchExpectOk(() => API.get({ path: `/user/search`, query: { search } })).then(([error, response]) => {
      if (error) {
        return toast.error(errorMessage(error));
      }
      setUsers(response.data);
      setIsLoading(false);
    });
  }, [open, search]);

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      size="full"
      onAfterLeave={() => {
        setIsLoading(false);
        setSearch("");
        setUsers([]);
      }}
    >
      <ModalHeader title={"Rechercher un utilisateur"} onClose={onClose} />
      <ModalBody>
        <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-justify-center">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-justify-center [&>div]:tw-max-w-96 tw-my-4">
            <Search placeholder={`Rechercher par nom ou email...`} value={search} onChange={setSearch} />
          </div>
          {users.length === 0 && (
            <div>
              <div className="tw-p-4 tw-text-center">
                Aucun résultat
                {search.length < 3 ? " (minimum 3 caractères)" : ""}
                {isLoading ? <span className="tw-animate-pulse"> (recherche en cours...)</span> : ""}
              </div>
              <img src="https://gifsec.com/wp-content/uploads/2022/09/waiting-gif-13-1.gif" className="tw-h-72 tw-w-96 tw-m-4 tw-object-cover" />
            </div>
          )}
          {users.length > 0 && (
            <div>
              <div className="tw-font-bold tw-p-4 tw-text-center">
                {users.length} utilisateur(rice){users.length > 1 ? "s" : ""} 🤩
              </div>
            </div>
          )}
          {users.length > 0 && (
            <table className="table table-striped table-bordered tw-text-sm">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Équipes</th>
                  <th>Organisation</th>
                  <th>Actions</th>
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
                                  const [error, response] = await tryFetchExpectOk(async () =>
                                    API.post({ path: `/user/generate-link`, body: { _id: user._id } })
                                  );
                                  if (error) return toast.error("Erreur lors de la génération du lien de connexion");
                                  setGeneratedLink([user._id, response.data.link]);
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

                    <td>
                      <button
                        onClick={() => {
                          setSelectedOrganisation(user.organisationPopulated);
                          setOpen(true);
                        }}
                        type="button"
                        className="hover:tw-underline focus:tw-underline tw-text-left"
                      >
                        {user.organisationPopulated?.name}
                      </button>
                    </td>
                    <td>
                      <div className="tw-grid tw-gap-1">
                        <DeleteButtonAndConfirmModal
                          title={`Voulez-vous vraiment supprimer l'utilisateur ${user.name}`}
                          textToConfirm={user.email}
                          onConfirm={async () => {
                            const [error] = await tryFetchExpectOk(async () => API.delete({ path: `/user/${user._id}` }));
                            if (error) return;
                            toast.success("Suppression réussie");
                            setUsers(users.filter((u) => u._id !== user._id));
                          }}
                        >
                          <span className="tw-mb-7 tw-block tw-w-full tw-text-center">Cette opération est irréversible</span>
                        </DeleteButtonAndConfirmModal>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <button className="button-cancel" onClick={onClose}>
          Fermer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
}
