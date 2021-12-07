/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { Container, FormGroup, Input, Label, Row, Col } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';

import Header from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import BackButton from '../../components/backButton';
import Box from '../../components/Box';
import DeleteOrganisation from '../../components/DeleteOrganisation';
import EncryptionKey from '../../components/EncryptionKey';
import SelectCustom from '../../components/SelectCustom';
import { actionsCategories } from '../../recoil/actions';
import { defaultMedicalCustomFields } from '../../recoil/persons';
import { defaultCustomFields } from '../../recoil/territoryObservations';
import TableCustomFields from '../../components/TableCustomFields';
import { useAuth } from '../../recoil/auth';
import useApi from '../../services/api-interface-with-dashboard';
import ExportData from '../data-import-export/ExportData';
import ImportData from '../data-import-export/ImportData';
import { usePersons } from '../../recoil/persons';
import DownloadExample from '../data-import-export/DownloadExample';

const View = () => {
  const { organisation, setOrganisation } = useAuth();
  const { personFieldsIncludingCustomFields } = usePersons();
  const API = useApi();

  return (
    <Container style={{ padding: '40px 0', margin: '0 -40px' }}>
      <Header title={<BackButton />} />
      <Box>
        <Formik
          initialValues={{ ...organisation, receptionEnabled: organisation.receptionEnabled || false }}
          onSubmit={async (body) => {
            try {
              const response = await API.put({ path: `/organisation/${organisation._id}`, body });
              if (response.ok) {
                toastr.success('Mise à jour !');
                setOrganisation(response.data);
              }
            } catch (orgUpdateError) {
              console.log('error in updating organisation', orgUpdateError);
              toastr.error('Erreur!', orgUpdateError.message);
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => {
            return (
              <>
                <Title>Infos</Title>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nom</Label>
                      <Input name="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 40 }}>
                  <ButtonCustom title="Mettre à jour" loading={isSubmitting} onClick={handleSubmit} width={200} />
                  <DeleteOrganisation />
                </div>
                <hr />
                <Title>Encryption</Title>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 40 }}>
                  <EncryptionKey />
                </div>
                <hr />
                <Title>Réglage des Actions</Title>
                <Row>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Categories des actions</Label>
                      <SelectCustom
                        creatable
                        options={actionsCategories.sort((c1, c2) => c1.localeCompare(c2)).map((cat) => ({ value: cat, label: cat }))}
                        value={(values.categories || []).map((cat) => ({ value: cat, label: cat }))}
                        isMulti
                        onChange={(cats) => handleChange({ target: { value: cats.map((cat) => cat.value), name: 'categories' } })}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                  <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                </div>
                <hr />
                <Title>Réglage de l'Accueil de jour</Title>
                <Row>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Accueil de jour activé</Label>
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                        <span>Accueil de jour activé</span>
                        <Input type="checkbox" name="receptionEnabled" checked={values.receptionEnabled || false} onChange={handleChange} />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Services disponibles</Label>
                      <SelectCustom
                        creatable
                        options={[...(organisation.services || [])].sort((c1, c2) => c1.localeCompare(c2)).map((cat) => ({ value: cat, label: cat }))}
                        value={(values.services || []).map((cat) => ({ value: cat, label: cat }))}
                        isMulti
                        onChange={(cats) => handleChange({ target: { value: cats.map((cat) => cat.value), name: 'services' } })}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                  <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                </div>
                <hr />

                {/* this custom fields is only working if encryption is enabled */}
                <>
                  {organisation.encryptionEnabled ? (
                    <>
                      <Title>Réglage des champs personnalisés des territoires</Title>
                      <Row>
                        <TableCustomFields
                          customFields="customFieldsObs"
                          data={(() => {
                            if (Array.isArray(organisation.customFieldsObs)) return organisation.customFieldsObs;
                            return defaultCustomFields;
                          })()}
                        />
                      </Row>
                      <Title>Réglage des champs personnalisés des personnes suivies (dossier social)</Title>
                      <Row>
                        <TableCustomFields
                          customFields="customFieldsPersonsSocial"
                          data={(() => {
                            if (Array.isArray(organisation.customFieldsPersonsSocial)) return organisation.customFieldsPersonsSocial;
                            return [];
                          })()}
                        />
                      </Row>
                      <Title>Réglage des champs personnalisés des personnes suivies (dossier médical)</Title>
                      <Row>
                        <TableCustomFields
                          customFields="customFieldsPersonsMedical"
                          data={(() => {
                            if (Array.isArray(organisation.customFieldsPersonsMedical)) return organisation.customFieldsPersonsMedical;
                            return defaultMedicalCustomFields;
                          })()}
                        />
                      </Row>
                    </>
                  ) : (
                    <>
                      <Title>Réglage des champs personnalisés des territoires</Title>
                      <Row>
                        <Col md={10}>
                          <p>
                            Désolé, cette fonctionnalité qui consiste à personnaliser les champs disponibles pour les observations de territoires et
                            les personnes suivies n'existe que pour les organisations chiffrées.
                          </p>
                        </Col>
                      </Row>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                        <EncryptionKey />
                      </div>
                    </>
                  )}
                </>
                <hr />
                <Title>Exporter des données</Title>
                <Row>
                  <Col md={10}>
                    <p>Vous pouvez exporter l'ensemble de vos données dans un fichier Excel.</p>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                  <ExportData />
                </div>
                <hr />
                <Title>Importer des personnes suivies</Title>
                <Row>
                  <Col md={10}>
                    <p>
                      Vous pouvez importer une liste de personnes suivies depuis un fichier Excel. Ce fichier doit avoir quelques caractéristiques:
                    </p>
                    <ul>
                      <li>
                        avoir un onglet dont le nom contient <code>personne</code>
                      </li>
                      <li>avoir en première ligne de cet onglet des têtes de colonnes</li>
                      <li>
                        les colonnes qui seront importées peuvent être parmi la liste suivante - toute colonne qui ne s'appelle pas ainsi ne sera pas
                        prise en compte - certaines colonnes ont des valeurs imposées :
                        <ul>
                          {personFieldsIncludingCustomFields()
                            .filter((f) => f.importable)
                            .map((f) => {
                              return (
                                <li key={f.label}>
                                  {f.label}
                                  {f.options?.length && ' : '}
                                  {f.options?.map((option, index) => (
                                    <span key={option}>
                                      <code>
                                        {option}
                                        {index !== f.options.length - 1 && ', '}
                                      </code>
                                    </span>
                                  ))}
                                </li>
                              );
                            })}
                        </ul>
                      </li>
                    </ul>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40, gap: '1rem' }}>
                  <DownloadExample />
                  <ImportData />
                </div>
              </>
            );
          }}
        </Formik>
      </Box>
    </Container>
  );
};

const Title = styled.h2`
  font-size: 20px;
  font-weight: 800;
  display: flex;
  justify-content: space-between;
  margin: 40px 0;
  span {
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 400;
    font-style: italic;
    display: block;
  }
`;
export default View;
