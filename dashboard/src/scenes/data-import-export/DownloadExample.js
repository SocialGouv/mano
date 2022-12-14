import { useRecoilValue } from 'recoil';
import { utils, writeFile } from 'xlsx';
import ButtonCustom from '../../components/ButtonCustom';
import { currentTeamState } from '../../recoil/auth';
import { flattenedPersonFieldsSelector } from '../../recoil/persons';

export default function DownloadExample() {
  const currentTeam = useRecoilValue(currentTeamState);
  const flattenedPersonFields = useRecoilValue(flattenedPersonFieldsSelector);

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
        const importable = flattenedPersonFields.filter((f) => f.importable);
        const ws = utils.aoa_to_sheet([importable.map((f) => f.label), importable.map((f) => placeholder(f))]);
        const workbook = { Sheets: { personne: ws }, SheetNames: ['personne'] };
        writeFile(workbook, 'data.xlsx');
      }}
      color="primary"
      title="Télécharger un exemple"
      padding="12px 24px"
    />
  );
}
