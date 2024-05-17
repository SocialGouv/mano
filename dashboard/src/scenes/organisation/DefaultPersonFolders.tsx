import { useEffect, useState } from "react";
import DocumentsOrganizer from "../../components/DocumentsOrganizer";
import { Folder } from "../../types/document";
import { FolderModal } from "../../components/DocumentsGeneric";
import { useRecoilValue } from "recoil";
import { organisationAuthentifiedState } from "../../recoil/auth";
import API from "../../services/api";
import { capture } from "../../services/sentry";
import { toast } from "react-toastify";

export default function DefaultPersonFolders() {
  const organisation = useRecoilValue(organisationAuthentifiedState);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  const [addFolder, setAddFolder] = useState(false);
  const [items, setItems] = useState<Array<Folder>>(organisation.defaultPersonsFolders || []);
  useEffect(() => {
    // FIXME: trouver une meilleure méthode de comparaison
    if (JSON.stringify(organisation.defaultPersonsFolders) !== JSON.stringify(items)) {
      API.put({ path: `/organisation/${organisation._id}`, body: { defaultPersonsFolders: items } })
        .then((res) => {
          if (!res.ok) {
            toast.error("Erreur lors de la mise à jour des dossiers par défaut des personnes");
          }
        })
        .catch((error) => {
          toast.error("Erreur lors de la mise à jour des dossiers par défaut des personnes");
          capture(error);
        });
    }
  }, [items, organisation]);
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
