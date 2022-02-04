import { useRecoilValue } from 'recoil';
import XLSX from 'xlsx';
import ButtonCustom from '../../components/ButtonCustom';
import { currentTeamState } from '../../recoil/auth';
import { usePersons } from '../../recoil/persons';

export default function DownloadExample() {
  const { personFieldsIncludingCustomFields } = usePersons();
  const currentTeam = useRecoilValue(currentTeamState);

  function placeholder(f) {
    if (f.options?.length) return f.options[0];
    if (['date', 'date-with-time'].includes(f.type)) return '2021-01-01';
    if (['boolean', 'yes-no'].includes(f.type)) {
      return 'Oui';
    }
    if (f.name === 'assignedTeams') {
      return currentTeam.name;
    }
    return 'test';
  }

  return (
    <ButtonCustom
      onClick={() => {
        const importable = personFieldsIncludingCustomFields().filter((f) => f.importable);
        const ws = XLSX.utils.aoa_to_sheet([importable.map((f) => f.label), importable.map((f) => placeholder(f))]);
        const workbook = { Sheets: { personne: ws }, SheetNames: ['personne'] };
        XLSX.writeFile(workbook, 'data.xlsx');
      }}
      color="primary"
      title="Télécharger un exemple"
      padding="12px 24px"
    />
  );
}
