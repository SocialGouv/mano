import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { read } from "@e965/xlsx";
import { useRecoilValue } from "recoil";
import { toast } from "react-toastify";
import { Modal, ModalBody, ModalHeader, Alert } from "reactstrap";
import ButtonCustom from "../../components/ButtonCustom";
import { teamsState, userState } from "../../recoil/auth";
import { isNullOrUndefined } from "../../utils";
import API, { tryFetchExpectOk } from "../../services/api";
import { formatDateWithFullMonth, now } from "../../services/date";
import { sanitizeFieldValueFromExcel } from "./importSanitizer";
import { useDataLoader } from "../../components/DataLoader";
import { encryptTerritory, territoriesFields } from "../../recoil/territory";

const importableFields = territoriesFields.filter((field) => field.importable);
const importableLabels = importableFields.map((f) => f.label);
const importableFieldsObjectByName = importableFields.reduce((acc, field) => {
  acc[field.name] = field;
  return acc;
}, {});

export default function ImportTerritories() {
  const user = useRecoilValue(userState);
  const fileDialogRef = useRef(null);
  const { refresh } = useDataLoader();
  const teams = useRecoilValue(teamsState);

  const [showImportSummary, setShowImportSummary] = useState(false);
  const [territoriesToImport, setTerritoriesToImport] = useState([]);
  const [importedFields, setImportedFields] = useState([]);
  const [ignoredFields, setIgnoredFields] = useState([]);
  const [reloadKey, setReloadKey] = useState(0); // because input type 'file' doesn't trigger 'onChange' for uploading twice the same file

  const onParseData = async (event) => {
    try {
      // if the user imports the same file twice, nothing happens
      if (!event.target?.files?.length) return; // probably cancel button
      const file = event.target.files[0];
      const data = await file.arrayBuffer();
      // See: https://stackoverflow.com/a/57802737/978690
      // I only took one part of the code, because we use "w" only.
      const workbook = read(data, { dateNF: "yyyy-mm-dd" });
      const { SheetNames, Sheets } = workbook;
      const territoriesSheetName = SheetNames.find((name) => name.toLocaleLowerCase().includes("territoire"));
      const territoriesSheet = Sheets[territoriesSheetName];
      /*
      something like that:
      !margins: {left: 1, right: 1, top: 1, bottom: 1, header: 0.25, …}
      !ref: "A1:AE569"
      A1: {t: 's', v: '_id', r: '<t>_id</t>', h: '_id', w: '_id'}
      A2: {t: 's', v: '49d536d7-4e7f-437e-ae09-5d429d52473d', r: '<t>49d536d7-4e7f-437e-ae09-5d429d52473d</t>', h: '49d536d7-4e7f-437e-ae09-5d429d52473d', w: '49d536d7-4e7f-437e-ae09-5d429d52473d'}
      A3: {t: 's', v: '98973577-4efb-44ad-92e1-61dc0bb792c0', r: '<t>98973577-4efb-44ad-92e1-61dc0bb792c0</t>', h: '98973577-4efb-44ad-92e1-61dc0bb792c0', w: '98973577-4efb-44ad-92e1-61dc0bb792c0'}
      A4: {t: 's', v: '15d01afe-e93c-4a69-8322-3c26124fc5be', r: '<t>15d01afe-e93c-4a69-8322-3c26124fc5be</t>', h: '15d01afe-e93c-4a69-8322-3c26124fc5be', w: '15d01afe-e93c-4a69-8322-3c26124fc5be'}
      A5: {t: 's', v: '5f723256-111f-470f-b297-4cbf81355569', r: '<t>5f723256-111f-470f-b297-4cbf81355569</t>', h: '5f723256-111f-470f-b297-4cbf81355569', w: '5f723256-111f-470f-b297-4cbf81355569'}
      A6: {t: 's', v: '9f419305-a49a-481c-b4dd-9e1e5623e718', r: '<t>9f419305-a49a-481c-b4dd-9e1e5623e718</t>', h: '9f419305-a49a-481c-b4dd-9e1e5623e718', w: '9f419305-a49a-481c-b4dd-9e1e5623e718'}
      A7: {t: 's', v: 'a462c3ec-fb9c-47db-9386-8b5e08fec7d3', r: '<t>a462c3ec-fb9c-47db-9386-8b5e08fec7d3</t>', h: 'a462c3ec-fb9c-47db-9386-8b5e08fec7d3', w: 'a462c3ec-fb9c-47db-9386-8b5e08fec7d3'}

      */
      const sheetCells = Object.keys(territoriesSheet);
      const headerCells = sheetCells.filter((cell) => cell.replace(/\D+/g, "") === "1"); // ['A1', 'B1'...]

      const fieldsToIgnore = headerCells
        .filter((headerKey) => !importableLabels.includes(territoriesSheet[headerKey].v))
        .map((headerKey) => territoriesSheet[headerKey].v?.trim()); // ['Un champ bidon', 'Un autre']
      setIgnoredFields(fieldsToIgnore);

      const headersCellsToImport = headerCells.filter((headerKey) => importableLabels.includes(territoriesSheet[headerKey].v?.trim()));
      const headerColumnsAndField = headersCellsToImport.map((cell) => {
        const column = cell.replace("1", ""); // ['A', 'B'...]
        const field = importableFields.find((f) => f.label === territoriesSheet[cell].v?.trim()); // { name: type: label: importable: options: }
        return [column, field];
      });
      setImportedFields(headersCellsToImport.map((headerKey) => territoriesSheet[headerKey].v?.trim()));
      const lastRow = parseInt(territoriesSheet["!ref"].split(":")[1].replace(/\D+/g, ""), 10);

      const nameField = importableFields.find((f) => f.name === "name");

      if (!headerColumnsAndField.find((e) => e[1]?.name === "name")) {
        toast.error(
          `La colonne "${nameField.label}" est requise. Vérifiez votre fichier pour vous assurer que cette colonne existe et est correctement nommée. Vous pouvez vérifier avec le fichier d'exemple que les colonnes sont bien identiques.`,
          { autoClose: 5000 }
        );
        setReloadKey((k) => k + 1);
        return;
      }

      const territories = [];
      for (let i = 2; i <= lastRow; i++) {
        const territory = {};
        for (const [column, field] of headerColumnsAndField) {
          if (!territoriesSheet[`${column}${i}`]) continue;
          const value = sanitizeFieldValueFromExcel(field, territoriesSheet[`${column}${i}`]);
          if (!isNullOrUndefined(value)) {
            if (importableFieldsObjectByName[field.name]) territory[field.name] = value;
            if (field.name === "assignedTeams" && value.length > 0) {
              territory[field.name] = value.map((teamName) => teams.find((team) => team.name === teamName)?._id).filter((a) => a);
            }
          }
        }
        if (Object.keys(territory).length) {
          territory._id = uuidv4();
          territory.user = user._id;
        }
        if (Object.keys(territory).length) {
          territory.description = `Données importées le ${formatDateWithFullMonth(now())}\n\n${territory.description || ""}`;
          if (!territory.name) {
            toast.error(`La colonne "${nameField.label}" ne doit pas être vide, vérifiez la ligne ${i} du fichier.`);
            setReloadKey((k) => k + 1);
            return;
          }
          territories.push(territory);
        }
      }

      const encryptedTerritories = await Promise.all(territories.map(encryptTerritory));
      setTerritoriesToImport(encryptedTerritories);
      setShowImportSummary(true);
    } catch (e) {
      console.log(e);
      toast.error("Désolé, nous n'avons pas pu lire votre fichier. Mais vous pouvez réssayer !");
    }
    setReloadKey((k) => k + 1);
  };

  const onImportData = async () => {
    if (window.confirm(`Voulez-vous vraiment importer ${territoriesToImport.length} territoires dans Mano ? Cette opération est irréversible.`)) {
      const [error] = await tryFetchExpectOk(async () => API.post({ path: "/territory/import", body: { territoriesToImport } }));
      if (!error) toast.success("Importation réussie !");
      refresh();
      setShowImportSummary(false);
    }
  };

  if (!["admin"].includes(user.role)) return null;

  return (
    <>
      <ButtonCustom onClick={() => fileDialogRef.current.click()} color="primary" title="Importer un fichier .xlsx" padding="12px 24px" />
      <input
        ref={fileDialogRef}
        key={reloadKey}
        type="file"
        id="fileDialog"
        accept="csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style={{ display: "none" }}
        onChange={onParseData}
      />
      <Modal isOpen={showImportSummary} toggle={() => setShowImportSummary(false)} size="lg" backdrop="static">
        <ModalHeader toggle={() => setShowImportSummary(false)}>Résumé de l'import de territoires</ModalHeader>
        <ModalBody>
          <p>
            Nombre de territoires à importer&nbsp;: <strong>{territoriesToImport.length}</strong>
          </p>
          <Alert color="warning">
            Vérifiez bien la liste des champs ci-dessous. S'il manque un champ (par exemple parce qu'une colonne ne contient pas le nom exact indiqué
            dans Mano), alors <strong>ce champ ne sera pas considéré</strong> et votre liste de territoires sera donc corrompue. Les corrections
            devront être effectuées à la main au cas par cas, ce qui peut être un peu long.
          </Alert>
          {Boolean(ignoredFields.length) && (
            <>
              <Alert color="danger">Certaines colonnes n'ont pas été trouvées dans Mano, consultez le détail ci-dessous.</Alert>
              <p>
                Les colonnes suivantes seront <strong>ignorées</strong> ({ignoredFields.length}) :<br />
                <small>
                  Ces colonnes sont présentes dans votre fichier mais n'ont pas de correspondance sur Mano, vérifiez votre fichier avant d'importer
                  (problèmes de majuscules, de caractères accentués, etc.)
                </small>
              </p>
            </>
          )}

          <ul>
            {ignoredFields.map((label, index) => (
              <li key={label + index}>
                <code>{label}</code>
              </li>
            ))}
          </ul>

          <p>
            Les colonnes suivantes seront <strong>importées</strong> ({importedFields.length}) :
          </p>
          <ul>
            {importedFields.map((label, index) => (
              <li key={label + index}>
                <code style={{ color: "black" }}>{label}</code>
              </li>
            ))}
          </ul>

          <ButtonCustom onClick={onImportData} color="primary" title="Importer" padding="12px 24px" />
        </ModalBody>
      </Modal>
    </>
  );
}
