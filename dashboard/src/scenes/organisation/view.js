import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FormGroup, Input, Label, Row, Col } from 'reactstrap';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue } from 'recoil';

import ButtonCustom from '../../components/ButtonCustom';
import EncryptionKey from '../../components/EncryptionKey';
import SelectCustom from '../../components/SelectCustom';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  fieldsPersonsCustomizableOptionsSelector,
  personFieldsIncludingCustomFieldsSelector,
  personsState,
  usePreparePersonForEncryption,
} from '../../recoil/persons';
import { defaultCustomFields, territoryObservationsState } from '../../recoil/territoryObservations';
import TableCustomFields from '../../components/TableCustomFields';
import { organisationState, userState } from '../../recoil/auth';
import useApi, { encryptItem, hashedOrgEncryptionKey } from '../../services/api';
import ExportData from '../data-import-export/ExportData';
import ImportData from '../data-import-export/ImportData';
import DownloadExample from '../data-import-export/DownloadExample';
import SortableGrid from '../../components/SortableGrid';
import useTitle from '../../services/useTitle';
import { consultationsState, consultationTypes, prepareConsultationForEncryption } from '../../recoil/consultations';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';
import { capture } from '../../services/sentry';
import { customFieldsMedicalFileSelector, medicalFileState } from '../../recoil/medicalFiles';
import { useDataLoader } from '../../components/DataLoader';
import ActionCategoriesSettings from './ActionCategoriesSettings';
import ServicesSettings from './ServicesSettings';

const getSettingTitle = (tabId) => {
  if (tabId === 'infos') return 'Infos';
  if (tabId === 'encryption') return 'Chiffrement';
  if (tabId === 'reception') return 'Accueil';
  if (tabId === 'persons') return 'Personnes';
  if (tabId === 'consultations') return 'Consultations 🧑‍⚕️ ';
  if (tabId === 'medicalFile') return 'Dossier Médical 🧑‍⚕️';
  if (tabId === 'actions') return 'Actions';
  if (tabId === 'territories') return 'Territoires';
  if (tabId === 'export') return 'Export';
  if (tabId === 'import') return 'Import';
  return '';
};

