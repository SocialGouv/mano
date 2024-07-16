import { utils, writeFile } from "@e965/xlsx";
import ButtonCustom from "../../components/ButtonCustom";
import { useRecoilValue } from "recoil";
import { flattenedStructuresCategoriesSelector, structuresFields } from "../../recoil/structures";

export default function DownloadStructuresImportExample() {
  const structuresCategories = useRecoilValue(flattenedStructuresCategoriesSelector);
  function placeholder(f) {
    if (f.options?.length) return f.options[0];
    return "test";
  }

  return (
    <ButtonCustom
      onClick={() => {
        const importable = structuresFields(structuresCategories).filter((f) => f.importable);
        const ws = utils.aoa_to_sheet([importable.map((f) => f.label), importable.map((f) => placeholder(f))]);
        const workbook = { Sheets: { structure: ws }, SheetNames: ["structure"] };
        writeFile(workbook, "structures.xlsx");
      }}
      color="primary"
      title="Télécharger un exemple"
      padding="12px 24px"
    />
  );
}
