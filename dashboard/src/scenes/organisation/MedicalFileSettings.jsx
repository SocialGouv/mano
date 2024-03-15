import React, { useState, useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useDataLoader } from "../../components/DataLoader";
import { organisationState } from "../../recoil/auth";
import API, { encryptItem } from "../../services/api";
import { toast } from "react-toastify";
import DragAndDropSettings from "./DragAndDropSettings";
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from "../../recoil/medicalFiles";
import CustomFieldSetting from "../../components/CustomFieldSetting";
import { EditCustomField } from "../../components/TableCustomFields";

const sanitizeFields = (field) => {
  const sanitizedField = {};
  for (const key of Object.keys(field)) {
    if (![undefined, null].includes(field[key])) sanitizedField[key] = field[key];
  }
  return sanitizedField;
};

const MedicalFileSettings = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const dataFormatted = useMemo(() => {
    return [
      {
        groupTitle: "Dossier médical",
        items: customFieldsMedicalFile,
      },
    ];
  }, [customFieldsMedicalFile]);

  const { refresh } = useDataLoader();

  const onDragAndDrop = useCallback(
    async ([{ items }]) => {
      const reorderedCustomFields = items
        .map((fieldName, index) => customFieldsMedicalFile.find((field) => field.name === fieldName))
        .map(sanitizeFields);

      try {
        const response = await API.put({
          path: `/organisation/${organisation._id}`,
          body: { customFieldsMedicalFile: reorderedCustomFields },
        });
        if (response.ok) {
          toast.success("Mise à jour !");
          setOrganisation(response.data);
          refresh();
        }
      } catch (orgUpdateError) {
        console.log("error in updating organisation", orgUpdateError);
        toast.error(orgUpdateError.message);
      }
    },
    [customFieldsMedicalFile, organisation._id, refresh, setOrganisation]
  );

  return (
    <DragAndDropSettings
      title={<h3 className="tw-mb-0 tw-text-xl tw-font-extrabold">Dossier médical</h3>}
      data={dataFormatted}
      dataItemKey={(cat) => cat.name}
      ItemComponent={MedicalFileCustomField}
      NewItemComponent={AddField}
      onDragAndDrop={onDragAndDrop}
    />
  );
};

const AddField = () => {
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);

  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const [isAddingField, setIsAddingField] = useState(false);
  const { refresh } = useDataLoader();

  const onAddField = async (newField) => {
    try {
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { customFieldsMedicalFile: [...customFieldsMedicalFile, newField] },
      });
      if (response.ok) {
        toast.success("Mise à jour !");
        setOrganisation(response.data);
        refresh();
      }
    } catch (orgUpdateError) {
      console.log("error in updating organisation", orgUpdateError);
      toast.error(orgUpdateError.message);
    }
    setIsAddingField(false);
  };

  return (
    <>
      <button
        type="button"
        className="tw-mt-2 tw-block tw-break-normal tw-rounded tw-bg-transparent hover:tw-underline"
        onClick={() => {
          setIsAddingField(true);
        }}
      >
        Ajouter un champ
      </button>
      <EditCustomField
        isNewField
        open={isAddingField}
        onClose={() => {
          setIsAddingField(false);
        }}
        onSaveField={onAddField}
      />
    </>
  );
};

const replaceOldChoiceByNewChoice = (data, oldChoice, newChoice, field) => {
  return data
    .map((item) => {
      if (typeof item[field.name] === "string") {
        if (item[field.name] !== oldChoice) return null;
        return {
          ...item,
          [field.name]: newChoice,
        };
      }
      // if not string, then it's array
      if (!Array.isArray(item[field.name])) return null;
      if (!item[field.name]?.includes(oldChoice)) return null;
      return {
        ...item,
        [field.name]: item[field.name].map((_choice) => (_choice === oldChoice ? newChoice : _choice)),
      };
    })
    .filter(Boolean);
};

const MedicalFileCustomField = ({ item: customField }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditingField, setIsEditingField] = useState(false);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const medicalFiles = useRecoilValue(medicalFileState);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);

  const { refresh } = useDataLoader();

  const onSaveField = async (editedField) => {
    try {
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { customFieldsMedicalFile: customFieldsMedicalFile.map((field) => (field.name !== editedField.name ? field : editedField)) },
      });
      if (response.ok) {
        toast.success("Mise à jour !");
        setOrganisation(response.data);
        refresh();
      }
    } catch (orgUpdateError) {
      console.log("error in updating organisation", orgUpdateError);
      toast.error(orgUpdateError.message);
    }
    setIsEditingField(false);
  };

  const onEditChoice = async ({ oldChoice, newChoice, field, fields }) => {
    const updatedFields = customFieldsMedicalFile.map((_field) =>
      _field.name !== field.name
        ? _field
        : {
            ..._field,
            options: _field.options.map((option) => (option === oldChoice ? newChoice : option)),
          }
    );
    setIsEditingField(false);
    const updatedMedicalFiles = replaceOldChoiceByNewChoice(medicalFiles, oldChoice, newChoice, field);

    const response = await API.post({
      path: "/custom-field",
      body: {
        customFields: {
          customFieldsMedicalFile: updatedFields,
        },
        medicalFiles: await Promise.all(updatedMedicalFiles.map(prepareMedicalFileForEncryption(updatedFields)).map(encryptItem)),
      },
    });
    if (response.ok) {
      toast.success("Choix mis à jour !");
      setOrganisation(response.data);
    }
    refresh();
  };

  const onDeleteField = async () => {
    try {
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { customFieldsMedicalFile: customFieldsMedicalFile.filter((field) => field.name !== customField.name) },
      });
      if (response.ok) {
        toast.success("Mise à jour !");
        setOrganisation(response.data);
        refresh();
      }
    } catch (orgUpdateError) {
      console.log("error in updating organisation", orgUpdateError);
      toast.error(orgUpdateError.message);
    }
    setIsEditingField(false);
  };

  return (
    <>
      <div
        key={customField.name}
        onMouseDown={() => setIsSelected(true)}
        onMouseUp={() => setIsSelected(false)}
        className={[
          "tw-group tw-flex tw-cursor-move tw-items-center tw-border-2 tw-border-transparent tw-pl-1",
          isSelected ? "tw-rounded tw-border-main" : "",
        ].join(" ")}
      >
        <CustomFieldSetting customField={customField} />
        <button
          type="button"
          aria-label={`Modifier le champ ${customField.label}`}
          className="tw-invisible tw-ml-auto tw-inline-flex tw-pl-2 group-hover:tw-visible"
          onClick={() => setIsEditingField(true)}
        >
          ✏️
        </button>
      </div>
      <EditCustomField
        open={isEditingField}
        editingField={customField}
        data={medicalFiles}
        onClose={() => {
          setIsEditingField(false);
        }}
        onDelete={onDeleteField}
        onSaveField={onSaveField}
        onEditChoice={onEditChoice}
      />
    </>
  );
};

export default MedicalFileSettings;
