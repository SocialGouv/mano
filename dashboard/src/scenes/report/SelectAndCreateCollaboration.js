import React, { useContext } from 'react';
import { toastr } from 'react-redux-toastr';
import SelectCustom from '../../components/SelectCustom';
import AuthContext from '../../contexts/auth';
import API from '../../services/api';

const NoOptionsMessage = () => (
  <span style={{ fontSize: 14, textAlign: 'center', color: '#808080', width: '100%', display: 'block' }}>
    Pas d'option ? Créez une collaboration en tapant directement au-dessus ☝️
  </span>
);

const SelectAndCreateCollaboration = ({ values, onChange }) => {
  const { organisation, setAuth } = useContext(AuthContext);

  const onChangeRequest = (newCollabs) => {
    onChange({ currentTarget: { value: newCollabs || [], name: 'collaborations' } });
  };

  const onCreateOption = async (collab) => {
    toastr.info('Création de la nouvelle collaboration...');
    onChangeRequest([...(organisation.collaborations || []), collab]);
    await new Promise((res) => setTimeout(res, 2000));
    const response = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { collaborations: [...(organisation.collaborations || []), collab].sort((c1, c2) => c1.localeCompare(c2)) },
    });
    if (response.ok) {
      toastr.clean();
      toastr.success('Collaboration créée !');
      setAuth({ organisation: response.data });
      onChangeRequest([...(organisation.collaborations || []), collab]);
    } else {
      onChangeRequest(organisation.collaborations || []);
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
    />
  );
};

export default SelectAndCreateCollaboration;
