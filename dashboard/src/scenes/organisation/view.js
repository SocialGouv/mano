/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { FormGroup, Input, Label, Row, Col } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';
import { useRecoilState } from 'recoil';

import ButtonCustom from '../../components/ButtonCustom';
import Box from '../../components/Box';
import DeleteOrganisation from '../../components/DeleteOrganisation';
import EncryptionKey from '../../components/EncryptionKey';
import SelectCustom from '../../components/SelectCustom';
import { actionsCategories } from '../../recoil/actions';
import { defaultMedicalCustomFields, usePersons } from '../../recoil/persons';
import { defaultCustomFields } from '../../recoil/territoryObservations';
import TableCustomFields from '../../components/TableCustomFields';
import { organisationState } from '../../recoil/auth';
import useApi from '../../services/api';
import ExportData from '../data-import-export/ExportData';
import ImportData from '../data-import-export/ImportData';
import DownloadExample from '../data-import-export/DownloadExample';
import { theme } from '../../config';

const View = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const { personFieldsIncludingCustomFields } = usePersons();
  const API = useApi();
  const [tab, setTab] = useState('infos');
  const scrollContainer = useRef(null);

  useEffect(() => {
    scrollContainer.current.scrollTo({ top: 0 });
  }, [tab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', margin: '0 -4rem -3rem', height: 'calc(100% + 3rem)' }}>
      <Title>Réglages de l'organisation</Title>
      <div style={{ display: 'flex', overflow: 'hidden', flex: 1 }}>
        <Drawer>
          <DrawerButton className={tab === 'infos' ? 'active' : ''} onClick={() => setTab('infos')}>
            Infos
          </DrawerButton>
          <DrawerButton className={tab === 'encryption' ? 'active' : ''} onClick={() => setTab('encryption')}>
            Chiffrement
          </DrawerButton>
          <hr />
          <DrawerButton className={tab === 'reception' ? 'active' : ''} onClick={() => setTab('reception')}>
            Accueil de jour
          </DrawerButton>
          <DrawerButton className={tab === 'persons' ? 'active' : ''} onClick={() => setTab('persons')} disabled={!organisation.encryptionEnabled}>
            Personnes suivies
          </DrawerButton>
          <DrawerButton className={tab === 'actions' ? 'active' : ''} onClick={() => setTab('actions')}>
            Actions
          </DrawerButton>
          <DrawerButton
            className={tab === 'territories' ? 'active' : ''}
            onClick={() => setTab('territories')}
            disabled={!organisation.encryptionEnabled}>
            Territoires
          </DrawerButton>
          <hr />
          <DrawerButton className={tab === 'export' ? 'active' : ''} onClick={() => setTab('export')}>
            Export
          </DrawerButton>
          <DrawerButton className={tab === 'import' ? 'active' : ''} onClick={() => setTab('import')}>
            Import
          </DrawerButton>
        </Drawer>
        <div ref={scrollContainer} style={{ overflow: 'auto', flexBasis: '100%' }}>
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
                switch (tab) {
                  default:
                  case 'infos':
                    return (
                      <>
                        <SubTitle>Infos</SubTitle>
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
                          <DeleteOrganisation organisation={organisation} onSuccess={() => API.logout()} />
                        </div>
                      </>
                    );
                  case 'encryption':
                    return (
                      <>
                        <SubTitle>Chiffrement</SubTitle>
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 40 }}>
                          <EncryptionKey isMain />
                        </div>
                      </>
                    );
                  case 'actions':
                    return (
                      <>
                        <SubTitle>Réglage des Actions</SubTitle>
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
                      </>
                    );
                  case 'reception':
                    return (
                      <>
                        <SubTitle>Réglage de l'Accueil de jour</SubTitle>
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
                                options={[...(organisation.services || [])]
                                  .sort((c1, c2) => c1.localeCompare(c2))
                                  .map((cat) => ({ value: cat, label: cat }))}
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
                      </>
                    );
                  case 'territories':
                    return (
                      <>
                        {organisation.encryptionEnabled ? (
                          <>
                            <SubTitle>Réglage des champs personnalisés des territoires</SubTitle>
                            <Row>
                              <TableCustomFields
                                customFields="customFieldsObs"
                                data={(() => {
                                  if (Array.isArray(organisation.customFieldsObs)) return organisation.customFieldsObs;
                                  return defaultCustomFields;
                                })()}
                              />
                            </Row>
                          </>
                        ) : (
                          <>
                            <SubTitle>Réglage des champs personnalisés</SubTitle>
                            <Row>
                              <Col md={10}>
                                <p>
                                  Désolé, cette fonctionnalité qui consiste à personnaliser les champs disponibles pour les observations de
                                  territoires n'existe que pour les organisations chiffrées.
                                </p>
                              </Col>
                            </Row>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                              <EncryptionKey />
                            </div>
                          </>
                        )}
                      </>
                    );
                  case 'persons':
                    return (
                      <>
                        {organisation.encryptionEnabled ? (
                          <>
                            <SubTitle>Réglage des champs personnalisés des personnes suivies (dossier social)</SubTitle>
                            <Row>
                              <TableCustomFields
                                customFields="customFieldsPersonsSocial"
                                data={(() => {
                                  if (Array.isArray(organisation.customFieldsPersonsSocial)) return organisation.customFieldsPersonsSocial;
                                  return [];
                                })()}
                              />
                            </Row>
                            <SubTitle>Réglage des champs personnalisés des personnes suivies (dossier médical)</SubTitle>
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
                            <SubTitle>Réglage des champs personnalisés des personnes</SubTitle>
                            <Row>
                              <Col md={10}>
                                <p>
                                  Désolé, cette fonctionnalité qui consiste à personnaliser les champs disponibles pour les personnes suivies n'existe
                                  que pour les organisations chiffrées.
                                </p>
                              </Col>
                            </Row>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                              <EncryptionKey />
                            </div>
                          </>
                        )}
                      </>
                    );
                  case 'export':
                    return (
                      <>
                        <SubTitle>Exporter des données</SubTitle>
                        <Row>
                          <Col md={10}>
                            <p>Vous pouvez exporter l'ensemble de vos données dans un fichier Excel.</p>
                          </Col>
                        </Row>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                          <ExportData />
                        </div>
                      </>
                    );
                  case 'import':
                    return (
                      <>
                        <SubTitle>Importer des personnes suivies</SubTitle>
                        <Row>
                          <Col md={10}>
                            <p>
                              Vous pouvez importer une liste de personnes suivies depuis un fichier Excel. Ce fichier doit avoir quelques
                              caractéristiques:
                            </p>
                            <ul>
                              <li>
                                avoir un onglet dont le nom contient <code>personne</code>
                              </li>
                              <li>avoir en première ligne de cet onglet des têtes de colonnes</li>
                              <li>
                                les colonnes qui seront importées peuvent être parmi la liste suivante - toute colonne qui ne s'appelle pas ainsi ne
                                sera pas prise en compte - certaines colonnes ont des valeurs imposées :
                                <table className="table table-sm" style={{ fontSize: '14px', marginTop: '2rem' }}>
                                  <thead>
                                    <tr>
                                      <th>Colonne</th>
                                      <th>Valeur</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {personFieldsIncludingCustomFields()
                                      .filter((f) => f.importable)
                                      .map((f) => {
                                        return (
                                          <tr key={f.label}>
                                            <td>{f.label}</td>
                                            <td>
                                              <ImportFieldDetails field={f} />
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>
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
                }
              }}
            </Formik>
          </Box>
        </div>
      </div>
    </div>
  );
};

const ImportFieldDetails = ({ field }) => {
  if (field.options?.length) {
    return field.options?.map((option, index) => (
      <span key={option}>
        <code>
          {option}
          {index !== field.options.length - 1 && ', '}
        </code>
      </span>
    ));
  }
  if (['date', 'date-with-time'].includes(field.type)) {
    return (
      <i style={{ color: '#666' }}>
        Une date sous la forme AAAA-MM-JJ (exemple: <code>2021-01-01</code>)
      </i>
    );
  }
  if (['boolean', 'yes-no'].includes(field.type)) {
    return <code>Oui, Non</code>;
  }
  return <i style={{ color: '#666' }}>Un texte</i>;
};

const Title = styled.h2`
  color: ${theme.black};
  font-weight: bold;
  font-size: 1.5rem;
  line-height: 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin: 0;
`;

const SubTitle = styled.h3`
  font-size: 1.25rem;
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

const Drawer = styled.aside`
  padding-top: 20px;
  padding-left: 10px;
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-shrink: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  height: 100%;
  button {
    text-align: left;
  }
`;

const DrawerButton = styled.button`
  text-decoration: none;
  padding: 0px;
  display: block;
  border-radius: 8px;
  color: #565a5b;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 24px;
  margin: 2px 0;
  border: none;
  background: none;
  &.active {
    color: ${theme.main};
  }
`;

export default View;
