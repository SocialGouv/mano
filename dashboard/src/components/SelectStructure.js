import React, { useEffect, useState } from 'react';
import { Label } from 'reactstrap';

import API from '../services/api';
import SelectCustom from './SelectCustom';

const SelectStructure = ({ value = '', onChange, name }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: d } = await API.get({ path: '/structure' });
      setData(d);
    })();
  }, []);

  if (!data) return <div>Chargement</div>;

  return (
    <>
      <Label>Structure</Label>
      <SelectCustom
        options={data}
        name={name || ''}
        placeholder="-- Choisir --"
        value={data.find((o) => o._id === value)}
        onChange={(structure) => onChange({ currentTarget: { value: structure?._id || null, name } })}
        getOptionValue={(i) => i?._id}
        getOptionLabel={(i) => data.find((o) => o._id === i._id)?.name}
        isClearable
      />
    </>
  );
};

export default SelectStructure;
