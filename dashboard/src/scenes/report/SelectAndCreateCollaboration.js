import React from 'react';
import { toastr } from 'react-redux-toastr';
import { useRecoilState } from 'recoil';
import SelectCustom from '../../components/SelectCustom';
import { organisationState } from '../../recoil/auth';
import useApi from '../../services/api';

const NoOptionsMessage = () => (
  <span style={{ fontSize: 14, textAlign: 'center', color: '#808080', width: '100%', display: 'block' }}>
    Pas d'option ? Créez une collaboration en tapant directement au-dessus ☝️
  </span>
);

const SelectAndCreateCollaboration = ({ values, onChange }) => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const API = useApi();

  const onChangeRequest = (newCollabs) => {
    console.log({ newCollabs });
    onChange({ currentTarget: { value: newCollabs || [], name: 'collaborations' } });
  };

  const onCreateOption = async (collab) => {
    toastr.info('Création de la nouvelle collaboration...');
    onChangeRequest([...(values || []), collab]);
    await new Promise((res) => setTimeout(res, 2000));
    const response = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { collaborations: [...(organisation.collaborations || []), collab].sort((c1, c2) => c1.localeCompare(c2)) },
    });
    if (response.ok) {
      toastr.clean();
      toastr.success('Collaboration créée !');
      setOrganisation(response.data);
      onChangeRequest([...(values || []), collab]);
    } else {
      onChangeRequest(values || []);
    }
  };

  return (
    <SelectCustom
      creatable
      format
      onCreateOption={onCreateOption}
      options={(organisation.collaborations || []).map((collab) => ({ value: collab, label: collab }))}
      value={(values || []).map((opt) => ({ value: opt, label: opt }))}
      isSearchable
      isMulti
      name="collaborations"
      components={{ NoOptionsMessage }}
      onChange={(v) => onChangeRequest(v.map((v) => v.value))}
      placeholder={' -- Choisir une collaboration -- '}
      formatOptionLabel={({ value: collab, __isNew__ }) => {
        if (__isNew__) return <span>Créer "{collab}"</span>;
        return <span>{collab}</span>;
      }}
      inputId="report-select-collaboration"
      classNamePrefix="report-select-collaboration"
    />
  );
};

export default SelectAndCreateCollaboration;
