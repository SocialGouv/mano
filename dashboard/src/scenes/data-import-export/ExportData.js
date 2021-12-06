/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import XLSX from 'xlsx';

import ButtonCustom from '../../components/ButtonCustom';
import { personsState } from '../../recoil/persons';
import { territoryObservationsState } from '../../recoil/territoryObservations';
import { useAuth } from '../../recoil/auth';
import { commentsState } from '../../recoil/comments';
import { actionsState } from '../../recoil/actions';
import { placesState } from '../../recoil/places';
import { reportsState } from '../../recoil/reports';
import { territoriesState } from '../../recoil/territory';
import { useRecoilValue } from 'recoil';

const createSheet = (data) => {
  /*
  [
    [the, first, array, is, the, header],
    [then, its, the, data],
  ]
   */

  const encryptionFields = ['encryptedEntityKey', 'entityKey'];

  const header = [
    ...data
      .reduce((columns, item) => {
        for (let key of Object.keys(item)) {
          if (!columns.find((col) => col === key)) columns.push(key);
        }
        return columns;
      }, [])
      .filter((column) => !encryptionFields.includes(column)),
    ...encryptionFields,
  ];

  const sheet = data.reduce(
    (xlsxData, item, index) => {
      const row = [];
      for (let column of header) {
        const value = item[column];
        if (!value) {
          row.push(null);
          continue;
        }
        if (typeof value === 'string') {
          row.push(value);
          continue;
        }
        if (typeof value[0] === 'string') {
          row.push(value.join(', '));
          continue;
        }
        row.push(JSON.stringify(value));
      }
      return [...xlsxData, row];
    },
    [header]
  );
  return XLSX.utils.aoa_to_sheet(sheet);
};

const ExportData = () => {
  const { teams, users, user } = useAuth();
  const allPersons = useRecoilValue(personsState);
  const allActions = useRecoilValue(actionsState);
  const comments = useRecoilValue(commentsState);
  const allreports = useRecoilValue(reportsState);
  const territories = useRecoilValue(territoriesState);
  const allObservations = useRecoilValue(territoryObservationsState);
  const places = useRecoilValue(placesState);

  const onExportToCSV = () => {
    const workbook = XLSX.utils.book_new();
    // actions
    XLSX.utils.book_append_sheet(workbook, createSheet(allActions), 'actions');
    XLSX.utils.book_append_sheet(workbook, createSheet(allPersons), 'personnes suivies');
    XLSX.utils.book_append_sheet(workbook, createSheet(comments), 'comments');
    XLSX.utils.book_append_sheet(workbook, createSheet(territories), 'territoires');
    XLSX.utils.book_append_sheet(workbook, createSheet(allObservations), 'observations de territoires');
    XLSX.utils.book_append_sheet(workbook, createSheet(places), 'lieux fréquentés');
    XLSX.utils.book_append_sheet(workbook, createSheet(teams), 'équipes');
    XLSX.utils.book_append_sheet(workbook, createSheet(users), 'utilisateurs');
    XLSX.utils.book_append_sheet(workbook, createSheet(allreports), 'comptes rendus');
    XLSX.writeFile(workbook, 'data.xlsx');
  };

  if (!['admin'].includes(user.role)) return null;

  return <ButtonCustom color="primary" onClick={onExportToCSV} title="Exporter les données en .xlsx" padding="12px 24px" />;
};

export default ExportData;
