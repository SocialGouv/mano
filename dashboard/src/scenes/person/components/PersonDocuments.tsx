import { useMemo } from "react";
import { toast } from "react-toastify";
import { useRecoilValue } from "recoil";
import type { RecoilValueReadOnly } from "recoil";
import { organisationAuthentifiedState } from "../../../recoil/auth";
import { usePreparePersonForEncryption } from "../../../recoil/persons";
import API, { tryFetchExpectOk } from "../../../services/api";
import { capture } from "../../../services/sentry";
import { DocumentsModule } from "../../../components/DocumentsGeneric";
import { groupsState } from "../../../recoil/groups";
import type { PersonPopulated, PersonInstance } from "../../../types/person";
import type { Document, FolderWithLinkedItem } from "../../../types/document";
import type { UUIDV4 } from "../../../types/uuid";
import { personsObjectSelector } from "../../../recoil/selectors";
import { encryptAction } from "../../../recoil/actions";
import { useDataLoader } from "../../../components/DataLoader";

interface PersonDocumentsProps {
  person: PersonPopulated;
}

type PersonIndex = Record<UUIDV4, PersonInstance>;

const PersonDocuments = ({ person }: PersonDocumentsProps) => {
  const { refresh } = useDataLoader();
  const organisation = useRecoilValue(organisationAuthentifiedState);
  const groups = useRecoilValue(groupsState);
  const { encryptPerson } = usePreparePersonForEncryption();
  const persons = useRecoilValue<PersonIndex>(personsObjectSelector as RecoilValueReadOnly<PersonIndex>);

  const needsActionsFolder =
    !person.documentsForModule?.some((d) => d._id === "actions") && person.documentsForModule?.some((d) => d.linkedItem.type === "action");

  const actionsFolder: FolderWithLinkedItem = {
    _id: "actions",
    name: "Actions",
    position: -1,
    parentId: "root",
    type: "folder",
    linkedItem: {
      _id: person._id,
      type: "person",
    },
    movable: false,
    createdAt: new Date(),
    createdBy: "admin",
  };

  let defaultDocuments: Array<FolderWithLinkedItem> = [];
  if ((person.documentsForModule || []).length === 0 && (person.groupDocuments || []).length === 0) {
    defaultDocuments = organisation.defaultPersonsFolders.map((folder) => ({
      ...folder,
      linkedItem: {
        _id: person._id,
        type: "person",
      },
    }));
  }

  const documents = [
    // Le dossier "Actions" est ajouté si nécessaire, il s'affichera toujours en premier
    needsActionsFolder ? actionsFolder : undefined,
    // Les documents et dossiers de la personne
    ...(person.documentsForModule || []),
    // Les documents et dossier du groupe (famille)
    ...(person.groupDocuments || []),
    // Les dossiers par défaut configurés par l'organisation
    ...defaultDocuments,
  ]
    .filter((e) => e)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const canToggleGroupCheck = useMemo(() => {
    if (!organisation.groupsEnabled) return false;
    const group = groups.find((group) => group.persons.includes(person._id));
    if (!group) return false;
    return true;
  }, [groups, person._id, organisation.groupsEnabled]);

  return (
    <DocumentsModule
      showPanel
      socialOrMedical="social"
      documents={documents}
      onSaveNewOrder={async (nextDocuments) => {
        // Mise à jour des documents de la personne
        const personNextDocuments = nextDocuments.filter((d) => d.linkedItem.type === "person" && d._id !== "actions");

        const [personError] = await tryFetchExpectOk(async () => {
          return API.put({
            path: `/person/${person._id}`,
            body: await encryptPerson({
              ...person,
              documents: [
                ...personNextDocuments,
                ...(person.documents || []).filter((docOrFolder) => {
                  const document = docOrFolder as unknown as Document;
                  return !!document.group;
                }),
              ],
            }),
          });
        });
        if (personError) {
          toast.error("Erreur lors de l'enregistrement des documents, vous pouvez contactez le support");
          return false;
        }

        // Mis à jour des documents des actions
        const actionNextDocuments = nextDocuments.filter((d) => d.linkedItem.type === "action");
        const actionIds = actionNextDocuments.map((d) => d.linkedItem._id);
        for (const actionId of actionIds) {
          const action = person.actions.find((a) => a._id === actionId);
          if (!action) {
            toast.error("Erreur lors de l'enregistrement des documents des actions, vous pouvez contactez le support");
            capture("Error while ordering documents (action not found)", { extra: { actionId } });
            return false;
          }
          // FIXME: pour l'instant on vérifie si les deux documents sont identiques avec JSON.stringify. Il faudrait trouver une meilleure solution.
          if (JSON.stringify(action.documents) === JSON.stringify(actionNextDocuments.filter((d) => d.linkedItem._id === actionId))) {
            continue;
          }
          const [actionError] = await tryFetchExpectOk(async () => {
            return API.put({
              path: `/action/${actionId}`,
              body: await encryptPerson({
                ...action,
                documents: actionNextDocuments.filter((d) => d.linkedItem._id === actionId),
              }),
            });
          });
          if (actionError) {
            toast.error("Erreur lors de l'enregistrement des documents des actions, vous pouvez contactez le support");
          }
        }

        toast.success("Documents mis à jour");
        refresh();
        return true;
      }}
      personId={person._id}
      title={`Documents de ${person.name}`}
      canToggleGroupCheck={canToggleGroupCheck}
      onDeleteFolder={async (folder) => {
        // D'après le commentaire plus bas, on charge la personne liée au cas où c'est un dossier de groupe.
        // On a un edge case ici: si on a ajouté des documents pour quelqu'un d'autre, on les laisse dedans
        // et donc on les perds. Il faudrait probablement vérifier pour toutes les personnes du groupe.
        const _person = persons[folder.linkedItem._id];
        const [personError] = await tryFetchExpectOk(async () => {
          return API.put({
            path: `/person/${_person._id}`,
            body: await encryptPerson({
              ..._person,
              // If there are no document yet and default documents are present,
              // we save the default documents since they are modified by the user.
              documents: (_person.documents || [...defaultDocuments])
                .filter((f) => f._id !== folder._id)
                .map((item) => {
                  if (item.parentId === folder._id) return { ...item, parentId: "" };
                  return item;
                }),
            }),
          });
        });
        if (personError) {
          toast.error("Erreur lors de la suppression du dossier, vous pouvez contactez le support");
          return false;
        }

        // Comme on peut déplacer des documents d'actions hors du dossier par défaut (grr),
        // il faut les remettre au bon endroit quand le dossier est supprimé.
        const actionDocumentsToUpdate = documents.filter((d) => d.linkedItem.type === "action" && d.parentId === folder._id);
        for (const actionDocument of actionDocumentsToUpdate) {
          const action = person.actions.find((a) => a._id === actionDocument.linkedItem._id);
          if (!action) {
            toast.error("Erreur lors de la suppression du dossier pour les actions liées, vous pouvez contactez le support");
            capture("Error while deleting folder (action not found)", { extra: { actionDocument } });
            return false;
          }
          const [actionError] = await tryFetchExpectOk(async () => {
            return API.put({
              path: `/action/${action._id}`,
              body: await encryptAction({
                ...action,
                documents: action.documents.map((d) => {
                  if (d._id === actionDocument._id) return { ...d, parentId: "actions" }; // On remet dans le dossier "actions" par défaut
                  return d;
                }),
              }),
            });
          });
          if (actionError) {
            toast.error("Erreur lors de la suppression du dossier pour les actions liées, vous pouvez contactez le support");
            return false;
          }
        }
        toast.success("Dossier supprimé");
        refresh();
        return true;
      }}
      onDeleteDocument={async (document) => {
        // the document can be a group document, or a person document
        // so we need to get the person to update
        const _person = persons[document.linkedItem._id];
        const [documentError] = await tryFetchExpectOk(async () => {
          return API.delete({ path: document.downloadPath ?? `/person/${_person._id}/document/${document.file.filename}` });
        });
        if (documentError) {
          toast.error("Erreur lors de la suppression du document, vous pouvez contactez le support");
          return false;
        }

        if (document.linkedItem.type === "action") {
          const action = person.actions.find((a) => a._id === document.linkedItem._id);
          if (!action) {
            toast.error("Erreur lors de la suppression du document pour les actions liées, vous pouvez contactez le support");
            capture("Error while deleting document (action not found)", { extra: { document } });
            return false;
          }
          const [actionError] = await tryFetchExpectOk(async () => {
            return API.put({
              path: `/action/${action._id}`,
              body: await encryptAction({
                ...action,
                documents: action.documents.filter((d) => d._id !== document._id),
              }),
            });
          });
          if (actionError) {
            toast.error("Erreur lors de la suppression du document pour les actions liées, vous pouvez contactez le support");
            return false;
          }
        } else {
          const [personError] = await tryFetchExpectOk(async () => {
            return API.put({
              path: `/person/${_person._id}`,
              body: await encryptPerson({
                ..._person,
                // If there are no document yet and default documents are present,
                // we save the default documents since they are modified by the user.
                documents: (_person.documents || [...defaultDocuments])?.filter((d) => d._id !== document._id),
              }),
            });
          });
          if (personError) {
            toast.error("Erreur lors de la suppression du document, vous pouvez contactez le support");
            return false;
          }
        }

        toast.success("Document supprimé");
        refresh();
        return true;
      }}
      onSubmitDocument={async (documentOrFolder) => {
        if (documentOrFolder.linkedItem.type === "action") {
          const action = person.actions.find((a) => a._id === documentOrFolder.linkedItem._id);
          if (!action) {
            toast.error("Erreur lors de la mise à jour du document pour les actions liées, vous pouvez contactez le support");
            capture("Error while updating document (action not found)", { extra: { documentOrFolder } });
            return;
          }
          const [actionError] = await tryFetchExpectOk(async () => {
            return API.put({
              path: `/action/${action._id}`,
              body: await encryptAction({
                ...action,
                documents: action.documents.map((d) => {
                  if (d._id === documentOrFolder._id) return documentOrFolder;
                  return d;
                }),
              }),
            });
          });
          if (actionError) {
            toast.error("Erreur lors de la mise à jour du document pour les actions liées, vous pouvez contactez le support");
            return;
          }
        } else {
          // the document can be a group document, or a person document, or a folder
          // so we need to get the person to update
          const _person = persons[documentOrFolder.linkedItem._id];
          const [personError] = await tryFetchExpectOk(async () => {
            return API.put({
              path: `/person/${_person._id}`,
              body: await encryptPerson({
                ..._person,
                // If there are no document yet and default documents are present,
                // we save the default documents since they are modified by the user.
                documents: (_person.documents || [...defaultDocuments])?.map((d) => {
                  if (d._id === documentOrFolder._id) return documentOrFolder;
                  return d;
                }),
              }),
            });
          });
          if (personError) {
            toast.error("Erreur lors de la mise à jour du document, vous pouvez contactez le support");
            return;
          }
        }
        toast.success(documentOrFolder.type === "document" ? "Document mis à jour" : "Dossier mis à jour");
        refresh();
      }}
      onAddDocuments={async (newDocuments) => {
        const [personError] = await tryFetchExpectOk(async () => {
          return API.put({
            path: `/person/${person._id}`,
            body: await encryptPerson({
              ...person,
              // If there are no document yet and default documents are present,
              // we save the default documents since they are modified by the user.
              documents: [...(person.documents || [...defaultDocuments]), ...newDocuments],
            }),
          });
        });
        if (personError) {
          toast.error("Erreur lors de la création du document, vous pouvez contactez le support");
          return;
        }
        if (newDocuments.filter((d) => d.type === "document").length > 1) toast.success("Documents enregistrés !");
        if (newDocuments.filter((d) => d.type === "folder").length > 0) toast.success("Dossier créé !");
        refresh();
      }}
    />
  );
};

export default PersonDocuments;
