/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FormGroup, Input, Label, Row, Col } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import ButtonCustom from '../../components/ButtonCustom';
import Box from '../../components/Box';
import DeleteOrganisation from '../../components/DeleteOrganisation';
import EncryptionKey from '../../components/EncryptionKey';
import SelectCustom from '../../components/SelectCustom';
import { actionsCategories, actionsState, prepareActionForEncryption } from '../../recoil/actions';
import { defaultMedicalCustomFields, personFieldsIncludingCustomFieldsSelector } from '../../recoil/persons';
import { defaultCustomFields } from '../../recoil/territoryObservations';
import TableCustomFields from '../../components/TableCustomFields';
import { organisationState } from '../../recoil/auth';
import useApi, { encryptItem, hashedOrgEncryptionKey } from '../../services/api';
import ExportData from '../data-import-export/ExportData';
import ImportData from '../data-import-export/ImportData';
import DownloadExample from '../data-import-export/DownloadExample';
import { theme } from '../../config';
import SortableGrid from '../../components/SortableGrid';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import { refreshTriggerState } from '../../components/Loader';

const View = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const actions = useRecoilValue(actionsState);
  const reports = useRecoilValue(reportsState);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const personFieldsIncludingCustomFields = useRecoilValue(personFieldsIncludingCustomFieldsSelector);
  const API = useApi();
  const [tab, setTab] = useState(!organisation.encryptionEnabled ? 'encryption' : 'infos');
  const scrollContainer = useRef(null);

  useEffect(() => {
    scrollContainer.current.scrollTo({ top: 0 });
  }, [tab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', margin: '0 -4rem -3rem', height: 'calc(100% + 3rem)' }}>
      <Title>Réglages de l'organisation {organisation.name}</Title>
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
          <DrawerButton className={tab === 'consultations' ? 'active' : ''} onClick={() => setTab('consultations')}>
            Consultations
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
                  case 'consultations':
                    return (
                      <Consultations organisation={values} handleChange={handleChange} handleSubmit={handleSubmit} isSubmitting={isSubmitting} />
                    );
                  case 'actions':
                    return (
                      <>
                        <SubTitle>Réglage des Actions</SubTitle>
                        <Row>
                          <Col md={12}>
                            <FormGroup>
                              <Label>Categories des actions</Label>
                              <SortableGrid
                                list={values.categories || []}
                                editItemTitle="Changer le nom de la catégorie d'action"
                                onUpdateList={(cats) => handleChange({ target: { value: cats, name: 'categories' } })}
                                onRemoveItem={(content) =>
                                  handleChange({ target: { value: (values.categories || []).filter((cat) => cat !== content), name: 'categories' } })
                                }
                                onEditItem={async ({ content, newContent }) => {
                                  if (!newContent) {
                                    toastr.error('Erreur', 'Vous devez saisir un nom pour la catégorie');
                                    return;
                                  }
                                  const encryptedActions = await Promise.all(
                                    actions
                                      .filter((a) => a.categories.includes(content))
                                      .map((action) => ({
                                        ...action,
                                        categories: [...new Set(action.categories.map((cat) => (cat === content ? newContent : cat)))],
                                      }))
                                      .map(prepareActionForEncryption)
                                      .map(encryptItem(hashedOrgEncryptionKey))
                                  );
                                  const newCategories = [...new Set((values.categories || []).map((cat) => (cat === content ? newContent : cat)))];
                                  const response = await API.put({
                                    path: `/category`,
                                    body: {
                                      categories: newCategories,
                                      actions: encryptedActions,
                                    },
                                  });
                                  if (response.ok) {
                                    setRefreshTrigger({
                                      status: true,
                                      options: { showFullScreen: false, initialLoad: false },
                                    });
                                    handleChange({ target: { value: newCategories, name: 'categories' } });
                                    setOrganisation({ ...organisation, categories: newCategories });
                                    toastr.success(
                                      'Catégorie mise à jour',
                                      "Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard"
                                    );
                                  } else {
                                    toastr.error('Erreur!', "Une erreur inattendue est survenue, l'équipe technique a été prévenue. Désolé !");
                                  }
                                }}
                              />
                            </FormGroup>
                            <FormGroup>
                              <Label>Ajouter une catégorie</Label>
                              <SelectCustom
                                key={JSON.stringify(values.categories || [])}
                                creatable
                                options={[...(actionsCategories || [])]
                                  .filter((cat) => !(values.categories || []).includes(cat))
                                  .sort((c1, c2) => c1.localeCompare(c2))
                                  .map((cat) => ({ value: cat, label: cat }))}
                                value={null}
                                onChange={(cat) => {
                                  if (cat && cat.value) {
                                    handleChange({ target: { value: [...(values.categories || []), cat.value], name: 'categories' } });
                                  }
                                }}
                                onCreateOption={async (name) => {
                                  handleChange({ target: { value: [...(values.categories || []), name], name: 'categories' } });
                                }}
                                isClearable
                                inputId="organisation-select-categories"
                                classNamePrefix="organisation-select-categories"
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                          <ButtonCustom
                            title={'Mettre à jour'}
                            disabled={JSON.stringify(organisation.categories) === JSON.stringify(values.categories || [])}
                            loading={isSubmitting}
                            onClick={handleSubmit}
                            width={200}
                          />
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
                              <Label />
                              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                                <span>Accueil de jour activé</span>
                                <Input type="checkbox" name="receptionEnabled" checked={values.receptionEnabled || false} onChange={handleChange} />
                              </div>
                            </FormGroup>
                          </Col>
                          <Col md={12}>
                            <FormGroup>
                              <Label>Services disponibles</Label>
                              <SortableGrid
                                list={values.services || []}
                                editItemTitle="Changer le nom du service"
                                onUpdateList={(newServices) => handleChange({ target: { value: newServices, name: 'services' } })}
                                onRemoveItem={(content) =>
                                  handleChange({ target: { value: values.services.filter((service) => service !== content), name: 'services' } })
                                }
                                onEditItem={async ({ content, newContent }) => {
                                  if (!newContent) {
                                    toastr.error('Erreur', 'Vous devez saisir un nom pour le service');
                                    return;
                                  }
                                  // two cases:
                                  // 1. just change 'one_service' to 'another_new_service'
                                  // 2. merge 'one_service' to 'an_existing_service'
                                  const reportsWithService = reports.filter((r) => Object.keys(JSON.parse(r.services || '{}')).includes(content));
                                  const encryptedReports = await Promise.all(
                                    reportsWithService
                                      .map((report) => {
                                        const newServices = {};
                                        const oldServices = JSON.parse(report.services || '{}');
                                        for (const service of Object.keys(oldServices)) {
                                          if (service === content) {
                                            if (Object.keys(oldServices).includes(newContent)) {
                                              // merge
                                              if (!newServices[newContent]) newServices[newContent] = 0;
                                              newServices[newContent] = newServices[newContent] + oldServices[newContent];
                                            } else {
                                              newServices[newContent] = oldServices[content];
                                            }
                                          } else {
                                            if (!newServices[service]) newServices[service] = 0;
                                            newServices[service] = newServices[service] + oldServices[service];
                                          }
                                        }
                                        return {
                                          ...report,
                                          services: JSON.stringify(newServices),
                                        };
                                      })
                                      .map(prepareReportForEncryption)
                                      .map(encryptItem(hashedOrgEncryptionKey))
                                  );

                                  const newServices = [...new Set(values.services.map((service) => (service === content ? newContent : service)))];
                                  const response = await API.put({
                                    path: `/service`,
                                    body: {
                                      services: newServices,
                                      reports: encryptedReports,
                                    },
                                  });
                                  if (response.ok) {
                                    setRefreshTrigger({
                                      status: true,
                                      options: { showFullScreen: false, initialLoad: false },
                                    });
                                    handleChange({ target: { value: newServices, name: 'services' } });
                                    setOrganisation({ ...organisation, services: newServices });
                                    toastr.success(
                                      'Service mis à jour',
                                      "Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard"
                                    );
                                  } else {
                                    toastr.error('Erreur!', "Une erreur inattendue est survenue, l'équipe technique a été prévenue. Désolé !");
                                  }
                                }}
                              />
                            </FormGroup>
                            <FormGroup>
                              <Label>Ajouter un service</Label>
                              <SelectCustom
                                key={JSON.stringify(values.services)}
                                creatable
                                isOptionDisabled={({ value }) => (values.services || []).includes(value)}
                                options={[...(organisation.services || [])]
                                  .sort((c1, c2) => c1.localeCompare(c2))
                                  .map((cat) => ({ value: cat, label: cat }))}
                                value={null}
                                onCreateOption={async (name) => {
                                  handleChange({ target: { value: [...(values.services || []), name], name: 'services' } });
                                }}
                                isClearable
                                inputId="organisation-select-services"
                                classNamePrefix="organisation-select-services"
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                          <ButtonCustom
                            title={'Mettre à jour'}
                            disabled={
                              values.receptionEnabled === organisation.receptionEnabled &&
                              JSON.stringify(organisation.services) === JSON.stringify(values.services || [])
                            }
                            loading={isSubmitting}
                            onClick={handleSubmit}
                            width={200}
                          />
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
                                key="customFieldsObs"
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
                                key="customFieldsPersonsSocial"
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
                                showHealthcareProfessionnalColumn
                                key="customFieldsPersonsMedical"
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
                                    {personFieldsIncludingCustomFields
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

function Consultations({ handleChange, isSubmitting, handleSubmit }) {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const [consultations, setConsultations] = useState([]);
  const consultationsSortable = useMemo(() => consultations.map((e) => e.name), [consultations]);
  useEffect(() => {
    setConsultations(organisation.consultations);
  }, [organisation, setConsultations]);
  console.log('anciennes ? ', organisation.consultations);
  return (
    <>
      <SubTitle>Consultations</SubTitle>
      <FormGroup>
        <Label>Types de consultations</Label>

        <SortableGrid
          list={consultationsSortable}
          editItemTitle="Changer le nom du type de consultation"
          onUpdateList={(list) => {
            const newConsultations = [];
            for (const item of list) {
              const consultation = consultations.find((e) => e.name === item);
              if (consultation) newConsultations.push(consultation);
              else newConsultations.push({ name: item, fields: [] });
            }
            setConsultations(newConsultations);
          }}
          onRemoveItem={(content) => {
            setConsultations(consultations.filter((e) => e.name !== content));
          }}
          onEditItem={async ({ content, newContent }) => {
            setConsultations(consultations.map((e) => (e.name === content ? { ...e, name: newContent } : e)));
          }}
        />
      </FormGroup>
      <FormGroup>
        <Label>Ajouter un type de consultation</Label>
        <SelectCustom
          key={JSON.stringify(consultationsSortable || [])}
          creatable
          options={consultationsSortable
            .filter((cat) => consultationsSortable.includes(cat))
            .sort((c1, c2) => c1.localeCompare(c2))
            .map((cat) => ({ value: cat, label: cat }))}
          value={null}
          onChange={(cat) => {
            if (cat && cat.value) {
              setConsultations([...consultations, { name: cat.value, fields: [] }]);
            }
          }}
          onCreateOption={async (name) => {
            setConsultations([...consultations, { name, fields: [] }]);
          }}
          isClearable
        />
      </FormGroup>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem', marginTop: '1rem' }}>
        <ButtonCustom
          title="Mettre à jour"
          loading={isSubmitting}
          onClick={() => {
            handleChange({ target: { value: consultations, name: 'consultations' } });
            handleSubmit();
          }}
          width={200}
        />
      </div>
      {organisation.consultations.map((consultation) => {
        return (
          <div key={consultation.name}>
            <h5 style={{ marginTop: '2rem' }}>{consultation.name}</h5>

            <small>
              Vous pouvez personnaliser les champs disponibles pour les consultations de type <strong>{consultation.name}</strong>.
            </small>
            <Row>
              <TableCustomFields
                customFields="consultations"
                keyPrefix={consultation.name}
                mergeData={(newData) => {
                  console.log(
                    'mergeData',
                    newData,
                    organisation.consultations,
                    consultations,
                    organisation.consultations.map((e) => (e.name === consultation.name ? { ...e, fields: newData } : e))
                  );
                  return organisation.consultations.map((e) => (e.name === consultation.name ? { ...e, fields: newData } : e));
                }}
                extractData={(data) => {
                  console.log(
                    'extractData',
                    data,
                    consultation.name,
                    data.find((e) => e.name === consultation.name)
                  );
                  return data.find((e) => e.name === consultation.name).fields || [];
                }}
                data={(() => {
                  return Array.isArray(consultation.fields) ? consultation.fields : [];
                })()}
              />
            </Row>
          </div>
        );
      })}
    </>
  );
}

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
  /* border-bottom: 1px solid rgba(0, 0, 0, 0.1); */
  padding: 1rem;
  margin: 0;
  background-color: ${theme.main}22;
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
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  height: 100%;
  background-color: ${theme.main}22;
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
