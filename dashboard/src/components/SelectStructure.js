import React, { useEffect, useState } from 'react';
import { Label } from 'reactstrap';

import useApi from '../services/api';
import SelectCustom from './SelectCustom';

const SelectStructure = ({ value = '', onChange, name = 'structure' }) => {
  const [data, setData] = useState(null);
  const API = useApi();

  useEffect(() => {
    (async () => {
      const { data: d } = await API.get({ path: '/structure' });
      setData(d);
    })();
  }, []);

  if (!data) return <div>Chargement</div>;

  return (
    <>
      <Label htmlFor={name}>Structure</Label>
      <SelectCustom
        inputId={name}
        options={data}
        name={name || ''}
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
