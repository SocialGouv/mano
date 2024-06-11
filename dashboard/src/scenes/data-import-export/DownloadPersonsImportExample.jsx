import { useRecoilValue } from "recoil";
import { utils, writeFile } from "@e965/xlsx";
import ButtonCustom from "../../components/ButtonCustom";
import { currentTeamState } from "../../recoil/auth";
import { personFieldsIncludingCustomFieldsSelector } from "../../recoil/persons";
import { customFieldsMedicalFileSelector } from "../../recoil/medicalFiles";

export default function DownloadPersonsImportExample() {
  const currentTeam = useRecoilValue(currentTeamState);
  const personFieldsIncludingCustomFields = useRecoilValue(personFieldsIncludingCustomFieldsSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);

  function placeholder(f) {
    if (f.options?.length) return f.options[0];
    if (["number"].includes(f.type)) return "3";
    if (["date", "date-with-time", "duration"].includes(f.type)) return "2021-01-01";
    if (["boolean", "yes-no"].includes(f.type)) {
      return "Oui";
    }
    if (f.name === "assignedTeams") {
      return currentTeam.name;
    }
    return "test";
  }

  return (
    <ButtonCustom
      onClick={() => {
        const importable = personFieldsIncludingCustomFields.filter((f) => f.importable);
        const ws = utils.aoa_to_sheet([
          [...importable.map((f) => f.label), ...customFieldsMedicalFile.map((f) => f.label)],
          [...importable.map((f) => placeholder(f)), ...customFieldsMedicalFile.map((f) => placeholder(f))],
        ]);
        const workbook = { Sheets: { personne: ws }, SheetNames: ["personne"] };
        writeFile(workbook, "persons.xlsx");
      }}
      color="primary"
      title="Télécharger un exemple"
      padding="12px 24px"
    />
  );
}
