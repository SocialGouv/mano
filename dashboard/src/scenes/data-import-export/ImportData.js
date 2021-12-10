/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useState } from 'react';
import XLSX from 'xlsx';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toastr } from 'react-redux-toastr';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

import ButtonCustom from '../../components/ButtonCustom';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
  usePersons,
} from '../../recoil/persons';
import { userState } from '../../recoil/auth';
import { isNullOrUndefined, toFrenchDate, typeOptions } from '../../utils';
import useApi, { encryptItem, hashedOrgEncryptionKey } from '../../services/api';

const ImportData = () => {
  const user = useRecoilValue(userState);
  const { personFieldsIncludingCustomFields } = usePersons();
  const fileDialogRef = useRef(null);
  const setAllPersons = useSetRecoilState(personsState);

  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);

  const API = useApi();

  const [showImportSummary, setShowImpotSummary] = useState(false);
  const [dataToImport, setDataToImport] = useState([]);
  const [importedFields, setImportedFields] = useState([]);
  const [ignoredFields, setIgnoredFields] = useState([]);
  const [reloadKey, setReloadKey] = useState(0); // because input type 'file' doesn't trigger 'onChange' for uploading twice the same file

  const importableFields = personFieldsIncludingCustomFields().filter((f) => f.importable);
  const importableLabels = importableFields.map((f) => f.label);

  const onParseData = async (event) => {
    try {
      // if the user imports the same file twice, nothing happens
      if (!event.target?.files?.length) return; // probably cancel button
      const file = event.target.files[0];
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const { SheetNames, Sheets } = workbook;
      const personsSheetName = SheetNames.find((name) => name.toLocaleLowerCase().includes('person'));
      const personsSheet = Sheets[personsSheetName];
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
      const sheetCells = Object.keys(personsSheet);
      const headerCells = sheetCells.filter((cell) => cell.replace(/\D+/g, '') === '1'); // ['A1', 'B1'...]

      const fieldsToIgnore = headerCells
        .filter((headerKey) => !importableLabels.includes(personsSheet[headerKey].v))
        .map((headerKey) => personsSheet[headerKey].v?.trim()); // ['Un champ bidon', 'Un autre']
      setIgnoredFields(fieldsToIgnore);

      const headersCellsToImport = headerCells.filter((headerKey) => importableLabels.includes(personsSheet[headerKey].v?.trim()));
      const headerColumnsAndFieldname = headersCellsToImport.map((cell) => {
        const column = cell.replace('1', ''); // ['A', 'B'...]
        const field = importableFields.find((f) => f.label === personsSheet[cell].v?.trim()); // { name: type: label: importable: options: }
        const fieldname = field.name; // 'name', 'gender', ...
        const type = typeOptions.find((typeOption) => typeOption.value === field.type); // { value: label: validator: }
        const validator = field.options ? type.validator(field.options) : type.validator;
        return [column, fieldname, validator];
      }); // [['C', 'name], ['D', birthdate]]
      setImportedFields(headersCellsToImport.map((headerKey) => personsSheet[headerKey].v?.trim()));

      // .replace(/[^a-zA-Z]+/g, '')
      const lastRow = parseInt(personsSheet['!ref'].split(':')[1].replace(/\D+/g, ''), 10);

      const persons = [];
      for (let i = 2; i <= lastRow; i++) {
        const person = {};
        for (const [column, fieldname, validator] of headerColumnsAndFieldname) {
          const value = validator(personsSheet[`${column}${i}`]?.v);
          if (!isNullOrUndefined(value)) person[fieldname] = value;
        }
        if (Object.keys(person).length) {
          person.description = `Données importées le ${toFrenchDate(new Date())}\n${person.description || ''}`;
          persons.push(person);
        }
      }

      if (hashedOrgEncryptionKey) {
        const encryptedPersons = await Promise.all(
          persons.map(preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)).map(encryptItem(hashedOrgEncryptionKey))
        );
        setDataToImport(encryptedPersons);
      } else {
        setDataToImport(
          persons.map(preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)).map((person) => {
            delete person.decrypted;
            return person;
          })
        );
      }
      setShowImpotSummary(true);
    } catch (e) {
      console.log(e);
      toastr.error("Désolé, nous n'avons pas pu lire votre fichier.", 'Mais vous pouvez réssayer !');
    }
    setReloadKey((k) => k + 1);
  };

  const onImportData = async () => {
    if (window.confirm(`Voulez-vous vraiment importer ${dataToImport.length} personnes dans Mano ? Cette opération est irréversible.`)) {
      const response = await API.post({ path: '/person/import', body: dataToImport });
      if (response.ok) toastr.success('Importation réussie !');
      setAllPersons((oldPersons) => [...oldPersons, ...response.data].sort((p1, p2) => p1.name.localeCompare(p2.name)));
      setShowImpotSummary(false);
    }
  };

  if (!['admin'].includes(user.role)) return null;

  return (
    <>
      <ButtonCustom onClick={() => fileDialogRef.current.click()} color="primary" title="Importer un fichier .xlsx" padding="12px 24px" />
      <input
        ref={fileDialogRef}
        key={reloadKey}
        type="file"
        id="fileDialog"
        accept="csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style={{ display: 'none' }}
        onChange={onParseData}
      />
      <Modal isOpen={showImportSummary} toggle={() => setShowImpotSummary(false)} size="lg">
        <ModalHeader toggle={() => setShowImpotSummary(false)}>Résumé</ModalHeader>
        <ModalBody>
          <ul style={{ overflow: 'auto', maxHeight: '62vh' }}>
            <li>Nombre de personnes à importer: {dataToImport.length}</li>
            <li>
              Champs importés ({importedFields.length}):
              <ul>
                {importedFields.map((label) => (
                  <li key={label}>
                    <code>{label}</code>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              Champs ignorés ({ignoredFields.length}):
              <ul>
                {ignoredFields.map((label) => (
                  <li key={label}>
                    <code>{label}</code>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
          <ButtonCustom onClick={onImportData} color="primary" title="Importer" padding="12px 24px" />
        </ModalBody>
      </Modal>
    </>
  );
};

export default ImportData;
