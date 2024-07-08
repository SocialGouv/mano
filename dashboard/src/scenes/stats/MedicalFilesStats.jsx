import { useState } from "react";
import { CustomResponsivePie } from "./Charts";
import { getPieData } from "./utils";
import CustomFieldsStats from "./CustomFieldsStats";
import Filters, { filterData } from "../../components/Filters";
import { AgeRangeBar, SelectedPersonsModal } from "./PersonsStats";
import { capture } from "../../services/sentry";
import { userState } from "../../recoil/auth";
import { useRecoilValue } from "recoil";

const MedicalFilesStats = ({ filterBase, filterPersons, setFilterPersons, personsForStats, customFieldsMedicalFile, personFields, title }) => {
  const [personsModalOpened, setPersonsModalOpened] = useState(false);
  const [sliceField, setSliceField] = useState(null);
  const [sliceValue, setSliceValue] = useState(null);
  const [slicedData, setSlicedData] = useState([]);
  const user = useRecoilValue(userState);

  const onSliceClick = (newSlice, fieldName, personConcerned = personsForStats) => {
    if (["stats-only"].includes(user.role)) return;
    const newSlicefield = filterBase.find((f) => f.field === fieldName);
    if (!newSlicefield) {
      capture("newSlicefield not found", { fieldName, filterBase });
      return;
    }
    setSliceField(newSlicefield);
    setSliceValue(newSlice);
    const slicedData =
      newSlicefield.type === "boolean"
        ? personConcerned.filter((p) => (newSlice === "Non" ? !p[newSlicefield.field] : !!p[newSlicefield.field]))
        : filterData(
            personConcerned,
            [{ ...newSlicefield, value: newSlice, type: newSlicefield.field === "outOfActiveList" ? "boolean" : newSlicefield.field }],
            true
          );
    setSlicedData(slicedData);
    setPersonsModalOpened(true);
  };
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des dossiers médicaux des {title}</h3>
      <Filters base={filterBase} filters={filterPersons} onChange={setFilterPersons} />
      <AgeRangeBar
        persons={personsForStats}
        onItemClick={
          user.role === "stats-only"
            ? undefined
            : (newSlice, data) => {
                setSliceField(personFields.find((f) => f.name === "birthdate"));
                setSliceValue(newSlice);
                setSlicedData(data);
                setPersonsModalOpened(true);
              }
        }
      />
      <CustomResponsivePie
        title="Genre"
        field="gender"
        onItemClick={
          user.role === "stats-only"
            ? undefined
            : (newSlice) => {
                onSliceClick(newSlice, "gender");
              }
        }
        data={getPieData(personsForStats, "gender", { options: personFields.find((f) => f.name === "gender").options })}
        help={`Couverture médicale des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <CustomFieldsStats
        data={personsForStats}
        customFields={customFieldsMedicalFile}
        onSliceClick={user.role === "stats-only" ? undefined : onSliceClick}
        help={(label) =>
          `${label.capitalize()} des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`
        }
        totalTitleForMultiChoice={<span className="tw-font-bold">Nombre de personnes concernées</span>}
      />
      <SelectedPersonsModal
        open={personsModalOpened}
        onClose={() => {
          setPersonsModalOpened(false);
        }}
        persons={slicedData}
        sliceField={sliceField}
        onAfterLeave={() => {
          setSliceField(null);
          setSliceValue(null);
          setSlicedData([]);
        }}
        title={`${sliceField?.label} : ${sliceValue} (${slicedData.length})`}
      />
    </>
  );
};

export default MedicalFilesStats;
