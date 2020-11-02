import React, { useEffect, useState } from "react";
import { Input } from "reactstrap";

import api from "../../services/api";

export default ({ value, onChange, name }) => {
  const [organisations, setOrganisations] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/organisation");
      setOrganisations(data);
      onChange({ target: { value: data[0]._id, name } });
    })();
  }, []);

  if (!organisations) return <div>Loading...</div>;

  return (
    <div>
      <Input value={value} type="select" name={name} onChange={(e) => onChange(e)}>
        {organisations.map((e) => (
          <option value={e._id}>{e.name}</option>
        ))}
      </Input>
    </div>
  );
};
