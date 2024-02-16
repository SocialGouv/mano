import { MutableRefObject, useRef, useState } from 'react';
import { utils, read, writeFile, WorkBook } from 'xlsx';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import ButtonCustom from '../../components/ButtonCustom';
import { customFieldsPersonsSelector } from '../../recoil/persons';
import { newCustomField, typeOptions } from '../../utils';
import { customFieldsMedicalFileSelector } from '../../recoil/medicalFiles';
import { organisationState } from '../../recoil/auth';
import { customFieldsObsSelector } from '../../recoil/territoryObservations';
import { servicesSelector } from '../../recoil/reports';
import { actionsCategoriesSelector } from '../../recoil/actions';
import API from '../../services/api';
import { OrganisationInstance } from '../../types/organisation';
import { CustomField, CustomFieldsGroup, FieldType } from '../../types/field';

const ExcelParser = ({ scrollContainer }: { scrollContainer: MutableRefObject<HTMLDivElement> }) => {
  const fileDialogRef = useRef<HTMLInputElement>(null);
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [reloadKey, setReloadKey] = useState(0); // because input type 'file' doesn't trigger 'onChange' for uploading twice the same file

  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const groupedServices = useRecoilValue(servicesSelector);
  const actionsGroupedCategories = useRecoilValue(actionsCategoriesSelector);
  const consultationFields = organisation!.consultations;

  const verifyFile = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      setReloadKey((k) => k + 1);

      if (!evt.target || !evt.target.result) {
        alert('Erreur lors de la lecture du fichier');
        return;
      }

      const bstr = evt.target.result;
      const workbook = read(bstr, { type: 'binary' });

      const data = processConfigWorkbook(workbook);
      setWorkbookData(data);
      scrollContainer.current.scrollTo({ top: 0 });
    };

    reader.readAsBinaryString(file);
  };

  async function handleImport() {
    if (!workbookData || !organisation) return;
    // Update organisation
    const updatedOrganisation = getUpdatedOrganisationFromWorkbookData(organisation, workbookData);
    try {
      const response = await API.put({ path: `/organisation/${organisation._id}`, body: updatedOrganisation });
      if (response.ok) {
        toast.success("L'organisation a été mise à jour !");
        setWorkbookData(null);
        setOrganisation(response.data);
      }
    } catch (orgUpdateError) {
      console.log('error in updating organisation', orgUpdateError);
      toast.error((orgUpdateError as any)?.message || "Erreur lors de l'import");
    }
  }

  const workbookHasErrors = workbookData && Object.values(workbookData).some((sheet) => sheet.errors.length > 0 || sheet.globalErrors.length > 0);

  return (
    <div>
      {!workbookData ? (
        <>
          <p>
            Vous pouvez importer une configuration complète depuis un fichier Excel en téléchargeant la configuration actuelle et en la modifiant.{' '}
            <b>Il est recommandé de faire cette opération en début de paramétrage sur une organisation vide</b>. En cliquant sur importer, vous
            visualizerez les données qui seront importées dans un deuxième temps, et les erreurs qui ont été trouvées. Cela permet de contrôler que
            tout est correct avant de valider. Si vous n'avez pas d'erreur, vous pouvez ensuite cliquer sur le bouton "Valider l'import" à l'étape
            suivante. Les champs attendus sont les suivants:
          </p>
          <table className="table-sm table" style={{ fontSize: '14px', marginTop: '2rem' }}>
            <thead>
              <tr>
                <th>Feuille</th>
                <th>Colonne</th>
                <th className="tw-max-w-sm">Valeur</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(workbookColumns).map(([sheetName, columns]) => {
                return columns.map((col, i) => (
                  <tr key={i}>
                    <td>{sheetName}</td>
                    <td>{col}</td>
                    <td>{col === 'Choix' ? <code className="tw-whitespace-pre">{typeOptionsLabels.join('\n')}</code> : 'Texte'}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
          <div className="tw-mb-10 tw-flex tw-justify-end tw-gap-4">
            <ButtonCustom
              onClick={() => {
                const workbook = utils.book_new();

                // Création de chaque onglet
                utils.book_append_sheet(
                  workbook,
                  utils.aoa_to_sheet([
                    ['Rubrique', 'Intitulé du champ', 'Type de champ', 'Choix'],
                    ...customFieldsPersons.reduce((acc, curr) => {
                      return [
                        ...acc,
                        ...curr.fields.map((e) => [
                          curr.name,
                          e.label,
                          typeOptions.find((t) => t.value === e.type)!.label,
                          (e.options || []).join(','),
                        ]),
                      ];
                    }, [] as string[][]),
                  ]),
                  'Infos social et médical'
                );

                utils.book_append_sheet(
                  workbook,
                  utils.aoa_to_sheet([
                    ['Intitulé du champ', 'Type de champ', 'Choix'],
                    ...customFieldsMedicalFile.map((e) => [e.label, typeOptions.find((t) => t.value === e.type)!.label, (e.options || []).join(',')]),
                  ]),
                  'Dossier médical'
                );

                utils.book_append_sheet(
                  workbook,
                  utils.aoa_to_sheet([
                    ['Consultation type pour', 'Intitulé du champ', 'Type de champ', 'Choix'],
                    ...consultationFields.reduce((acc, curr) => {
                      return [
                        ...acc,
                        ...curr.fields.map((e) => [
                          curr.name,
                          e.label,
                          typeOptions.find((t) => t.value === e.type)!.label,
                          (e.options || []).join(','),
                        ]),
                      ];
                    }, [] as string[][]),
                  ]),
                  'Consultation'
                );

                utils.book_append_sheet(
                  workbook,
                  utils.aoa_to_sheet([
                    ['Intitulé du champ', 'Type de champ', 'Choix'],
                    ...customFieldsObs.map((e) => [e.label, typeOptions.find((t) => t.value === e.type)!.label, (e.options || []).join(',')]),
                  ]),
                  'Observation de territoire'
                );

                utils.book_append_sheet(
                  workbook,
                  utils.aoa_to_sheet([
                    ['Liste des services', 'Groupe'],
                    ...groupedServices.reduce((acc, curr) => {
                      return [...acc, ...curr.services.map((e: string) => [e, curr.groupTitle])];
                    }, [] as string[][]),
                  ]),
                  'Liste des services'
                );

                utils.book_append_sheet(
                  workbook,
                  utils.aoa_to_sheet([
                    ["Liste des catégories d'action", "Groupe d'action"],
                    ...actionsGroupedCategories.reduce((acc, curr) => {
                      return [...acc, ...curr.categories.map((e: string) => [e, curr.groupTitle])];
                    }, [] as string[][]),
                  ]),
                  'Catégories d action'
                );

                // Écriture du fichier XLSX
                writeFile(workbook, 'data.xlsx');
              }}
              color="primary"
              title="Télécharger la configuration actuelle"
              padding="12px 24px"
            />
            <ButtonCustom onClick={() => fileDialogRef.current?.click()} color="primary" title="Importer un fichier .xlsx" padding="12px 24px" />
            <input
              ref={fileDialogRef}
              key={reloadKey}
              type="file"
              id="fileDialog"
              accept="csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ display: 'none' }}
              onChange={verifyFile}
            />
          </div>
        </>
      ) : (
        <div>
          <div className="tw-mb-8 tw-border-l-4 tw-border-blue-500 tw-bg-blue-100 tw-p-4 tw-text-blue-700" role="alert">
            Le fichier a été analysé. Relisez attentivement le compte rendu pour vérifier que c'est bien ce qui est attendu. Quand tout vous semble
            bon, cliquez sur le bouton "Valider l'import" en bas (pas de retour arrière possible).
          </div>
          {Object.entries(workbookData).map(([sheetName, { data, globalErrors, errors }]) => (
            <div key={sheetName}>
              <h4 className="tw-mt-10 tw-mb-4 tw-flex tw-justify-between tw-text-lg tw-font-bold">{sheetName}</h4>
              {!globalErrors.length && !errors.length && data.length > 0 && (
                <div className="tw-mb-8 tw-border-l-4 tw-border-green-500 tw-bg-green-100 tw-p-4 tw-text-green-700" role="alert">
                  Bonne nouvelle, aucune erreur n'a été trouvée ; relisez quand même !
                </div>
              )}
              {!globalErrors.length && errors.length > 0 && data.length > 0 && (
                <div className="tw-mb-8 tw-border-l-4 tw-border-orange-500 tw-bg-orange-100 tw-p-4 tw-text-orange-700" role="alert">
                  Plusieurs erreurs ont été trouvées, relisez attentivement les lignes suivantes.
                </div>
              )}
              {globalErrors.length > 0 && (
                <div className="tw-mb-8 tw-border-l-4 tw-border-red-500 tw-bg-red-100 tw-p-4 tw-text-red-700" role="alert">
                  {globalErrors.map((error, i) => (
                    <div key={i}>{error}</div>
                  ))}
                </div>
              )}
              {data.length > 0 ? (
                <div className="tw-my-8">
                  <table className="tw-w-full">
                    <thead>
                      <tr className="tw-border-b">
                        {['#', 'Statut', ...workbookColumns[sheetName as SheetName]].map((col) => (
                          <th className="tw-bg-slate-50 tw-py-2 tw-px-4 tw-text-sm tw-font-normal" key={col}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="tw-text-sm">
                      {data.map((row, i) => (
                        <tr key={i} className="tw-border-b tw-border-slate-200">
                          <td className="tw-py-2 tw-px-4">{i + 1}</td>
                          <td className="tw-py-2 tw-px-4 tw-font-bold">
                            {errors.some((error) => error.line === i) ? (
                              <span className="tw-text-red-600">Erreur</span>
                            ) : (
                              <span className="tw-text-green-600">Valide</span>
                            )}
                          </td>
                          {Object.values(row).map((value, j) => (
                            <td className="tw-py-2 tw-px-4" key={j}>
                              {Array.isArray(value)
                                ? value.map((v) => (
                                    <div key={v} className="tw-text-xs">
                                      {v}
                                    </div>
                                  ))
                                : value
                                ? String(value)
                                : ''}
                              {errors.some((error) => error.line === i && error.col === j) && (
                                <div className="tw-italic tw-text-red-600">
                                  {errors.find((error) => error.line === i && error.col === j)?.message}
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                !globalErrors.length && (
                  <div className="tw-mb-8 tw-border-l-4 tw-border-orange-500 tw-bg-orange-100 tw-p-4 tw-text-orange-700" role="alert">
                    Aucune donnée n'a été trouvée, cela signifie que rien ne sera modifié.
                  </div>
                )
              )}
            </div>
          ))}
          <div className="tw-mt-8 tw-flex tw-justify-end tw-gap-4">
            {!workbookHasErrors ? (
              <ButtonCustom onClick={() => handleImport()} color="primary" title="Valider l'import" padding="12px 24px" />
            ) : (
              <ButtonCustom onClick={() => setWorkbookData(null)} color="secondary" title="Annuler, recommencer" padding="12px 24px" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const typeOptionsLabels = [
  'Texte',
  'Zone de texte multi-lignes',
  'Nombre',
  'Date sans heure',
  'Date avec heure',
  'Oui/Non',
  'Choix dans une liste',
  'Choix multiple dans une liste',
  'Case à cocher',
] as const;
type TypeOptionLabel = typeof typeOptionsLabels[number];

function isTypeOptionLabel(type: string): type is TypeOptionLabel {
  return typeOptionsLabels.includes(type as any);
}

function toFieldType(label: TypeOptionLabel): FieldType {
  const item = typeOptions.find((t) => t.label === label);
  return (item ? item.value : 'text') as FieldType;
}

function requiresOptions(type: TypeOptionLabel): boolean {
  return ['Choix dans une liste', 'Choix multiple dans une liste'].includes(type);
}

const sheetNames = [
  'Infos social et médical',
  'Dossier médical',
  'Consultation',
  'Observation de territoire',
  'Liste des services',
  'Catégories d action',
] as const;
type SheetName = typeof sheetNames[number];

const workbookColumns: Record<SheetName, string[]> = {
  'Infos social et médical': ['Rubrique', 'Intitulé du champ', 'Type de champ', 'Choix'],
  'Dossier médical': ['Intitulé du champ', 'Type de champ', 'Choix'],
  Consultation: ['Consultation type pour', 'Intitulé du champ', 'Type de champ', 'Choix'],
  'Observation de territoire': ['Intitulé du champ', 'Type de champ', 'Choix'],
  'Liste des services': ['Liste des services', 'Groupe'],
  'Catégories d action': ["Liste des catégories d'action", "Groupe d'action"],
};

type WorkbookData = Record<
  SheetName,
  {
    data: Record<string, string | string[]>[];
    globalErrors: string[];
    errors: { line: number; col: number; message: string }[];
  }
>;

function trimAllValues<R extends Record<string, string | string[]>>(obj: R): R {
  if (typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      Array.isArray(v) ? v.map((s) => (typeof s === 'string' ? s.trim() : s)) : typeof v === 'string' ? v.trim() : v,
    ])
  ) as R;
}

// Parse le fichier Excel et retourne un objet contenant les données et les erreurs
function processConfigWorkbook(workbook: WorkBook): WorkbookData {
  const data: WorkbookData = sheetNames.reduce((acc, sheetName) => {
    return { ...acc, [sheetName]: { data: [], globalErrors: [], errors: [] } };
  }, {} as WorkbookData);
  for (const sheetName of sheetNames) {
    if (!workbook.SheetNames.includes(sheetName)) {
      data[sheetName].globalErrors.push(`La feuille ${sheetName} est manquante`);
      continue;
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = utils
      .sheet_to_json<string[]>(sheet, { header: 1 })
      .filter((row) => row.length > 0 && row.some((cell) => cell !== undefined && cell !== null && cell !== ''));
    for (const col of workbookColumns[sheetName]) {
      if (!rows[0].includes(col)) data[sheetName].globalErrors.push(`La colonne ${col} est manquante`);
    }
    if (data[sheetName].globalErrors.length > 0) continue;

    const rowsWithoutHeader = rows.slice(1);
    for (const key in rowsWithoutHeader) {
      const row = rowsWithoutHeader[key];
      if (sheetName === 'Infos social et médical') {
        const [rubrique, intitule, type, choix] = row;
        if (!rubrique) data[sheetName].errors.push({ line: parseInt(key), col: 0, message: `La rubrique est manquante` });
        if (!intitule) data[sheetName].errors.push({ line: parseInt(key), col: 1, message: `L'intitulé du champ est manquant` });
        if (!type) data[sheetName].errors.push({ line: parseInt(key), col: 2, message: `Le type de champ est manquant` });
        if (requiresOptions(type as TypeOptionLabel) && !choix)
          data[sheetName].errors.push({ line: parseInt(key), col: 3, message: `Les choix sont manquants` });
        if (!isTypeOptionLabel(type)) data[sheetName].errors.push({ line: parseInt(key), col: 2, message: `Le type ${type} n'existe pas` });
        data[sheetName].data.push(trimAllValues({ rubrique, intitule, type, choix: choix?.split(',') || [] }));
      }

      if (sheetName === 'Dossier médical') {
        const [intitule, type, choix] = row;
        if (!intitule) data[sheetName].errors.push({ line: parseInt(key), col: 0, message: `L'intitulé du champ est manquant` });
        if (!type) data[sheetName].errors.push({ line: parseInt(key), col: 1, message: `Le type de champ est manquant` });
        if (requiresOptions(type as TypeOptionLabel) && !choix)
          data[sheetName].errors.push({ line: parseInt(key), col: 2, message: `Les choix sont manquants` });
        if (!isTypeOptionLabel(type)) data[sheetName].errors.push({ line: parseInt(key), col: 1, message: `Le type ${type} n'existe pas` });
        data[sheetName].data.push(trimAllValues({ intitule, type, choix: choix?.split(',') || [] }));
      }

      if (sheetName === 'Consultation') {
        const [rubrique, intitule, type, choix] = row;
        if (!rubrique) data[sheetName].errors.push({ line: parseInt(key), col: 0, message: `La rubrique est manquante` });
        if (!intitule) data[sheetName].errors.push({ line: parseInt(key), col: 1, message: `L'intitulé du champ est manquant` });
        if (!type) data[sheetName].errors.push({ line: parseInt(key), col: 2, message: `Le type de champ est manquant` });
        if (requiresOptions(type as TypeOptionLabel) && !choix)
          data[sheetName].errors.push({ line: parseInt(key), col: 3, message: `Les choix sont manquants` });
        if (!isTypeOptionLabel(type)) data[sheetName].errors.push({ line: parseInt(key), col: 2, message: `Le type ${type} n'existe pas` });
        data[sheetName].data.push(trimAllValues({ rubrique, intitule, type, choix: choix?.split(',') || [] }));
      }

      if (sheetName === 'Observation de territoire') {
        const [intitule, type, choix] = row;
        if (!intitule) data[sheetName].errors.push({ line: parseInt(key), col: 0, message: `L'intitulé du champ est manquant` });
        if (!type) data[sheetName].errors.push({ line: parseInt(key), col: 1, message: `Le type de champ est manquant` });
        if (requiresOptions(type as TypeOptionLabel) && !choix)
          data[sheetName].errors.push({ line: parseInt(key), col: 2, message: `Les choix sont manquants` });
        if (!isTypeOptionLabel(type)) data[sheetName].errors.push({ line: parseInt(key), col: 1, message: `Le type ${type} n'existe pas` });
        data[sheetName].data.push(trimAllValues({ intitule, type, choix: choix?.split(',') || [] }));
      }

      if (sheetName === 'Liste des services') {
        const [service, groupe] = row;
        if (!service) data[sheetName].errors.push({ line: parseInt(key), col: 0, message: `Le nom du service est manquant` });
        if (!groupe) data[sheetName].errors.push({ line: parseInt(key), col: 1, message: `Le nom du groupe est manquant` });
        data[sheetName].data.push(trimAllValues({ service, groupe }));
      }

      if (sheetName === 'Catégories d action') {
        const [categorie, groupe] = row;
        if (!categorie) data[sheetName].errors.push({ line: parseInt(key), col: 0, message: `Le nom de la catégorie est manquant` });
        if (!groupe) data[sheetName].errors.push({ line: parseInt(key), col: 1, message: `Le nom du groupe est manquant` });
        data[sheetName].data.push(trimAllValues({ categorie, groupe }));
      }
    }
  }
  return data;
}

function mergerFieldWithPrevious(field: Partial<CustomField>, previousField?: CustomField): CustomField {
  return {
    ...(newCustomField() as CustomField),
    name: `custom-${new Date().toISOString().split('.').join('-').split(':').join('-')}-${uuidv4()}`,
    ...field,
    ...(previousField ? { enabled: previousField.enabled } : {}),
    ...(previousField ? { required: previousField.required } : {}),
    ...(previousField ? { showInStats: previousField.showInStats } : {}),
    ...(previousField ? { name: previousField.name } : {}),
  };
}

// Importe les données dans l'organisation
function getUpdatedOrganisationFromWorkbookData(organisation: OrganisationInstance, workbookData: WorkbookData): OrganisationInstance {
  const updatedOrganisation = { ...organisation };

  for (const sheetName of sheetNames) {
    const sheetData = workbookData[sheetName];
    if (sheetData.globalErrors.length > 0) continue;
    if (sheetName === 'Infos social et médical') {
      const customFields = sheetData.data.reduce((acc, curr) => {
        const rubrique = curr.rubrique as string;
        const intitule = curr.intitule as string;
        const type = curr.type as TypeOptionLabel;
        const options = curr.choix as string[];
        const rubriqueIndex = acc.findIndex((e) => e.name === rubrique);

        const previousOrganisationField = organisation.customFieldsPersons
          ?.find((e) => e.name === rubrique)
          ?.fields.find((f) => f.label === intitule);

        if (rubriqueIndex === -1) {
          acc.push({
            name: rubrique,
            fields: [mergerFieldWithPrevious({ label: intitule, type: toFieldType(type), options }, previousOrganisationField)],
          });
        } else {
          acc[rubriqueIndex].fields.push(
            mergerFieldWithPrevious(
              {
                label: intitule,
                type: toFieldType(type),
                options,
              },
              previousOrganisationField
            )
          );
        }
        return acc;
      }, [] as CustomFieldsGroup[]);
      if (customFields.length) updatedOrganisation.customFieldsPersons = customFields;
    }
    if (sheetName === 'Dossier médical') {
      const customFields = sheetData.data.reduce((acc, curr) => {
        const intitule = curr.intitule as string;
        const type = curr.type as TypeOptionLabel;
        const options = curr.choix as string[];
        const previousOrganisationField = organisation.customFieldsMedicalFile?.find((e) => e.label === intitule);
        acc.push(mergerFieldWithPrevious({ label: intitule, type: toFieldType(type), options }, previousOrganisationField));
        return acc;
      }, [] as CustomField[]);
      if (customFields.length) updatedOrganisation.customFieldsMedicalFile = customFields;
    }
    if (sheetName === 'Consultation') {
      const customFields = sheetData.data.reduce((acc, curr) => {
        const rubrique = curr.rubrique as string;
        const intitule = curr.intitule as string;
        const type = curr.type as TypeOptionLabel;
        const options = curr.choix as string[];
        const rubriqueIndex = acc.findIndex((e) => e.name === rubrique);

        const previousOrganisationField = organisation.consultations?.find((e) => e.name === rubrique)?.fields.find((f) => f.label === intitule);

        if (rubriqueIndex === -1) {
          acc.push({
            name: rubrique,
            fields: [mergerFieldWithPrevious({ label: intitule, type: toFieldType(type), options }, previousOrganisationField)],
          });
        } else {
          acc[rubriqueIndex].fields.push(
            mergerFieldWithPrevious(
              {
                label: intitule,
                type: toFieldType(type),
                options,
              },
              previousOrganisationField
            )
          );
        }
        return acc;
      }, [] as CustomFieldsGroup[]);
      if (customFields.length) updatedOrganisation.consultations = customFields;
    }

    if (sheetName === 'Observation de territoire') {
      const customFields = sheetData.data.reduce((acc, curr) => {
        const intitule = curr.intitule as string;
        const type = curr.type as TypeOptionLabel;
        const options = curr.choix as string[];
        const previousOrganisationField = organisation.customFieldsObs?.find((e) => e.label === intitule);
        acc.push(mergerFieldWithPrevious({ label: intitule, type: toFieldType(type), options }, previousOrganisationField));
        return acc;
      }, [] as CustomField[]);
      if (customFields.length) updatedOrganisation.customFieldsObs = customFields;
    }
    if (sheetName === 'Liste des services') {
      const services = sheetData.data.reduce((acc, curr) => {
        const service = curr.service as string;
        const groupe = curr.groupe as string;
        const groupeIndex = acc.findIndex((e) => e.groupTitle === groupe);

        if (groupeIndex === -1) {
          acc.push({ groupTitle: groupe, services: [service] });
        } else {
          acc[groupeIndex].services.push(service);
        }
        return acc;
      }, [] as { groupTitle: string; services: string[] }[]);
      if (services.length) updatedOrganisation.groupedServices = services;
    }
    if (sheetName === 'Catégories d action') {
      const categories = sheetData.data.reduce((acc, curr) => {
        const categorie = curr.categorie as string;
        const groupe = curr.groupe as string;
        const groupeIndex = acc.findIndex((e) => e.groupTitle === groupe);

        if (groupeIndex === -1) {
          acc.push({ groupTitle: groupe, categories: [categorie] });
        } else {
          acc[groupeIndex].categories.push(categorie);
        }
        return acc;
      }, [] as { groupTitle: string; categories: string[] }[]);
      if (categories.length) updatedOrganisation.actionsGroupedCategories = categories;
    }
  }
  return updatedOrganisation;
}

export default ExcelParser;
