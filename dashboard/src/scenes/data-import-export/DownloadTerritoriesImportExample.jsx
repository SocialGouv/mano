import { utils, writeFile } from "@e965/xlsx";
import ButtonCustom from "../../components/ButtonCustom";
import { flattenedTerritoriesTypesSelector, territoriesFields } from "../../recoil/territory";
import { useRecoilValue } from "recoil";

export default function DownloadTerritoriesImportExample() {
  const territoriesTypes = useRecoilValue(flattenedTerritoriesTypesSelector);
  function placeholder(f) {
    if (f.options?.length) return f.options[0];
    return "test";
  }

  return (
    <ButtonCustom
      onClick={() => {
        const importable = territoriesFields(territoriesTypes).filter((f) => f.importable);
        const ws = utils.aoa_to_sheet([importable.map((f) => f.label), importable.map((f) => placeholder(f))]);
        const workbook = { Sheets: { territoire: ws }, SheetNames: ["territoire"] };
        writeFile(workbook, "territoires.xlsx");
      }}
      color="primary"
      title="Télécharger un exemple"
      padding="12px 24px"
    />
  );
}
