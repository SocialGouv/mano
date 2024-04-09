import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import API from "../../services/api";
import Table from "../../components/table";
import { useLocalStorage } from "../../services/useLocalStorage";
import { dayjsInstance, formatAge, formatDateWithFullMonth } from "../../services/date";
import { organisationState } from "../../recoil/auth";
import TagTeam from "../../components/TagTeam";
import { useDataLoader } from "../../components/DataLoader";

async function fetchPersons(organisationId) {
  const res = await API.get({ path: "/organisation/" + organisationId + "/deleted-data", query: {}, decryptDeleted: true });
  return res.decryptedData;
}

export default function Poubelle() {
  const { refresh } = useDataLoader();
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);
  const [persons, setPersons] = useState([]);
  const [data, setData] = useState(null);
  const [sortBy, setSortBy] = useLocalStorage("person-poubelle-sortBy", "name");
  const [sortOrder, setSortOrder] = useLocalStorage("person-poubelle-sortOrder", "ASC");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchPersons(organisation._id).then((data) => {
      setData(data);
      setPersons(data.persons);
    });
  }, [organisation._id, refreshKey]);

  const getAssociatedData = (id) => {
    const associatedData = {
      actions: data.actions.filter((c) => c.person === id).map((c) => c._id),
      comments: data.comments.filter((c) => c.person === id).map((c) => c._id),
      relsPersonPlaces: data.relsPersonPlace.filter((c) => c.person === id).map((c) => c._id),
      passages: data.passages.filter((c) => c.person === id).map((c) => c._id),
      rencontres: data.rencontres.filter((c) => c.person === id).map((c) => c._id),
      consultations: data.consultations.filter((c) => c.person === id).map((c) => c._id),
      treatments: data.treatments.filter((c) => c.person === id).map((c) => c._id),
      medicalFiles: data.medicalFiles.filter((c) => c.person === id).map((c) => c._id),
      groups: data.groups.filter((c) => c.persons.includes(id)).map((c) => c._id),
    };
    associatedData.comments = associatedData.comments.concat(
      data.comments.filter((c) => associatedData.actions.includes(c.action)).map((c) => c._id)
    );
    return associatedData;
  };

  const getAssociatedDataAsText = (associatedData) => {
    const associatedDataAsText = [
      associatedData.actions.length + " actions",
      associatedData.comments.length + " commentaires",
      associatedData.relsPersonPlaces.length + " lieux fréquentés",
      associatedData.passages.length + " passages",
      associatedData.rencontres.length + " rencontres",
      associatedData.consultations.length + " consultations",
      associatedData.treatments.length + " traitements",
      associatedData.medicalFiles.length + " dossiers médicaux",
      associatedData.groups.length + " groupes",
    ];
    return associatedDataAsText;
  };

  const restorePerson = async (id) => {
    const associatedData = getAssociatedData(id);
    const associatedDataAsText = getAssociatedDataAsText(associatedData);

    if (confirm("Voulez-vous restaurer cette personne ? Les données associées seront également restaurées :\n" + associatedDataAsText.join(", "))) {
      API.post({
        path: "/organisation/" + organisation._id + "/restore-deleted-data",
        body: { ...associatedData, persons: [id] },
      }).then((res) => {
        if (res.ok) {
          refresh().then(() => {
            toast.success("La personne a été restaurée avec succès, ainsi que ses données associées !");
            history.push(`/person/${id}`);
          });
        } else {
          toast.error("Impossible de restaurer la personne");
        }
      });
    }
  };

  const permanentDeletePerson = async (id) => {
    const associatedData = getAssociatedData(id);
    const associatedDataAsText = getAssociatedDataAsText(associatedData);

    if (
      confirm(
        "Voulez-vous supprimer DÉFINITIVEMENT cette personne ? L'équipe de Mano sera INCAPABLE DE RÉCUPÉRER LES DONNÉES. Les données associées seront également supprimées :\n" +
          associatedDataAsText.join(", ")
      )
    ) {
      API.delete({
        path: "/organisation/" + organisation._id + "/permanent-delete-data",
        body: { ...associatedData, persons: [id] },
      }).then((res) => {
        if (res.ok) {
          refresh().then(() => {
            toast.success("La personne a été supprimée définitivement avec succès, ainsi que ses données associées !");
            setRefreshKey(refreshKey + 1);
          });
        } else {
          toast.error("Impossible de supprimer définitivement la personne");
        }
      });
    }
  };

  return (
    <div>
      <div className="tw-mb-8 tw-border-l-4 tw-border-orange-500 tw-bg-orange-100 tw-p-4 tw-text-orange-700" role="alert">
        Vous retrouvez ici les dossiers des personnes supprimeés, uniquement accessibles par les comptes administrateurs. Vous devez les supprimer
        définitivement après une période de rétention de 6 mois, conformément à la réglementation RGPD. Vous pouvez également restaurer les dossiers
        supprimés par erreur.
      </div>
      <div className="mt-8">
        <Table
          data={persons}
          rowKey={"_id"}
          noData="Aucune personne supprimée"
          columns={[
            {
              title: "",
              dataKey: "group",
              small: true,
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortOrder,
              sortBy,
              render: (person) => {
                if (!person.group) return null;
                return (
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                    <span className="tw-text-3xl" aria-label="Personne avec des liens familiaux" title="Personne avec des liens familiaux">
                      👪
                    </span>
                  </div>
                );
              },
            },
            {
              title: "Nom",
              dataKey: "name",
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortOrder,
              sortBy,
              render: (p) => {
                if (p.outOfActiveList)
                  return (
                    <div className="tw-max-w-md tw-text-black50">
                      <p className="tw-mb-0 tw-items-center tw-gap-1 tw-font-bold [overflow-wrap:anywhere]">
                        {p.name}
                        {p.otherNames ? <small className="tw-inline tw-text-main"> - {p.otherNames}</small> : null}
                      </p>
                      <div>Sortie de file active&nbsp;: {p.outOfActiveListReasons?.join(", ")}</div>
                    </div>
                  );
                return (
                  <p className="tw-mb-0 tw-max-w-md tw-items-center tw-gap-1 tw-font-bold [overflow-wrap:anywhere]">
                    {p.name}
                    {p.otherNames ? <small className="tw-inline tw-text-main"> - {p.otherNames}</small> : null}
                  </p>
                );
              },
            },
            {
              title: "Équipe(s) en charge",
              dataKey: "assignedTeams",
              render: (person) => <Teams person={person} />,
            },
            {
              title: "Suivi(e) depuis le",
              dataKey: "followedSince",
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortOrder,
              sortBy,
              render: (p) => {
                return (
                  <>
                    {formatDateWithFullMonth(p.followedSince || p.createdAt || "")}
                    <div className="tw-text-gray-500 tw-text-xs">il y a {p.createdAt ? formatAge(p.createdAt) : "un certain temps"}</div>
                  </>
                );
              },
            },
            {
              title: "Suppression le",
              dataKey: "deletedAt",
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortOrder,
              sortBy,
              render: (p) => {
                return (
                  <>
                    <div
                      className={
                        dayjsInstance(p.deletedAt).isAfter(dayjsInstance().add(-6, "month")) ? "tw-font-bold" : "tw-font-bold tw-text-red-500"
                      }
                    >
                      {formatDateWithFullMonth(p.deletedAt)}
                    </div>
                    <div className="tw-text-gray-500 tw-text-xs">il y a {p.deletedAt ? formatAge(p.deletedAt) : "un certain temps"}</div>
                  </>
                );
              },
            },
            {
              title: "Restaurer",
              dataKey: "action-restore",
              render: (p) => {
                return (
                  <>
                    <button className="button-classic ml-0" onClick={() => restorePerson(p._id)}>
                      Restaurer
                    </button>
                  </>
                );
              },
            },
            {
              title: "Supprimer",
              dataKey: "action-delete",
              render: (p) => {
                return (
                  <>
                    <button onClick={() => permanentDeletePerson(p._id)} className="button-destructive ml-0">
                      Suppr.&nbsp;définitivement
                    </button>
                  </>
                );
              },
            },
          ].filter((c) => organisation.groupsEnabled || c.dataKey !== "group")}
        />
      </div>
    </div>
  );
}

const Teams = ({ person: { _id, assignedTeams } }) => (
  <div key={_id} className="tw-grid tw-gap-px">
    {assignedTeams?.map((teamId) => (
      <TagTeam key={teamId} teamId={teamId} />
    ))}
  </div>
);
