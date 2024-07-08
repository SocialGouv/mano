import { useEffect, useState } from "react";
import DocumentsOrganizer from "../../components/DocumentsOrganizer";
import { Folder } from "../../types/document";
import { FolderModal } from "../../components/DocumentsGeneric";
import { useRecoilValue } from "recoil";
import { organisationAuthentifiedState } from "../../recoil/auth";
import API, { tryFetchExpectOk } from "../../services/api";
import { capture } from "../../services/sentry";
import { toast } from "react-toastify";

function DefaultFolders({
  errorText,
  organisationProperty,
}: {
  errorText: string;
  organisationProperty: "defaultPersonsFolders" | "defaultMedicalFolders";
}) {
  const organisation = useRecoilValue(organisationAuthentifiedState);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  const [addFolder, setAddFolder] = useState(false);
  const [items, setItems] = useState<Array<Folder>>(organisation[organisationProperty] || []);
  useEffect(() => {
    // FIXME: trouver une meilleure méthode de comparaison
    if (JSON.stringify(organisation[organisationProperty]) !== JSON.stringify(items)) {
      tryFetchExpectOk(() => API.put({ path: `/organisation/${organisation._id}`, body: { [organisationProperty]: items } }))
        .then(([error]) => {
          if (error) {
            toast.error(errorText);
          }
        })
        .catch((error) => {
          toast.error(errorText);
          capture(error);
        });
    }
  }, [errorText, items, organisation, organisationProperty]);

  return (
    <>
      <div className="tw-mb-8">
        <div className="tw-border-l-4 tw-border-blue-500 tw-bg-blue-100 tw-p-4 tw-text-blue-700" role="alert">
          Vous pouvez ajouter des dossiers qui seront affichés dans les documents de chaque personne.
        </div>
      </div>
      <DocumentsOrganizer
        items={items}
        htmlId="social"
        rootFolderName="Dossier Racine"
        onSave={(items) => {
          setItems(items);
          return null;
        }}
        onFolderClick={(folder) => {
          setFolderToEdit(folder);
        }}
        color="main"
      />
      {addFolder || !!folderToEdit ? (
        <FolderModal
          key={`${addFolder}${folderToEdit?._id}`}
          folder={folderToEdit}
          onClose={() => {
            setFolderToEdit(null);
            setAddFolder(false);
          }}
          onDelete={() => {
            setItems(
              items
                .filter((item) => item._id !== folderToEdit?._id)
                .map((item) => {
                  if (item.parentId === folderToEdit._id) return { ...item, parentId: "" };
                  return item;
                })
            );
            return null;
          }}
          onSubmit={(folder) => {
            setFolderToEdit(null);
            setAddFolder(false);
            setItems(items.map((item) => (item._id === folder._id ? folder : item)));
            return null;
          }}
          onAddFolder={(folder) => {
            setItems([...items, folder]);
            return null;
          }}
          color="main"
        />
      ) : null}
      <button
        className="btn btn-primary"
        onClick={() => {
          setAddFolder(true);
        }}
      >
        Ajouter un dossier
      </button>
    </>
  );
}

export function DefaultFoldersPersons() {
  return (
    <DefaultFolders errorText="Erreur lors de la mise à jour des dossiers par défaut des personnes" organisationProperty="defaultPersonsFolders" />
  );
}

export function DefaultFoldersMedical() {
  return (
    <DefaultFolders
      errorText="Erreur lors de la mise à jour des dossiers par défaut des dossiers médicaux"
      organisationProperty="defaultMedicalFolders"
    />
  );
}
