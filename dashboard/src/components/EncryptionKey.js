import React, { useContext, useState } from 'react';
import { Col, Button as LinkButton, FormGroup, Row, Modal, ModalBody, ModalHeader, Input, Label } from 'reactstrap';
import styled from 'styled-components';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import 'react-datepicker/dist/react-datepicker.css';

import ButtonCustom from './ButtonCustom';
import { theme } from '../config';
import useAuth from '../recoil/auth';
import { preparePersonForEncryption, usePersons } from '../recoil/persons';
import { prepareActionForEncryption, useActions } from '../recoil/actions';
import { prepareCommentForEncryption, useComments } from '../recoil/comments';
import { prepareObsForEncryption, useTerritoryObservations } from '../recoil/territoryObservations';
import { useReports, prepareReportForEncryption } from '../recoil/reports';
import { useTerritories, prepareTerritoryForEncryption } from '../recoil/territory';
import { preparePlaceForEncryption, usePlaces } from '../recoil/places';
import { prepareRelPersonPlaceForEncryption, useRelsPerson } from '../recoil/relPersonPlace';
import { encryptVerificationKey } from '../services/encryption';
import { capture } from '../services/sentry';
import useApi from '../services/api-interface-with-dashboard';
import { useRefresh } from '../recoil/refresh';

const EncryptionKey = () => {
  const [open, setOpen] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [encryptingStatus, setEncryptingStatus] = useState('');
  const [encryptingProgress, setEncryptingProgress] = useState(0);
  const [cancellingEncryption, setCancellingEncryption] = useState(false);

  const { user, organisation, setOrganisation } = useAuth();
  const { persons } = usePersons();
  const { actions } = useActions();
  const { comments } = useComments();
  const { territories } = useTerritories();
  const { territoryObservations: observations, customFieldsObs } = useTerritoryObservations();
  const { places } = usePlaces();
  const { relsPersonPlace } = useRelsPerson();
  const { reports } = useReports();
  const { loading } = useRefresh();
  const API = useApi();

  const totalToEncrypt =
    persons.length +
    actions.length +
    comments.length +
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
      if (!values.encryptionKey) return toastr.error('Erreur!', 'La clé est obligatoire');
      if (!values.encryptionKeyConfirm) return toastr.error('Erreur!', 'La validation de la clé est obligatoire');
      if (values.encryptionKey !== values.encryptionKeyConfirm) return toastr.error('Erreur!', 'Les clés ne sont pas identiques');
      setEncryptionKey(values.encryptionKey.trim());
      await API.setOrgEncryptionKey(values.encryptionKey.trim());
      capture('debug: setting encryption key', {
        extra: { orgEncryptionKey: values.encryptionKey.trim(), hashedOrgEncryptionKey: API.hashedOrgEncryptionKey, organisation },
        user,
      });

      setEncryptingStatus('Chiffrement des données...');
      const encryptedVerificationKey = await encryptVerificationKey(API.hashedOrgEncryptionKey);
      const encryptedPersons = await Promise.all(persons.map(preparePersonForEncryption).map(API.encryptItem));
      const encryptedActions = await Promise.all(actions.map(prepareActionForEncryption).map(API.encryptItem));
      const encryptedComments = await Promise.all(comments.map(prepareCommentForEncryption).map(API.encryptItem));
      const encryptedTerritories = await Promise.all(territories.map(prepareTerritoryForEncryption).map(API.encryptItem));
      const encryptedTerritoryObservations = await Promise.all(observations.map(prepareObsForEncryption(customFieldsObs)).map(API.encryptItem));
      const encryptedPlaces = await Promise.all(places.map(preparePlaceForEncryption).map(API.encryptItem));
      const encryptedRelsPersonPlace = await Promise.all(relsPersonPlace.map(prepareRelPersonPlaceForEncryption).map(API.encryptItem));
      const encryptedReports = await Promise.all(reports.map(prepareReportForEncryption).map(API.encryptItem));

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
          comments: encryptedComments,
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
        toastr.success('Données chiffrées !', 'Veuillez noter la clé puis vous reconnecter');
        setOrganisation(res.data);
      }
    } catch (orgEncryptionError) {
      capture('erreur in organisation encryption', orgEncryptionError);
      toastr.error('Erreur!', orgEncryptionError.message, { timeOut: 0 });
      API.logout();
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

  const cancelEncryption = async () => {
    setCancellingEncryption(true);
    const res = await API.post({ path: '/encrypt/cancel' });
    if (res.ok) {
      toastr.success('Encryption retirée !', 'Veuillez vous reconnecter');
      API.logout();
    }
  };

  const renderForm = () => (
    <ModalBody>
      <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
        Cette opération est irréversible, et entrainera la modification définitive de toutes les données chiffrées liées à l'organisation : personnes
        suivies, actions, territoires, commentaires et observations, rapports...
      </span>
      <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
        Si vous perdez cette clé, vos données seront perdues définitivement. Notez-la bien quelque part !
      </span>
      <Formik initialValues={{ encryptionKey: '', encryptionKeyConfirm: '' }} onSubmit={onEncrypt}>
        {({ values, handleChange, handleSubmit, isSubmitting }) => (
          <React.Fragment>
            <Row style={{ justifyContent: 'center' }}>
              <Col md={3} />
              <Col md={6}>
                <FormGroup>
                  <Label>Clé de chiffrement</Label>
                  <Input name="encryptionKey" value={values.encryptionKey} onChange={handleChange} />
                </FormGroup>
              </Col>
              <Col md={3} />
              <Col md={3} />
              <Col md={6}>
                <FormGroup>
                  <Label>Confirmez la clé de chiffrement</Label>
                  <Input name="encryptionKeyConfirm" value={values.encryptionKeyConfirm} onChange={handleChange} />
                </FormGroup>
              </Col>
              <Col md={3} />
            </Row>
            <br />
            <Row style={{ justifyContent: 'center' }}>
              <ButtonCustom
                color="secondary"
                disabled={loading || isSubmitting}
                onClick={() => !isSubmitting && handleSubmit()}
                title={organisation.encryptionEnabled ? 'Changer la clé de chiffrement' : 'Activer le chiffrement'}
              />
            </Row>
          </React.Fragment>
        )}
      </Formik>
    </ModalBody>
  );

  return (
    <>
      {!!organisation.encryptionEnabled && (
        <LinkButton onClick={cancelEncryption} disabled={!!cancellingEncryption} color="link" style={{ marginRight: 10 }}>
          Retirer le chiffrement
        </LinkButton>
      )}
      <ButtonCustom
        title={organisation.encryptionEnabled ? 'Changer la clé de chiffrement' : 'Activer le chiffrement'}
        type="button"
        color="secondary"
        style={{ marginRight: 20 }}
        onClick={() => setOpen(true)}
      />
      <StyledModal
        backdrop={!encryptionKey ? true : 'static'}
        isOpen={open}
        toggle={() => setOpen(false)}
        onClosed={() => {
          setEncryptionKey('');
          setEncryptingProgress(0);
          setEncryptingStatus('');
        }}
        size="lg"
        centered>
        <ModalHeader toggle={() => setOpen(false)} color="danger">
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
