import { Col, Row } from "reactstrap";
import { useRecoilValue } from "recoil";
import { currentTeamAuthentifiedState } from "../../../recoil/auth";
import { useMemo, useState } from "react";
import EditModal from "./EditModal";
import CustomFieldDisplay from "../../../components/CustomFieldDisplay";
import type { PersonPopulated } from "../../../types/person";
import type { CustomField } from "../../../types/field";

interface PersonCustomFieldsProps {
  person: PersonPopulated;
  sectionName: string;
  fields: CustomField[];
  colspan?: number | null;
  isMedicalFile?: boolean;
}

export default function PersonCustomFields({ person, sectionName, fields, colspan = null, isMedicalFile = false }: PersonCustomFieldsProps) {
  const [editModal, setEditModal] = useState("");
  const team = useRecoilValue(currentTeamAuthentifiedState);
  const enabledFields = useMemo(() => {
    return fields.filter((f) => f.enabled || f.enabledTeams?.includes(team._id));
  }, [fields, team]);
  if (!enabledFields.length) return null;
  return (
    <div className="p-3 border tw-min-h-[200px] tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
      {Boolean(editModal) && <EditModal isMedicalFile={isMedicalFile} person={person} selectedPanel={editModal} onClose={() => setEditModal("")} />}
      <div className="tw-flex">
        <h4 className="tw-flex-1 tw-text-xl">{sectionName}</h4>
        <div>
          <button
            className="tw-transition hover:tw-scale-125"
            onClick={() => setEditModal(sectionName)}
            aria-label={`Éditer les ${sectionName.toLowerCase()}`}
            title={`Éditer les ${sectionName.toLowerCase()}`}
          >
            ✏️
          </button>
        </div>
      </div>
      {sectionName === "Informations sociales" && !!person.description && (
        <div className="my-4">
          <CustomFieldDisplay type="textarea" value={person.description} />
        </div>
      )}
      <Row>
        {enabledFields.map((field, i) => {
          return (
            <Col key={field.label + i} md={field.type === "textarea" ? 12 : colspan ?? 4}>
              <div className="my-2 [overflow-wrap:anywhere]">
                <div className="tw-text-sm tw-font-semibold tw-text-gray-600">{field.label}</div>
                <div>
                  <CustomFieldDisplay
                    type={field.type}
                    value={isMedicalFile ? person[field.name] || person.medicalFile?.[field.name] : person[field.name]}
                  />
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
