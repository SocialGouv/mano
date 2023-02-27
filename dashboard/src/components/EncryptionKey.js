import React, { useEffect, useRef, useState } from 'react';
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader, Input, Label } from 'reactstrap';
import styled from 'styled-components';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useHistory } from 'react-router-dom';

import ButtonCustom from './ButtonCustom';
import { theme } from '../config';
import { organisationState, teamsState, userState } from '../recoil/auth';
import { encryptVerificationKey } from '../services/encryption';
import { capture } from '../services/sentry';
import API, { setOrgEncryptionKey, getHashedOrgEncryptionKey, decryptAndEncryptItem } from '../services/api';
import { useDataLoader } from './DataLoader';

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
  const [encryptionKey, setEncryptionKey] = useState('');
  const [encryptingStatus, setEncryptingStatus] = useState('');
  const [encryptingProgress, setEncryptingProgress] = useState(0);
  const [encryptionDone, setEncryptionDone] = useState(false);
  const { isLoading, refresh } = useDataLoader();

  useEffect(() => {
    if (open) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, encryptionKey]);

  if (!['admin'].includes(user.role)) return null;

  const onEncrypt = async (values) => {
    try {
      // just for the button to show loading state, sorry Raph I couldn't find anything better
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (!values.encryptionKey) return toast.error('La clé est obligatoire');
      if (!values.encryptionKeyConfirm) return toast.error('La validation de la clé est obligatoire');
      if (values.encryptionKey !== values.encryptionKeyConfirm) return toast.error('Les clés ne sont pas identiques');
      previousKey.current = getHashedOrgEncryptionKey();
      setEncryptionKey(values.encryptionKey.trim());
      const hashedOrgEncryptionKey = await setOrgEncryptionKey(values.encryptionKey.trim());
      setEncryptingStatus('Chiffrement des données...');
      const encryptedVerificationKey = await encryptVerificationKey(hashedOrgEncryptionKey);

      async function recrypt(path, callback = null) {
        setEncryptingStatus(`Chiffrement des données : (${path.replace('/', '')}s)`);
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

      const encryptedPersons = await recrypt('/person', async (decryptedData, item) =>
        recryptPersonRelatedDocuments(decryptedData, item._id, previousKey.current, hashedOrgEncryptionKey)
      );
      const encryptedConsultations = await recrypt('/consultation', async (decryptedData) =>
        recryptPersonRelatedDocuments(decryptedData, decryptedData.person, previousKey.current, hashedOrgEncryptionKey)
      );
      const encryptedTreatments = await recrypt('/treatment', async (decryptedData) =>
        recryptPersonRelatedDocuments(decryptedData, decryptedData.person, previousKey.current, hashedOrgEncryptionKey)
      );
      const encryptedMedicalFiles = await recrypt('/medical-file', async (decryptedData) =>
        recryptPersonRelatedDocuments(decryptedData, decryptedData.person, previousKey.current, hashedOrgEncryptionKey)
      );
      const encryptedGroups = await recrypt('/group');
      const encryptedActions = await recrypt('/action');
      const encryptedComments = await recrypt('/comment');
      const encryptedPassages = await recrypt('/passage');
      const encryptedRencontres = await recrypt('/rencontre');
      const encryptedTerritories = await recrypt('/territory');
      const encryptedTerritoryObservations = await recrypt('/territory-observation');
      const encryptedPlaces = await recrypt('/place');
      const encryptedRelsPersonPlace = await recrypt('/relPersonPlace');
      const encryptedReports = await recrypt('/report');

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
        'Sauvegarde des données nouvellement chiffrées en base de donnée. Ne fermez pas votre fenêtre, cela peut prendre quelques minutes...'
      );
      const updateStatusBarInterval = 2; // in seconds
      const elpasedBarInterval = setInterval(() => {
        setEncryptingProgress((p) => p + updateStatusBarInterval);
      }, updateStatusBarInterval * 1000);
      setOrganisation({ ...organisation, encryptionEnabled: true });
      const res = await API.post({
        path: '/encrypt',
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
        setEncryptingStatus('Données chiffrées !');
        setOrganisation(res.data);
        setEncryptionDone(true);
        if (onboardingForTeams) {
          history.push('/team');
        } else {
          toast.success('Données chiffrées ! Veuillez noter la clé puis vous reconnecter');
        }
      }
    } catch (orgEncryptionError) {
      capture('erreur in organisation encryption', orgEncryptionError);
      toast.error(orgEncryptionError.message, { autoClose: false, closeOnClick: false, draggable: false });
      setEncryptingProgress(0);
      setEncryptionKey('');
      setEncryptionDone(false);
      await setOrgEncryptionKey(previousKey.current, { needDerivation: false });
      setEncryptingStatus("Erreur lors du chiffrement, veuillez contacter l'administrateur");
    }
  };

  const renderEncrypting = () => (
    <ModalBody>
      <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
        Ne fermez pas cette page pendant le chiffrement des données...
      </span>
      <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
        N'oubliez pas votre nouvelle clé, sinon toutes vos données seront perdues
      </span>
      <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center', color: theme.redDark }}>
        <b>{encryptionKey}</b>
      </span>
      <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
        Si vous perdez cette clé, vos données seront perdues définitivement. Notez-la bien quelque part !
      </span>
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', width: '60%', margin: '0 auto' }}>
        <span>{encryptingStatus}</span>
        <div
          style={{
            marginTop: 10,
            marginBottom: 30,
            display: 'block',
            width: '100%',
            textAlign: 'center',
            height: 10,
            borderRadius: 10,
            border: '1px solid black',
            overflow: 'hidden',
          }}>
          <div
            style={{
              backgroundColor: theme.main,
              width: `${(encryptingProgress / totalDurationOnServer.current) * 100}%`,
              height: '100%',
            }}
          />
        </div>
      </div>
      {!onboardingForTeams && encryptionDone && (
        <div className="tw-flex tw-flex-col tw-items-center">
          <div className="tw-mb-4 tw-text-red-600">Notez la clé avant de vous reconnecter</div>
          <ButtonCustom
            color="secondary"
            onClick={async () => {
              return API.logout();
            }}
            title={'Se déconnecter'}
          />
        </div>
      )}
    </ModalBody>
  );

  const renderForm = () => (
    <ModalBody>
      <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
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
      </span>
      <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
        Si vous perdez cette clé, vos données seront perdues définitivement. <br />
        Notez-la bien quelque part !
      </span>
      <Formik initialValues={{ encryptionKey: '', encryptionKeyConfirm: '' }} onSubmit={onEncrypt}>
        {({ values, handleChange, handleSubmit, isSubmitting }) => (
          <React.Fragment>
            <Row style={{ justifyContent: 'center' }}>
              <Col md={3} />
              <Col md={6}>
                <FormGroup>
                  <Label htmlFor="encryptionKey">Clé de chiffrement</Label>
                  <Input id="encryptionKey" name="encryptionKey" value={values.encryptionKey} onChange={handleChange} />
                </FormGroup>
              </Col>
              <Col md={3} />
              <Col md={3} />
              <Col md={6}>
                <FormGroup>
                  <Label htmlFor="encryptionKeyConfirm">Confirmez la clé de chiffrement</Label>
                  <Input id="encryptionKeyConfirm" name="encryptionKeyConfirm" value={values.encryptionKeyConfirm} onChange={handleChange} />
                </FormGroup>
              </Col>
              <Col md={3} />
            </Row>
            <br />
            <Row style={{ justifyContent: 'center' }}>
              <ButtonCustom
                color="secondary"
                id="encrypt"
                disabled={isLoading || isSubmitting}
                loading={isLoading || isSubmitting}
                type="submit"
                onClick={() => {
                  if (isSubmitting) return;
                  handleSubmit();
                }}
                title={organisation.encryptionEnabled ? 'Changer la clé de chiffrement' : 'Activer le chiffrement'}
              />
            </Row>
          </React.Fragment>
        )}
      </Formik>
    </ModalBody>
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
      <ButtonCustom
        title={organisation.encryptionEnabled ? 'Changer la clé de chiffrement' : 'Activer le chiffrement'}
        type="button"
        color="secondary"
        style={{ marginRight: 20 }}
        onClick={() => setOpen(true)}
      />
      <StyledModal
        backdrop="static"
        isOpen={open}
        toggle={() => setOpen(false)}
        onClosed={() => {
          setEncryptionKey('');
          setEncryptingProgress(0);
          setEncryptingStatus('');
        }}
        size="lg"
        data-test-id="encryption-modal"
        centered>
        <ModalHeader close={onboardingForEncryption ? <></> : null} toggle={() => setOpen(false)} color="danger">
          <span style={{ color: theme.black, textAlign: 'center', display: 'block' }}>
            {organisation.encryptionEnabled ? 'Changer la clé de chiffrement' : 'Activer le chiffrement'}
          </span>
        </ModalHeader>
        {!encryptionKey ? renderForm() : renderEncrypting()}
      </StyledModal>
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

const StyledModal = styled(Modal)`
  align-items: center;
  .modal-title {
    width: 100%;
    flex-grow: 1;
    padding: auto;
  }
`;

export default EncryptionKey;