const View = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const user = useRecoilValue(userState);
  const personFieldsIncludingCustomFields = useRecoilValue(personFieldsIncludingCustomFieldsSelector);
  const fieldsPersonsCustomizableOptions = useRecoilValue(fieldsPersonsCustomizableOptionsSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);

  const medicalFiles = useRecoilValue(medicalFileState);
  const territoryObservations = useRecoilValue(territoryObservationsState);
  const persons = useRecoilValue(personsState);
  const preparePersonForEncryption = usePreparePersonForEncryption();

  const API = useApi();
  const [tab, setTab] = useState(!organisation.encryptionEnabled ? 'encryption' : 'infos');
  const scrollContainer = useRef(null);
  useTitle(`Organisation - ${getSettingTitle(tab)}`);

  const updateOrganisation = async () => {
    // we update the organisation on each tab change to mitigate
    // to mitigate the sync problem between all the users of an organisation

    const { user } = await API.get({ path: '/user/signin-token' });
    if (user) {
      setOrganisation(user.organisation);
    }
  };

  useEffect(() => {
    scrollContainer.current.scrollTo({ top: 0 });
    updateOrganisation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onEditPersonsCustomInputChoice =
    (customFieldsRow) =>
    async ({ oldChoice, newChoice, field, fields }) => {
      const updatedPersons = persons
        .map((person) => {
          if (person[field.name]?.includes(oldChoice)) {
            return {
              ...person,
              [field.name]:
                typeof person[field.name] === 'string'
                  ? newChoice
                  : person[field.name].map((_choice) => (_choice === oldChoice ? newChoice : _choice)),
            };
          }
          return null;
        })
        .filter(Boolean);
      const response = await API.post({
        path: '/custom-field',
        body: {
          customFields: {
            [customFieldsRow]: fields,
          },
          persons: await Promise.all(updatedPersons.map(preparePersonForEncryption).map(encryptItem(hashedOrgEncryptionKey))),
        },
      });
      if (response.ok) {
        console.log(response.data);
        toast.success('Choix mis à jour !');
        setOrganisation(response.data);
      }
    };

  return (
    <div className="tw--m-12 tw--mt-4 tw-flex tw-h-[calc(100%+4rem)] tw-flex-col">
      <h2 className="tw-m-0 tw-border-b tw-border-b-gray-300 tw-bg-main tw-bg-opacity-10 tw-p-4 tw-text-2xl">
        Configuration de l'organisation {organisation.name}
      </h2>
      <div className="tw-flex tw-flex-1 tw-overflow-hidden">
        <nav
          className="tw-flex tw-h-full tw-w-52 tw-shrink-0 tw-flex-col tw-items-start tw-bg-main  tw-bg-opacity-10 tw-pt-5 tw-pl-2.5"
          title="Navigation dans la configuration de l'organisation">
          <button
            className={['tw-my-0.5 tw-p-0 tw-text-sm tw-font-semibold', tab === 'infos' ? 'tw-text-main' : 'tw-text-zinc-600'].join(' ')}
            onClick={() => setTab('infos')}>
            Infos
          </button>
          <button
            className={['tw-my-0.5 tw-p-0 tw-text-sm tw-font-semibold', tab === 'encryption' ? 'tw-text-main' : 'tw-text-zinc-600'].join(' ')}
            onClick={() => setTab('encryption')}>
            Chiffrement
          </button>
          <hr />
          <button
            className={['tw-my-0.5 tw-p-0 tw-text-sm tw-font-semibold', tab === 'reception' ? 'tw-text-main' : 'tw-text-zinc-600'].join(' ')}
            onClick={() => setTab('reception')}>
            Accueil de jour
          </button>
          <button
            className={['tw-my-0.5 tw-p-0 tw-text-sm tw-font-semibold', tab === 'persons' ? 'tw-text-main' : 'tw-text-zinc-600'].join(' ')}
            onClick={() => setTab('persons')}
            disabled={!organisation.encryptionEnabled}>
            Personnes suivies
          </button>
          <button
            className={['tw-my-0.5 tw-p-0 tw-text-sm tw-font-semibold', tab === 'medicalFile' ? 'tw-text-main' : 'tw-text-zinc-600'].join(' ')}
            onClick={() => setTab('medicalFile')}>
            Dossier Médical 🧑‍⚕️
          </button>
          <button
            className={['tw-my-0.5 tw-p-0 tw-text-sm tw-font-semibold', tab === 'consultations' ? 'tw-text-main' : 'tw-text-zinc-600'].join(' ')}
            onClick={() => setTab('consultations')}>
            Consultations 🧑‍⚕️
          </button>

          <button
            className={['tw-my-0.5 tw-p-0 tw-text-sm tw-font-semibold', tab === 'actions' ? 'tw-text-main' : 'tw-text-zinc-600'].join(' ')}
            onClick={() => setTab('actions')}>
            Actions
          </button>
          <button
            className={['tw-my-0.5 tw-p-0 tw-text-sm tw-font-semibold', tab === 'territories' ? 'tw-text-main' : 'tw-text-zinc-600'].join(' ')}
            onClick={() => setTab('territories')}
            disabled={!organisation.encryptionEnabled}>
            Territoires
          </button>
          <hr />
          <button
            className={['tw-my-0.5 tw-p-0 tw-text-sm tw-font-semibold', tab === 'export' ? 'tw-text-main' : 'tw-text-zinc-600'].join(' ')}
            onClick={() => setTab('export')}>
            Export
          </button>
          <button
            className={['tw-my-0.5 tw-p-0 tw-text-sm tw-font-semibold', tab === 'import' ? 'tw-text-main' : 'tw-text-zinc-600'].join(' ')}
            onClick={() => setTab('import')}>
            Import
          </button>
        </nav>
        <div ref={scrollContainer} className="tw-basis-full tw-overflow-auto tw-py-4 tw-px-6">
          <Formik
            initialValues={{
              ...organisation,
              receptionEnabled: organisation.receptionEnabled || false,
              groupsEnabled: organisation.groupsEnabled || false,
            }}
            enableReinitialize
            onSubmit={async (body) => {
              try {
                const response = await API.put({ path: `/organisation/${organisation._id}`, body });
                if (response.ok) {
                  toast.success('Mise à jour !');
                  setOrganisation(response.data);
                }
              } catch (orgUpdateError) {
                console.log('error in updating organisation', orgUpdateError);
                toast.error(orgUpdateError.message);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => {
              switch (tab) {
                default:
                case 'infos':
                  return (
                    <>
                      <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Informations générales</h3>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label htmlFor="name">Nom</Label>
                            <Input name="name" id="name" value={values.name} onChange={handleChange} />
                          </FormGroup>
                        </Col>
                      </Row>
                      <div className="tw-mb-10 tw-flex tw-justify-end tw-gap-4">
                        <DeleteButtonAndConfirmModal
                          title={`Voulez-vous vraiment supprimer l'organisation ${organisation.name}`}
                          textToConfirm={organisation.name}
                          onConfirm={async () => {
                            try {
                              const res = await API.delete({ path: `/organisation/${organisation._id}` });
                              if (res.ok) {
                                toast.success('Organisation supprimée');
                                API.logout();
                              }
                            } catch (organisationDeleteError) {
                              capture(organisationDeleteError, { extra: { organisation }, user });
                              toast.error(organisationDeleteError.message);
                            }
                          }}>
                          <span className="tw-mb-7 tw-block tw-w-full tw-text-center">
                            Cette opération est irréversible
                            <br />
                            et entrainera la suppression définitive de toutes les données liées à l'organisation&nbsp;:
                            <br />
                            équipes, utilisateurs, personnes suivies, actions, territoires, commentaires et observations, comptes-rendus...
                          </span>
                        </DeleteButtonAndConfirmModal>
                        <ButtonCustom title="Mettre à jour" loading={isSubmitting} onClick={handleSubmit} />
                      </div>
                    </>
                  );
                case 'encryption':
                  return (
                    <>
                      <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Chiffrement</h3>
                      <div className="tw-mb-10 tw-flex tw-justify-around">
                        <EncryptionKey isMain />
                      </div>
                    </>
                  );
                case 'consultations':
                  return <Consultations organisation={values} handleChange={handleChange} handleSubmit={handleSubmit} isSubmitting={isSubmitting} />;
                case 'medicalFile':
                  return (
                    <>
                      <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Dossier Médical</h3>
                      {organisation.encryptionEnabled ? (
                        <>
                          <p>
                            Disponible pour les professionnels de santé 🧑‍⚕️ seulement dans l'onglet <b>Dossier médical</b> d'une personne suivie
                          </p>
                          <hr />
                          <Row>
                            <Label>Champs personnalisés</Label>
                            <TableCustomFields
                              data={medicalFiles}
                              customFields="customFieldsMedicalFile"
                              key="customFieldsMedicalFile"
                              fields={customFieldsMedicalFile}
                            />
                          </Row>
                        </>
                      ) : (
                        <>
                          <Row>
                            <Col md={10}>
                              <p>
                                Désolé, cette fonctionnalité qui consiste à personnaliser les champs disponibles pour le dossier médical des personnes
                                suivies n'existe que pour les organisations chiffrées.
                              </p>
                            </Col>
                          </Row>
                          <div className="tw-mb-10 tw-flex tw-justify-end">
                            <EncryptionKey />
                          </div>
                        </>
                      )}
                    </>
                  );
                case 'actions':
                  return <ActionCategoriesSettings />;
                case 'reception':
                  return (
                    <>
                      <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Accueil de jour</h3>
                      <div className="tw-flex tw-flex-col">
                        <FormGroup>
                          <div className="tw-ml-5 tw-flex tw-w-4/5 tw-items-baseline">
                            <input
                              type="checkbox"
                              className="tw-mr-2"
                              name="receptionEnabled"
                              id="receptionEnabled"
                              checked={values.receptionEnabled || false}
                              onChange={handleChange}
                            />
                            <label htmlFor="receptionEnabled">Activer l'accueil de jour</label>
                          </div>
                        </FormGroup>
                        <div className="tw-mb-10 tw-flex tw-justify-end tw-gap-4">
                          <ButtonCustom
                            title={'Mettre à jour'}
                            disabled={values.receptionEnabled === organisation.receptionEnabled}
                            loading={isSubmitting}
                            onClick={handleSubmit}
                          />
                        </div>
                        <hr />
                        <ServicesSettings />
                      </div>
                    </>
                  );
                case 'territories':
                  return (
                    <>
                      <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Territoires</h3>
                      {organisation.encryptionEnabled ? (
                        <>
                          <Label>Champs personnalisés</Label>
                          <TableCustomFields
                            customFields="customFieldsObs"
                            key="customFieldsObs"
                            data={territoryObservations}
                            fields={(() => {
                              if (Array.isArray(organisation.customFieldsObs)) return organisation.customFieldsObs;
                              return defaultCustomFields;
                            })()}
                          />
                        </>
                      ) : (
                        <>
                          <Row>
                            <Col md={10}>
                              <p>
                                Désolé, cette fonctionnalité qui consiste à personnaliser les champs disponibles pour les observations de territoires
                                n'existe que pour les organisations chiffrées.
                              </p>
                            </Col>
                          </Row>
                          <div className="tw-mb-10 tw-flex tw-justify-end">
                            <EncryptionKey />
                          </div>
                        </>
                      )}
                    </>
                  );
                case 'persons':
                  return (
                    <>
                      <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Personnes suivies</h3>
                      {organisation.encryptionEnabled ? (
                        <>
                          <h4 className="tw-my-8">Activer la fonctionnalité Liens familiaux</h4>
                          <FormGroup>
                            <div className="tw-ml-5 tw-flex tw-w-4/5 tw-items-baseline">
                              <input
                                type="checkbox"
                                name="groupsEnabled"
                                className="tw-mr-2"
                                id="groupsEnabled"
                                checked={values.groupsEnabled || false}
                                onChange={handleChange}
                              />
                              <label htmlFor="groupsEnabled">
                                Activer la possibilité d'ajouter des liens familiaux entre personnes. Un onglet "Famille" sera rajouté dans les
                                personnes, et vous pourrez créer des actions, des commentaires et des documents visibles pour toute la famille.
                              </label>
                            </div>
                          </FormGroup>
                          <div className="tw-mb-10 tw-flex tw-justify-end tw-gap-4">
                            <ButtonCustom
                              title={'Mettre à jour'}
                              disabled={values.groupsEnabled === organisation.groupsEnabled}
                              loading={isSubmitting}
                              onClick={handleSubmit}
                            />
                          </div>
                          <h4 className="tw-my-8">Champs permanents - options modulables</h4>
                          <TableCustomFields
                            customFields="fieldsPersonsCustomizableOptions"
                            key="fieldsPersonsCustomizableOptions"
                            data={persons}
                            fields={fieldsPersonsCustomizableOptions}
                            onlyOptionsEditable
                            onEditChoice={onEditPersonsCustomInputChoice('fieldsPersonsCustomizableOptions')}
                          />
                          <h4 className="tw-my-8">Champs personnalisés - informations sociales</h4>
                          <TableCustomFields
                            customFields="customFieldsPersonsSocial"
                            key="customFieldsPersonsSocial"
                            data={persons}
                            fields={customFieldsPersonsSocial}
                            onEditChoice={onEditPersonsCustomInputChoice('customFieldsPersonsSocial')}
                          />
                          <h4 className="tw-my-8">Champs personnalisés - informations médicales</h4>
                          <TableCustomFields
                            customFields="customFieldsPersonsMedical"
                            key="customFieldsPersonsMedical"
                            data={persons}
                            fields={customFieldsPersonsMedical}
                            onEditChoice={onEditPersonsCustomInputChoice('customFieldsPersonsMedical')}
                          />
                        </>
                      ) : (
                        <>
                          <Row>
                            <Col md={10}>
                              <p>
                                Désolé, cette fonctionnalité qui consiste à personnaliser les champs disponibles pour les personnes suivies n'existe
                                que pour les organisations chiffrées.
                              </p>
                            </Col>
                          </Row>
                          <div className="tw-mb-10 tw-flex tw-justify-end">
                            <EncryptionKey />
                          </div>
                        </>
                      )}
                    </>
                  );
                case 'export':
                  return (
                    <>
                      <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Exporter des données</h3>
                      <Row>
                        <Col md={10}>
                          <p>Vous pouvez exporter l'ensemble de vos données dans un fichier Excel.</p>
                        </Col>
                      </Row>
                      <div className="tw-mb-10 tw-flex tw-justify-end">
                        <ExportData />
                      </div>
                    </>
                  );
                case 'import':
                  return (
                    <>
                      <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Importer des personnes suivies</h3>
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
                              <table className="table-sm table" style={{ fontSize: '14px', marginTop: '2rem' }}>
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
                      <div className="tw-mb-10 tw-flex tw-justify-end tw-gap-4">
                        <DownloadExample />
                        <ImportData />
                      </div>
                    </>
                  );
              }
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
};

function Consultations({ handleChange, isSubmitting, handleSubmit }) {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const [orgConsultations, setOrgConsultations] = useState([]);
  const allConsultations = useRecoilValue(consultationsState);

  const { refresh } = useDataLoader();
  const API = useApi();
  const consultationsSortable = useMemo(() => orgConsultations.map((e) => e.name), [orgConsultations]);
  useEffect(() => {
    setOrgConsultations(organisation.consultations);
  }, [organisation, setOrgConsultations]);
  const consultations = useRecoilValue(consultationsState);

  return (
    <>
      <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">Consultations</h3>
      <p>
        Disponible pour les professionnels de santé 🧑‍⚕️ seulement dans l'onglet <b>Dossier médical</b> d'une personne suivie
      </p>
      <hr />

      <h4 className="tw-my-8">Configuration du type de consultation</h4>

      <FormGroup>
        <Label htmlFor="consultations">Types de consultations</Label>

        <SortableGrid
          list={consultationsSortable}
          key={JSON.stringify(orgConsultations)}
          editItemTitle="Changer le nom du type de consultation"
          onUpdateList={(list) => {
            const newConsultations = [];
            for (const item of list) {
              const consultation = orgConsultations.find((e) => e.name === item);
              if (consultation) newConsultations.push(consultation);
              else newConsultations.push({ name: item, fields: [] });
            }
            setOrgConsultations(newConsultations);
          }}
          onRemoveItem={(content) => {
            setOrgConsultations(orgConsultations.filter((e) => e.name !== content));
          }}
          onEditItem={async ({ content, newContent }) => {
            if (!newContent) {
              toast.error('Vous devez saisir un nom pour le type de consultation');
              return;
            }
            const newConsultations = orgConsultations.map((e) => (e.name === content ? { ...e, name: newContent } : e));
            setOrgConsultations(newConsultations);
            const encryptedConsultations = await Promise.all(
              allConsultations
                .filter((consultation) => consultation.type === content)
                .map((consultation) => ({ ...consultation, type: newContent }))
                .map(prepareConsultationForEncryption(newConsultations))
                .map(encryptItem(hashedOrgEncryptionKey))
            );
            const response = await API.put({
              path: '/consultation/model',
              body: {
                organisationsConsultations: newConsultations,
                consultations: encryptedConsultations,
              },
            });
            if (response.ok) {
              refresh();
              handleChange({ target: { value: orgConsultations, name: 'consultations' } });
              setOrganisation({ ...organisation, consultations: newConsultations });
              toast.success("Consultation mise à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
            } else {
              toast.error("Une erreur inattendue est survenue, l'équipe technique a été prévenue. Désolé !");
            }
          }}
        />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="select-consultations">Ajouter un type de consultation</Label>
        <SelectCustom
          key={JSON.stringify(consultationsSortable || [])}
          creatable
          inputId="select-consultations"
          options={consultationTypes
            .filter((cat) => !consultationsSortable.includes(cat))
            .sort((c1, c2) => c1.localeCompare(c2))
            .map((cat) => ({ value: cat, label: cat }))}
          value={null}
          onChange={(cat) => {
            if (cat && cat.value) {
              setOrgConsultations([...orgConsultations, { name: cat.value, fields: [] }]);
            }
          }}
          onCreateOption={async (name) => {
            setOrgConsultations([...orgConsultations, { name, fields: [] }]);
          }}
          isClearable
        />
      </FormGroup>
      <div className="tw-mb-8 tw-mt-4 tw-flex tw-justify-end tw-gap-4">
        <ButtonCustom
          title="Mettre à jour"
          loading={isSubmitting}
          disabled={JSON.stringify(organisation.consultations) === JSON.stringify(orgConsultations)}
          onClick={() => {
            handleChange({ target: { value: orgConsultations, name: 'consultations' } });
            handleSubmit();
          }}
        />
      </div>
      <hr />
      <h4 className="tw-my-8">Champs personnalisés des consultations</h4>
      {organisation.consultations.map((consultation) => {
        return (
          <div key={consultation.name}>
            <h5 className="tw-mt-8">{consultation.name}</h5>

            <small>
              Vous pouvez personnaliser les champs disponibles pour les consultations de type <strong>{consultation.name}</strong>.
            </small>
            <TableCustomFields
              customFields="consultations"
              data={consultations}
              keyPrefix={consultation.name}
              mergeData={(newData) => {
                return organisation.consultations.map((e) => (e.name === consultation.name ? { ...e, fields: newData } : e));
              }}
              extractData={(data) => {
                return data.find((e) => e.name === consultation.name).fields || [];
              }}
              fields={(() => {
                return Array.isArray(consultation.fields) ? consultation.fields : [];
              })()}
            />
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

export default View;
