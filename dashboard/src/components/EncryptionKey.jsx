import React, { useEffect, useRef, useState } from "react";
import { Formik } from "formik";
import { toast } from "react-toastify";
import { useRecoilState, useRecoilValue } from "recoil";
import { useHistory } from "react-router-dom";

import { organisationState, teamsState, userState } from "../recoil/auth";
import { encryptVerificationKey } from "../services/encryption";
import { capture } from "../services/sentry";
import API, { setOrgEncryptionKey, getHashedOrgEncryptionKey, decryptAndEncryptItem } from "../services/api";
import { useDataLoader } from "./DataLoader";
import { ModalContainer, ModalBody, ModalHeader } from "./tailwind/Modal";

const EncryptionKey = ({ isMain }) => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const teams = useRecoilValue(teamsState);
  const user = useRecoilValue(userState);
  const totalDurationOnServer = useRef(1);
  const previousKey = useRef(null);

  const onboardingForEncryption = isMain && !organisation.encryptionEnabled;
  const onboardingForTeams = !teams.length;

  const history = useHistory();

  const [open, setOpen] = useState(onboardingForEncryption);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [encryptingStatus, setEncryptingStatus] = useState("");
  const [encryptingProgress, setEncryptingProgress] = useState(0);
  const [encryptionDone, setEncryptionDone] = useState(false);
  const { isLoading, refresh } = useDataLoader();

  useEffect(() => {
    if (open) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, encryptionKey]);

  if (!["admin"].includes(user.role)) return null;

  const onEncrypt = async (values) => {
    try {
      // just for the button to show loading state, sorry Raph I couldn't find anything better
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (!values.encryptionKey) return toast.error("La clé est obligatoire");
      if (!values.encryptionKeyConfirm) return toast.error("La validation de la clé est obligatoire");
      if (!import.meta.env.VITE_TEST_PLAYWRIGHT) {
        if (values.encryptionKey.length < 8) return toast.error("La clé doit faire au moins 8 caractères");
      }
      if (values.encryptionKey !== values.encryptionKeyConfirm) return toast.error("Les clés ne sont pas identiques");
      previousKey.current = getHashedOrgEncryptionKey();
      setEncryptionKey(values.encryptionKey.trim());
      const hashedOrgEncryptionKey = await setOrgEncryptionKey(values.encryptionKey.trim());
      setEncryptingStatus("Chiffrement des données...");
      const encryptedVerificationKey = await encryptVerificationKey(hashedOrgEncryptionKey);
      const lockedForEncryptionResponse = await API.put({
        path: `/organisation/${organisation._id}`,
        body: {
          lockedForEncryption: true,
        },
      });
      if (!lockedForEncryptionResponse?.ok) {
        return toast.error("Désolé une erreur est survenue, veuillez réessayer ou contacter l'équipe de support");
      }

      // eslint-disable-next-line no-inner-declarations
      async function recrypt(path, callback = null) {
        setEncryptingStatus(`Chiffrement des données : (${path.replace("/", "")}s)`);
        const cryptedItems = await API.get({
          skipDecrypt: true,
          path,
          query: {
            organisation: organisation._id,
            limit: String(Number.MAX_SAFE_INTEGER),
            page: String(0),
            after: String(0),
            withDeleted: true,
          },
        });
        const encryptedItems = [];
        for (const item of cryptedItems.data) {
          try {
            const recrypted = await decryptAndEncryptItem(item, previousKey.current, hashedOrgEncryptionKey, callback);
            if (recrypted) encryptedItems.push(recrypted);
          } catch (e) {
            capture(e);
            throw new Error(
              `Impossible de déchiffrer et rechiffrer l'élément suivant: ${path} ${item._id}. Notez le numéro affiché et fournissez le à l'équipe de support.`
            );
          }
        }
        return encryptedItems;
      }

      const encryptedPersons = await recrypt("/person", async (decryptedData, item) =>
        recryptPersonRelatedDocuments(decryptedData, item._id, previousKey.current, hashedOrgEncryptionKey)
      );
      const encryptedConsultations = await recrypt("/consultation", async (decryptedData) =>
        recryptPersonRelatedDocuments(decryptedData, decryptedData.person, previousKey.current, hashedOrgEncryptionKey)
      );
      const encryptedTreatments = await recrypt("/treatment", async (decryptedData) =>
        recryptPersonRelatedDocuments(decryptedData, decryptedData.person, previousKey.current, hashedOrgEncryptionKey)
      );
      const encryptedMedicalFiles = await recrypt("/medical-file", async (decryptedData) =>
        recryptPersonRelatedDocuments(decryptedData, decryptedData.person, previousKey.current, hashedOrgEncryptionKey)
      );
      const encryptedGroups = await recrypt("/group");
      const encryptedActions = await recrypt("/action");
      const encryptedComments = await recrypt("/comment");
      const encryptedPassages = await recrypt("/passage");
      const encryptedRencontres = await recrypt("/rencontre");
      const encryptedTerritories = await recrypt("/territory");
      const encryptedTerritoryObservations = await recrypt("/territory-observation");
      const encryptedPlaces = await recrypt("/place");
      const encryptedRelsPersonPlace = await recrypt("/relPersonPlace");
      const encryptedReports = await recrypt("/report");

      const totalToEncrypt =
        encryptedPersons.length +
        encryptedGroups.length +
        encryptedActions.length +
        encryptedConsultations.length +
        encryptedTreatments.length +
        encryptedMedicalFiles.length +
        encryptedComments.length +
        encryptedPassages.length +
        encryptedRencontres.length +
        encryptedTerritories.length +
        encryptedTerritoryObservations.length +
        encryptedRelsPersonPlace.length +
        encryptedPlaces.length +
        encryptedReports.length;

      totalDurationOnServer.current = totalToEncrypt * 0.005; // average 5 ms in server

      setEncryptingStatus(
        "Sauvegarde des données nouvellement chiffrées en base de donnée. Ne fermez pas votre fenêtre, cela peut prendre quelques minutes..."
      );
      const updateStatusBarInterval = 2; // in seconds
      const elpasedBarInterval = setInterval(() => {
        setEncryptingProgress((p) => p + updateStatusBarInterval);
      }, updateStatusBarInterval * 1000);
      setOrganisation({ ...organisation, encryptionEnabled: true });
      const res = await API.post({
        path: "/encrypt",
        body: {
          persons: encryptedPersons,
          groups: encryptedGroups,
          actions: encryptedActions,
          consultations: encryptedConsultations,
          treatments: encryptedTreatments,
          medicalFiles: encryptedMedicalFiles,
          comments: encryptedComments,
          passages: encryptedPassages,
          rencontres: encryptedRencontres,
          territories: encryptedTerritories,
          observations: encryptedTerritoryObservations,
          places: encryptedPlaces,
          relsPersonPlace: encryptedRelsPersonPlace,
          reports: encryptedReports,
          encryptedVerificationKey,
        },
        query: {
          encryptionLastUpdateAt: organisation.encryptionLastUpdateAt,
          encryptionEnabled: true,
          changeMasterKey: true,
        },
      });

      clearInterval(elpasedBarInterval);
      if (res.ok) {
        // TODO: clean unused person documents
        setEncryptingProgress(totalDurationOnServer.current);
        setEncryptingStatus("Données chiffrées !");
        setOrganisation(res.data);
        setEncryptionDone(true);
        if (onboardingForTeams) {
          history.push("/team");
        } else {
          toast.success("Données chiffrées ! Veuillez noter la clé puis vous reconnecter");
        }
      }
    } catch (orgEncryptionError) {
      capture("erreur in organisation encryption", orgEncryptionError);
      toast.error(orgEncryptionError.message, { autoClose: false, closeOnClick: false, draggable: false });
      setEncryptingProgress(0);
      setEncryptionKey("");
      setEncryptionDone(false);
      await setOrgEncryptionKey(previousKey.current, { needDerivation: false });
      setEncryptingStatus("Erreur lors du chiffrement, veuillez contacter l'administrateur");
      API.put({
        path: `/organisation/${organisation._id}`,
        body: {
          lockedForEncryption: false,
        },
      });
    }
  };

  const renderEncrypting = () => (
    <>
      <p className="tw-mb-7 tw-block tw-w-full tw-text-center">Ne fermez pas cette page pendant le chiffrement des données...</p>
      <p className="tw-mb-7 tw-block tw-w-full tw-text-center">N'oubliez pas votre nouvelle clé, sinon toutes vos données seront perdues</p>
      <p className="tw-mb-7 tw-block tw-w-full tw-text-red-500 tw-text-center">
        <b>{encryptionKey}</b>
      </p>
      <p className="tw-mb-7 tw-block tw-w-full tw-text-center">
        Si vous perdez cette clé, vos données seront perdues définitivement. Notez-la bien quelque part !
      </p>
      <div className="tw-flex tw-items-center tw-flex-col tw-w-2/3 tw-mx-auto">
        <p>{encryptingStatus}</p>
        <div className="tw-mt-2.5 tw-mb-7 tw-block tw-w-full tw-text-center tw-h-2.5 tw-rounded-full tw-border tw-border-black tw-overflow-hidden">
          <div
            className="tw-bg-main tw-rounded-full tw-transition-all tw-duration-300 tw-h-full"
            style={{
              width: `${(encryptingProgress / totalDurationOnServer.current) * 100}%`,
            }}
          />
        </div>
      </div>
      {!onboardingForTeams && encryptionDone && (
        <div className="tw-flex tw-flex-col tw-items-center">
          <div className="tw-mb-4 tw-text-red-600">Notez la clé avant de vous reconnecter</div>
          <button className="button-submit !tw-bg-black" onClick={API.logout} type="button">
            Se déconnecter
          </button>
        </div>
      )}
    </>
  );

  const renderForm = () => (
    <>
      <p className="tw-mb-7 tw-block tw-w-full tw-text-left">
        {organisation.encryptionEnabled ? (
          "Cette opération entrainera la modification définitive de toutes les données chiffrées liées à l'organisation : personnes suivies, actions, territoires, commentaires et observations, rapports... "
        ) : (
          <>
            <b>Bienvenue dans Mano !</b>
            <br />
            <br />
            Première étape: le chiffrement ! 🔐 Mano est un logiciel qui met la protection des données en priorité. <br />
            Les données enregistrées concernant les personnes suivies, les actions, les territoires, etc. sont <br />
            <b>chiffrées avec une clé que seule votre organisation connait</b>.
          </>
        )}
      </p>
      <p className="tw-mb-7 tw-block tw-w-full tw-text-left">
        Si vous perdez cette clé, vos données seront perdues définitivement. <br />
        Notez-la bien quelque part !
      </p>
      <Formik initialValues={{ encryptionKey: "", encryptionKeyConfirm: "" }} onSubmit={onEncrypt}>
        {({ values, handleChange, handleSubmit, isSubmitting }) => (
          <React.Fragment>
            <div className="tw-flex tw-flex-col tw-items-center tw-mx-auto tw-max-w-xl tw-w-full">
              <div className="tw-flex tw-basis-full tw-w-full tw-flex-col tw-px-4 tw-py-2">
                <label className="tailwindui" htmlFor="encryptionKey">
                  Clé de chiffrement
                </label>
                <input
                  type="text"
                  minLength={8}
                  required
                  className="tailwindui"
                  id="encryptionKey"
                  name="encryptionKey"
                  value={values.encryptionKey}
                  onChange={handleChange}
                />
              </div>
              <div className="tw-flex tw-basis-full tw-w-full tw-flex-col tw-px-4 tw-py-2">
                <label className="tailwindui" htmlFor="encryptionKeyConfirm">
                  Confirmez la clé de chiffrement
                </label>
                <input
                  className="tailwindui"
                  minLength={8}
                  required
                  id="encryptionKeyConfirm"
                  name="encryptionKeyConfirm"
                  value={values.encryptionKeyConfirm}
                  onChange={handleChange}
                />
              </div>
            </div>
            <br />
            <div className="tw-border-t tw-border-t-gray-50 tw-flex tw-justify-center">
              <button
                disabled={isLoading || isSubmitting}
                className="button-submit !tw-bg-black disabled:tw-opacity-50"
                onClick={() => {
                  if (isSubmitting) return;
                  handleSubmit();
                }}
                type="submit"
              >
                {isLoading ? "Chiffrement en cours..." : organisation.encryptionEnabled ? "Changer la clé de chiffrement" : "Activer le chiffrement"}
              </button>
            </div>
          </React.Fragment>
        )}
      </Formik>
    </>
  );

  if (organisation.encryptionEnabled && !user.healthcareProfessional)
    return (
      <em>
        Vous ne pouvez pas changer la clé de chiffrement car vous n'êtes pas déclaré·e comme administrateur·trice de type professionel·le de santé. Il
        est nécessaire d'avoir accès à l'ensemble des données de l'organisation pour pouvoir changer son chiffrement.
      </em>
    );

  return (
    <>
      <button className="button-submit !tw-bg-black" onClick={() => setOpen(true)} type="button">
        {organisation.encryptionEnabled ? "Changer la clé de chiffrement" : "Activer le chiffrement"}
      </button>
      <ModalContainer
        open={open}
        onClose={() => setOpen(false)}
        onAfterLeave={() => {
          setEncryptionKey("");
          setEncryptingProgress(0);
          setEncryptingStatus("");
        }}
        size="3xl"
        dataTestId="encryption-modal"
      >
        <ModalHeader
          title={organisation.encryptionEnabled ? "Changer la clé de chiffrement" : "Activer le chiffrement"}
          onClose={() => setOpen(false)}
        />
        <ModalBody className="tw-p-4">{!encryptionKey ? renderForm() : renderEncrypting()}</ModalBody>
      </ModalContainer>
    </>
  );
};

