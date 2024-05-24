import { useRecoilValue } from "recoil";
import structuredClone from "@ungap/structured-clone";
import { organisationAuthentifiedState, userAuthentifiedState } from "../../../recoil/auth";
import { Consultations } from "./Consultations";
import { InfosMain } from "./InfosMain";
import PersonCustomFields from "./PersonCustomFields";
import DeletePersonButton from "./DeletePersonButton";
import OutOfActiveList from "../OutOfActiveList";
import MergeTwoPersons from "../MergeTwoPersons";
import { flattenedCustomFieldsPersonsSelector } from "../../../recoil/persons";
import {
  customFieldsMedicalFileSelector,
  groupedCustomFieldsMedicalFileSelector,
  prepareMedicalFileForEncryption,
} from "../../../recoil/medicalFiles";
import { Treatments } from "./Treatments";
import { useEffect, useMemo } from "react";
import PersonDocumentsMedical from "./PersonDocumentsMedical";
import { MedicalFilePrint } from "./MedicalFilePrint";
import API from "../../../services/api";
import CommentsMedical from "./CommentsMedical";
import type { PersonPopulated } from "../../../types/person";
import type { CustomField, CustomFieldsGroup } from "../../../types/field";
import Constantes from "./Constantes";
import { useDataLoader } from "../../../components/DataLoader";

interface MedicalFileProps {
  person: PersonPopulated;
}

export default function MedicalFile({ person }: MedicalFileProps) {
  const { refresh } = useDataLoader();
  const user = useRecoilValue(userAuthentifiedState);
  const flatCustomFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const groupedCustomFieldsMedicalFile = useRecoilValue(groupedCustomFieldsMedicalFileSelector);
  const flattenedCustomFieldsPersons = useRecoilValue(flattenedCustomFieldsPersonsSelector);
  const organisation = useRecoilValue(organisationAuthentifiedState);
  // These custom fields are displayed by default, because they where displayed before they became custom fields
  // Maybe we should reconsider this legacy in 2024-2025.
  const groupedCustomFieldsMedicalFileWithLegacyFields: CustomFieldsGroup[] = useMemo(() => {
    const c = structuredClone(groupedCustomFieldsMedicalFile);
    if (flattenedCustomFieldsPersons.find((e) => e.name === "structureMedical")) {
      const structureMedicalField: CustomField = {
        name: "structureMedical",
        type: "text",
        label: "Structure de suivi médical",
        enabled: true,
        required: false,
        showInStats: true,
      };
      c[0].fields = [structureMedicalField, ...c[0].fields];
    }
    if (flattenedCustomFieldsPersons.find((e) => e.name === "healthInsurances")) {
      const healthInsurancesField: CustomField = {
        name: "healthInsurances",
        label: "Couverture(s) médicale(s)",
        type: "multi-choice",
        enabled: true,
        showInStats: true,
        required: true,
      };
      c[0].fields = [healthInsurancesField, ...c[0].fields];
    }
    return c;
  }, [groupedCustomFieldsMedicalFile, flattenedCustomFieldsPersons]);
  const medicalFile = person.medicalFile;

  useEffect(() => {
    if (!medicalFile) {
      API.post({
        path: "/medical-file",
        body: prepareMedicalFileForEncryption(flatCustomFieldsMedicalFile)({
          person: person._id,
          documents: [],
          organisation: organisation._id,
        }),
      }).then((response) => {
        if (!response.ok) return;
        refresh();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicalFile]);
  return (
    <>
      {!import.meta.env.VITE_TEST_PLAYWRIGHT && <MedicalFilePrint person={person} />}
      <div className="noprint tw-grid tw-grid-cols-12 tw-gap-4 tw-pt-4">
        <div className="tw-col-span-3">
          <InfosMain person={person} isMedicalFile />
        </div>
        <div className="tw-col-span-5 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
          <Consultations person={person} />
        </div>
        <div className="tw-col-span-4 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
          {["restricted-access"].includes(user.role) ? <PersonDocumentsMedical person={person} /> : <CommentsMedical person={person} />}
        </div>
      </div>
      {!["restricted-access"].includes(user.role) && (
        <>
          <div className="noprint tw-grid tw-grid-cols-12 tw-gap-4 tw-pt-4">
            <div className="tw-col-span-6 tw-flex tw-flex-col tw-gap-4">
              {groupedCustomFieldsMedicalFileWithLegacyFields.map(({ name, fields }) => {
                return (
                  <PersonCustomFields
                    isMedicalFile
                    key={name}
                    person={person}
                    sectionName={groupedCustomFieldsMedicalFileWithLegacyFields.length > 1 ? name : "Dossier Médical"}
                    fields={fields}
                  />
                );
              })}
            </div>
            <div className="tw-col-span-6 tw-flex tw-min-h-full tw-flex-col tw-gap-4">
              <div className="tw-h-[400px] tw-max-h-[50%] tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
                <Treatments person={person} />
              </div>
              <div className="tw-h-[400px] tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
                <PersonDocumentsMedical person={person} />
              </div>
            </div>
          </div>
          <Constantes person={person} />
          <div className="noprint tw-mt-4 tw-flex tw-justify-end tw-gap-2">
            <MergeTwoPersons person={person} />
            <OutOfActiveList person={person} />
            <DeletePersonButton person={person} />
          </div>
        </>
      )}
    </>
  );
}
