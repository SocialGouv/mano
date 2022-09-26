import React, { useState } from 'react';
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader, Input, Label } from 'reactstrap';
import styled from 'styled-components';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useHistory } from 'react-router-dom';

import ButtonCustom from './ButtonCustom';
import { theme } from '../config';
import { organisationState, teamsState, userState } from '../recoil/auth';
import { customFieldsPersonsMedicalSelector, customFieldsPersonsSocialSelector, personsState, preparePersonForEncryption } from '../recoil/persons';
import { actionsState, prepareActionForEncryption } from '../recoil/actions';
import { commentsState, prepareCommentForEncryption } from '../recoil/comments';
import { customFieldsObsSelector, prepareObsForEncryption, territoryObservationsState } from '../recoil/territoryObservations';
import { prepareReportForEncryption, reportsState } from '../recoil/reports';
import { prepareTerritoryForEncryption, territoriesState } from '../recoil/territory';
import { placesState, preparePlaceForEncryption } from '../recoil/places';
import { prepareRelPersonPlaceForEncryption, relsPersonPlaceState } from '../recoil/relPersonPlace';
import { encryptVerificationKey } from '../services/encryption';
import { capture } from '../services/sentry';
import useApi, { setOrgEncryptionKey, encryptItem } from '../services/api';
import { passagesState, preparePassageForEncryption } from '../recoil/passages';
import { prepareRencontreForEncryption, rencontresState } from '../recoil/rencontres';
import { consultationsState, prepareConsultationForEncryption } from '../recoil/consultations';
import { prepareTreatmentForEncryption, treatmentsState } from '../recoil/treatments';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../recoil/medicalFiles';
import { useDataLoader } from './DataLoader';

const EncryptionKey = ({ isMain }) => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const teams = useRecoilValue(teamsState);

  const onboardingForEncryption = isMain && !organisation.encryptionEnabled;
  const onboardingForTeams = !teams.length;

  const history = useHistory();

  const [open, setOpen] = useState(onboardingForEncryption);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [encryptingStatus, setEncryptingStatus] = useState('');
  const [encryptingProgress, setEncryptingProgress] = useState(0);

  const user = useRecoilValue(userState);

  const persons = useRecoilValue(personsState);
  const actions = useRecoilValue(actionsState);
  const consultations = useRecoilValue(consultationsState);
  const treatments = useRecoilValue(treatmentsState);
  const medicalFiles = useRecoilValue(medicalFileState);
  const comments = useRecoilValue(commentsState);
  const passages = useRecoilValue(passagesState);
  const rencontres = useRecoilValue(rencontresState);
  const territories = useRecoilValue(territoriesState);
  const observations = useRecoilValue(territoryObservationsState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const places = useRecoilValue(placesState);
  const relsPersonPlace = useRecoilValue(relsPersonPlaceState);
  const reports = useRecoilValue(reportsState);
  const API = useApi();
  const { isLoading } = useDataLoader();

  const totalToEncrypt =
    persons.length +
    actions.length +
    consultations.length +
    treatments.length +
    medicalFiles.length +
    comments.length +
    passages.length +
    rencontres.length +
    territories.length +
    observations.length +
    relsPersonPlace.length +
    places.length +
    reports.length;
  const totalDurationOnServer = totalToEncrypt * 0.032; // average 32 ms in server

  if (!['admin'].includes(user.role)) return null;
  if (API.blockEncrypt) return null;

  const onEncrypt = async (values) => {
    try {
      // just for the button to show loading state, sorry Raph I couldn't find anything better
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (!values.encryptionKey) return toast.error('La clé est obligatoire');
      if (!values.encryptionKeyConfirm) return toast.error('La validation de la clé est obligatoire');
      if (values.encryptionKey !== values.encryptionKeyConfirm) return toast.error('Les clés ne sont pas identiques');
      setEncryptionKey(values.encryptionKey.trim());
      const hashedOrgEncryptionKey = await setOrgEncryptionKey(values.encryptionKey.trim());
      setEncryptingStatus('Chiffrement des données...');
      const encryptedVerificationKey = await encryptVerificationKey(hashedOrgEncryptionKey);
      const encryptedPersons = await Promise.all(
        persons.map(preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)).map(encryptItem(hashedOrgEncryptionKey))
      );

      const encryptedActions = await Promise.all(actions.map(prepareActionForEncryption).map(encryptItem(hashedOrgEncryptionKey)));
      const encryptedConsultations = await Promise.all(
        consultations.map(prepareConsultationForEncryption(organisation.consultations)).map(encryptItem(hashedOrgEncryptionKey))
      );
      const encryptedTreatments = await Promise.all(treatments.map(prepareTreatmentForEncryption).map(encryptItem(hashedOrgEncryptionKey)));
      const encryptedMedicalFiles = await Promise.all(
        medicalFiles.map(prepareMedicalFileForEncryption(customFieldsMedicalFile)).map(encryptItem(hashedOrgEncryptionKey))
      );
      const encryptedComments = await Promise.all(comments.map(prepareCommentForEncryption).map(encryptItem(hashedOrgEncryptionKey)));
      const encryptedPassages = await Promise.all(passages.map(preparePassageForEncryption).map(encryptItem(hashedOrgEncryptionKey)));
      const encryptedRencontres = await Promise.all(rencontres.map(prepareRencontreForEncryption).map(encryptItem(hashedOrgEncryptionKey)));
      const encryptedTerritories = await Promise.all(territories.map(prepareTerritoryForEncryption).map(encryptItem(hashedOrgEncryptionKey)));
      const encryptedTerritoryObservations = await Promise.all(
        observations.map(prepareObsForEncryption(customFieldsObs)).map(encryptItem(hashedOrgEncryptionKey))
      );
      const encryptedPlaces = await Promise.all(places.map(preparePlaceForEncryption).map(encryptItem(hashedOrgEncryptionKey)));
      const encryptedRelsPersonPlace = await Promise.all(
        relsPersonPlace.map(prepareRelPersonPlaceForEncryption).map(encryptItem(hashedOrgEncryptionKey))
      );
      const encryptedReports = await Promise.all(reports.map(prepareReportForEncryption).map(encryptItem(hashedOrgEncryptionKey)));

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
        setEncryptingProgress(totalDurationOnServer);
        setEncryptingStatus('Données chiffrées !');
        setOrganisation(res.data);
        if (onboardingForTeams) {
          history.push('/team');
        } else {
          toast.success('Données chiffrées ! Veuillez noter la clé puis vous reconnecter');
        }
      }
    } catch (orgEncryptionError) {
      capture('erreur in organisation encryption', orgEncryptionError);
      toast.error(orgEncryptionError.message, { timeOut: 0 });
      setEncryptingProgress(0);
      setEncryptionKey('');
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
              backgroundColor: theme.black,
              width: `${(encryptingProgress / totalDurationOnServer) * 100}%`,
              height: '100%',
            }}
          />
        </div>
      </div>
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
        Vous ne pouvez pas changer la clé de chiffrement car vous n'êtes pas déclaré comme adminstrateur de type professionel de santé. Il est
        nécessaire d'avoir accès à l'ensemble des données de l'organisation pour pouvoir changer son chiffrement.
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

const StyledModal = styled(Modal)`
  align-items: center;
  .modal-title {
    width: 100%;
    flex-grow: 1;
    padding: auto;
  }
`;

export default EncryptionKey;