const recryptDocument = async (doc, personId, { fromKey, toKey }) => {
  const content = await API.download(
    {
      path: doc.downloadPath ?? `/person/${personId}/document/${doc.file.filename}`,
      encryptedEntityKey: doc.encryptedEntityKey,
    },
    fromKey
  );
  const docResult = await API.upload(
    {
      path: `/person/${personId}/document`,
      file: new File([content], doc.file.originalname, { type: doc.file.mimetype }),
    },
    toKey
  );
  const { data: file, encryptedEntityKey } = docResult;
  return {
    _id: file.filename,
    name: doc.file.originalname,
    encryptedEntityKey,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy,
    downloadPath: `/person/${personId}/document/${file.filename}`,
    file,
  };
};

const recryptPersonRelatedDocuments = async (item, id, oldKey, newKey) => {
  if (!item.documents || !item.documents.length) return item;
  const updatedDocuments = [];
  for (const doc of item.documents) {
    try {
      const recryptedDocument = await recryptDocument(doc, id, { fromKey: oldKey, toKey: newKey });
      updatedDocuments.push(recryptedDocument);
    } catch (e) {
      console.error(e);
      // we need a temporary hack, for the organisations which already changed their encryption key
      // but not all the documents were recrypted
      // we told them to change back from `newKey` to `oldKey` to retrieve the old documents
      // and then change back to `newKey` to recrypt them in the new key
      // SO
      // if the recryption failed, we assume the document might have been encrypted with the newKey already
      // so we push it
      updatedDocuments.push(doc);
    }
  }
  return { ...item, documents: updatedDocuments };
};

export default EncryptionKey;
