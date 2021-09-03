import React, { useContext, useState } from 'react';
import AuthContext from '../contexts/auth';
import SelectCustom from './SelectCustom';

const SelectUser = ({ value, onChange, ...props }) => {
  const [search, setSearch] = useState('');
  const { users: allUsers } = useContext(AuthContext);

  const users = search?.length ? allUsers.filter((p) => p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())) : allUsers;

  return (
    <SelectCustom
      options={users}
      name="user"
      inputValue={search}
      onInputChange={setSearch}
      isSearchable
      onChange={(v) => {
        setSearch(v._name);
        onChange(v._id);
      }}
      value={users.filter((i) => i._id === value)[0]}
      placeholder={' -- Choisir un utilisateur -- '}
      getOptionValue={(i) => i._id}
      getOptionLabel={(i) => i?.name || ''}
      {...props}
    />
  );
};

export default SelectUser;
