import XLSX from 'xlsx';
import ButtonCustom from '../../components/ButtonCustom';
import { personFields } from '../../recoil/persons';

export default function DownloadExample() {
  return (
    <ButtonCustom
      onClick={() => {
        const importable = personFields.filter((f) => f.importable);
        const ws = XLSX.utils.aoa_to_sheet([importable.map((f) => f.label), importable.map((f) => (f.options?.length ? f.options[0] : 'test'))]);
        const workbook = { Sheets: { personne: ws }, SheetNames: ['personne'] };
        XLSX.writeFile(workbook, 'data.xlsx');
      }}
      color="primary"
      title="Télécharger un exemple"
      padding="12px 24px"
    />
  );
}
