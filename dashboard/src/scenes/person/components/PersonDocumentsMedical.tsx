import { useMemo } from "react";
import { toast } from "react-toastify";
import { useRecoilValue } from "recoil";
import { organisationAuthentifiedState, userAuthentifiedState } from "../../../recoil/auth";
import { prepareConsultationForEncryption, encryptConsultation } from "../../../recoil/consultations";
import { customFieldsMedicalFileSelector, prepareMedicalFileForEncryption, encryptMedicalFile } from "../../../recoil/medicalFiles";
import { encryptTreatment } from "../../../recoil/treatments";
import API, { tryFetchExpectOk } from "../../../services/api";
import { capture } from "../../../services/sentry";
import { DocumentsModule } from "../../../components/DocumentsGeneric";
import type { PersonPopulated } from "../../../types/person";
import type { DocumentWithLinkedItem, FolderWithLinkedItem, Document, Folder } from "../../../types/document";
import { useDataLoader } from "../../../components/DataLoader";
import { encryptItem } from "../../../services/encryption";

interface PersonDocumentsProps {
  person: PersonPopulated;
}

const PersonDocumentsMedical = ({ person }: PersonDocumentsProps) => {
  const user = useRecoilValue(userAuthentifiedState);
  const organisation = useRecoilValue(organisationAuthentifiedState);
  const { refresh } = useDataLoader();

  const consultations = useMemo(() => person.consultations ?? [], [person.consultations]);

  const treatments = useMemo(() => person.treatments ?? [], [person.treatments]);

  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const medicalFile = person.medicalFile;

  const defaultDocuments: Array<FolderWithLinkedItem> = organisation.defaultMedicalFolders.map((folder) => ({
    ...folder,
    linkedItem: {
      _id: person._id,
      type: "person",
    },
  }));

  const allMedicalDocuments = useMemo(() => {
    if (!medicalFile) return [];
    const treatmentsDocs: Array<DocumentWithLinkedItem | FolderWithLinkedItem> = [
      {
        _id: "treatment",
        name: "Traitements",
        position: 1,
        parentId: "root",
        type: "folder",
        linkedItem: {
          _id: medicalFile._id,
          type: "medical-file",
        },
        movable: false,
        createdAt: new Date(),
        createdBy: "we do not care",
      },
    ];
    for (const treatment of treatments) {
      for (const document of treatment.documents || []) {
        const docWithLinkedItem = {
          ...document,
          type: document.type ?? "document", // it will always be a document in treatments - folders are only saved in medicalFile
          linkedItem: {
            _id: treatment._id,
            type: "treatment",
          },
          parentId: document.parentId ?? "treatment",
        } as DocumentWithLinkedItem;
        treatmentsDocs.push(docWithLinkedItem);
      }
    }

    const consultationsDocs: Array<DocumentWithLinkedItem | FolderWithLinkedItem> = [
      {
        _id: "consultation",
        name: "Consultations",
        position: 0,
        parentId: "root",
        type: "folder",
        linkedItem: {
          _id: medicalFile._id,
          type: "medical-file",
        },
        movable: false,
        createdAt: new Date(),
        createdBy: "we do not care",
      },
    ];
    for (const consultation of consultations) {
      if (consultation?.onlyVisibleBy?.length) {
        if (!consultation.onlyVisibleBy.includes(user._id)) continue;
      }
      for (const document of consultation.documents || []) {
        const docWithLinkedItem = {
          ...document,
          type: document.type ?? "document", // it will always be a document in treatments - folders are only saved in medicalFile
          linkedItem: {
            _id: consultation._id,
            type: "consultation",
          },
          parentId: document.parentId ?? "consultation",
        } as DocumentWithLinkedItem;
        consultationsDocs.push(docWithLinkedItem);
      }
    }

    const otherDocs: Array<DocumentWithLinkedItem | FolderWithLinkedItem> = [];

    for (const document of medicalFile?.documents || []) {
      const docWithLinkedItem = {
        ...document,
        type: document.type ?? "document", // or 'folder'
        linkedItem: {
          _id: medicalFile._id,
          type: "medical-file",
        },
        parentId: document.parentId ?? "root",
      } as DocumentWithLinkedItem;
      otherDocs.push(docWithLinkedItem);
    }

    return [...treatmentsDocs, ...consultationsDocs, ...otherDocs, ...(otherDocs?.length > 0 ? [] : defaultDocuments)].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [consultations, defaultDocuments, medicalFile, treatments, user._id]);

  return (
    <DocumentsModule
      showPanel
      socialOrMedical="medical"
      documents={allMedicalDocuments}
      color="blue-900"
      title={`Documents médicaux de ${person.name} (${allMedicalDocuments.length})`}
      personId={person._id}
      onDeleteDocument={async (documentOrFolder) => {
        // FIXME Il semblerait que ce soit toujours un document et non un documentOrFolder.
        // Il y a une fonction onDeleteFolder qui est utilisée dans PersonDocuments.tsx
        if (documentOrFolder.type === "document") {
          const document = documentOrFolder as DocumentWithLinkedItem;
          const [error] = await tryFetchExpectOk(async () =>
            API.delete({ path: document.downloadPath ?? `/person/${person._id}/document/${document.file.filename}` })
          );
          if (error) {
            toast.error("Erreur lors de la suppression du document, vous pouvez contactez le support");
            return false;
          }
        }
        if (documentOrFolder.linkedItem.type === "treatment") {
          const treatment = treatments.find((t) => t._id === documentOrFolder.linkedItem._id);
          if (!treatment) return false;
          const [error] = await tryFetchExpectOk(
            async () =>
              await API.put({
                path: `/treatment/${treatment._id}`,
                body: await encryptTreatment({
                  ...treatment,
                  documents: treatment.documents.filter((d) => d._id !== documentOrFolder._id),
                }),
              })
          );
          if (!error) {
            await refresh();
            toast.success("Document supprimé");
            return true;
          } else {
            toast.error("Erreur lors de la suppression du document, vous pouvez contactez le support");
          }
        }
        if (documentOrFolder.linkedItem.type === "consultation") {
          const consultation = consultations.find((c) => c._id === documentOrFolder.linkedItem._id);
          if (!consultation) return false;
          const [error] = await tryFetchExpectOk(async () =>
            API.put({
              path: `/consultation/${consultation._id}`,
              body: await encryptConsultation(organisation.consultations)({
                ...consultation,
                documents: consultation.documents.filter((d) => d._id !== documentOrFolder._id),
              }),
            })
          );
          if (!error) {
            await refresh();
            toast.success("Document supprimé");
            return true;
          } else {
            toast.error("Erreur lors de la suppression du document, vous pouvez contactez le support");
          }
        }
        if (documentOrFolder.linkedItem.type === "medical-file") {
          if (!medicalFile?._id) return false;
          const [error] = await tryFetchExpectOk(async () =>
            API.put({
              path: `/medical-file/${medicalFile._id}`,
              body: await encryptMedicalFile(customFieldsMedicalFile)({
                ...medicalFile,
                // If there are no document yet and default documents are present,
                // we save the default documents since they are modified by the user.
                documents: (medicalFile.documents?.length ? medicalFile.documents : [...defaultDocuments]).filter(
                  (d) => d._id !== documentOrFolder._id
                ),
              }),
            })
          );
          if (!error) {
            await refresh();
            toast.success("Document supprimé");
            return true;
          } else {
            toast.error("Erreur lors de la suppression du document, vous pouvez contactez le support");
          }
        }
        return false;
      }}
      onSubmitDocument={async (documentOrFolder) => {
        if (documentOrFolder.linkedItem.type === "treatment") {
          const treatment = treatments.find((t) => t._id === documentOrFolder.linkedItem._id);
          if (!treatment) return;
          const [error] = await tryFetchExpectOk(async () =>
            API.put({
              path: `/treatment/${treatment._id}`,
              body: await encryptTreatment({
                ...treatment,
                documents: treatment.documents.map((d) => {
                  if (d._id === documentOrFolder._id) {
                    // remove linkedItem from document
                    const { linkedItem, ...rest } = documentOrFolder;
                    const document = rest as Document | Folder;
                    return document;
                  }
                  return d;
                }),
              }),
            })
          );
          if (!error) {
            await refresh();
            toast.success("Document mis à jour");
          } else {
            toast.error("Erreur lors de la mise à jour du document, vous pouvez contactez le support");
          }
        }
        if (documentOrFolder.linkedItem.type === "consultation") {
          const consultation = consultations.find((c) => c._id === documentOrFolder.linkedItem._id);
          if (!consultation) return;
          const [error] = await tryFetchExpectOk(
            async () =>
              await API.put({
                path: `/consultation/${consultation._id}`,
                body: await encryptConsultation(organisation.consultations)({
                  ...consultation,
                  documents: consultation.documents.map((d) => {
                    if (d._id === documentOrFolder._id) {
                      // remove linkedItem from document
                      const { linkedItem, ...rest } = documentOrFolder;
                      const document = rest as Document | Folder;
                      return document;
                    }
                    return d;
                  }),
                }),
              })
          );
          if (!error) {
            await refresh();
            toast.success("Document mis à jour");
          } else {
            toast.error("Erreur lors de la mise à jour du document, vous pouvez contactez le support");
          }
        }
        if (documentOrFolder.linkedItem.type === "medical-file") {
          if (!medicalFile?._id) return;
          const [error] = await tryFetchExpectOk(
            async () =>
              await API.put({
                path: `/medical-file/${medicalFile._id}`,
                body: await encryptMedicalFile(customFieldsMedicalFile)({
                  ...medicalFile,
                  // If there are no document yet and default documents are present,
                  // we save the default documents since they are modified by the user.
                  documents: (medicalFile.documents?.length ? medicalFile.documents : [...defaultDocuments]).map((d) => {
                    if (d._id === documentOrFolder._id) {
                      // remove linkedItem from document
                      const { linkedItem, ...rest } = documentOrFolder;
                      const document = rest as Document | Folder;
                      return document;
                    }
                    return d;
                  }),
                }),
              })
          );
          if (!error) {
            await refresh();
            toast.success("Document mis à jour");
          } else {
            toast.error("Erreur lors de la mise à jour du document, vous pouvez contactez le support");
          }
        }
      }}
      onSaveNewOrder={async (nextDocuments) => {
        try {
          const groupedById = {
            treatment: {},
            consultation: {},
            "medical-file": {},
          };
          for (const document of nextDocuments) {
            if (document._id === "treatment") continue; // it's the non movable Treatments folder
            if (document._id === "consultation") continue; // it's the non movable Consultations folder
            if (!groupedById[document.linkedItem.type][document.linkedItem._id]) groupedById[document.linkedItem.type][document.linkedItem._id] = [];
            groupedById[document.linkedItem.type][document.linkedItem._id].push(document);
          }
          const treatmentsToUpdate = await Promise.all(
            Object.keys(groupedById.treatment).map((treatmentId) => {
              const treatment = treatments.find((t) => t._id === treatmentId);
              if (!treatment) throw new Error("Treatment not found");
              return encryptTreatment({
                ...treatment,
                documents: groupedById.treatment[treatmentId],
              });
            })
          );

          const consultationsToUpdate = await Promise.all(
            Object.keys(groupedById.consultation)
              .map((consultationId) => {
                const consultation = consultations.find((c) => c._id === consultationId);
                if (!consultation) throw new Error("Consultation not found");
                const nextConsultation = prepareConsultationForEncryption(organisation.consultations)({
                  ...consultation,
                  documents: groupedById.consultation[consultationId],
                });
                return nextConsultation;
              })
              .map(encryptItem)
          );
          if (!medicalFile?._id) throw new Error("Medical file not found");
          const encryptedMedicalFile = await encryptItem(
            prepareMedicalFileForEncryption(customFieldsMedicalFile)({
              ...medicalFile,
              documents: groupedById["medical-file"][medicalFile._id],
            })
          );
          const [error] = await tryFetchExpectOk(
            async () =>
              await API.put({
                path: "/medical-file/documents-reorder",
                body: {
                  treatments: treatmentsToUpdate,
                  consultations: consultationsToUpdate,
                  medicalFile: encryptedMedicalFile,
                },
              })
          );
          if (!error) {
            toast.success("Documents mis à jour");
            await refresh();
            return true;
          } else {
            toast.error("Erreur lors de la mise à jour des documents, vous pouvez contactez le support");
          }
          return false;
        } catch (e) {
          toast.error("Erreur lors de la mise à jour des documents, vous pouvez contactez le support");
          capture(e, { message: "Error while updating documents order" });
        }
        return false;
      }}
      onAddDocuments={async (nextDocuments) => {
        if (!medicalFile?._id) return;
        const [error] = await tryFetchExpectOk(
          async () =>
            await API.put({
              path: `/medical-file/${medicalFile._id}`,
              body: await encryptMedicalFile(customFieldsMedicalFile)({
                ...medicalFile,
                // If there are no document yet and default documents are present,
                // we save the default documents since they are modified by the user.
                documents: [...(medicalFile.documents?.length ? medicalFile.documents : [...defaultDocuments]), ...nextDocuments],
              }),
            })
        );
        if (!error) {
          if (nextDocuments.filter((d) => d.type === "document").length > 1) toast.success("Documents enregistrés !");
          if (nextDocuments.filter((d) => d.type === "folder").length > 0) toast.success("Dossier créé !");
          await refresh();
        }
      }}
    />
  );
};

export default PersonDocumentsMedical;
