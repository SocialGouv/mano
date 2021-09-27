import React, { useContext, useState } from 'react';
import { toastr } from 'react-redux-toastr';
import SelectCustom from '../../components/SelectCustom';
import AuthContext from '../../contexts/auth';
import API from '../../services/api';

const NoOptionsMessage = () => (
  <span style={{ fontSize: 14, textAlign: 'center', color: '#808080', width: '100%', display: 'block' }}>
    Pas d'option ? Créez une collaboration en tapant directement au-dessus ☝️
  </span>
);

const SelectAndCreateCollaboration = ({ value, onChange }) => {
  const { organisation, setAuth } = useContext(AuthContext);

  const onChangeRequest = (event) => {
    onChange({ currentTarget: { value: event.value, name: 'collaboration' } });
  };

  return (
    <SelectCustom
      options={(organisation.collaborations || []).map((collab) => ({ value: collab, label: collab }))}
      name="collaboration"
      isSearchable
      isClearable
      components={{ NoOptionsMessage }}
      onChange={onChangeRequest}
      placeholder={' -- Choisir une collaboration -- '}
      onCreateOption={async (collab) => {
        toastr.info('Création de la nouvelle collaboration...');
        await new Promise((res) => setTimeout(res, 2000));
        const response = await API.put({
          path: `/organisation/${organisation._id}`,
          body: { collaborations: [...(organisation.collaborations || []), collab].sort((c1, c2) => c1.localeCompare(c2)) },
        });
        if (response.ok) {
          toastr.clean();
          toastr.success('Collaboration créée !');
          setAuth({ organisation: response.data });
          onChangeRequest(collab);
        }
      }}
      value={{ value, label: value }}
      formatOptionLabel={({ value: collab, __isNew__ }) => {
        if (__isNew__) return <span>Créer "{collab}"</span>;
        return <span>{collab}</span>;
      }}
      format
      creatable
    />
  );
};

export default SelectAndCreateCollaboration;
