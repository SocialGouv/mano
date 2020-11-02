import React, { useEffect, useState } from "react";
import { Input, Row, Col } from "reactstrap";

import api from "../../services/api";

export default ({ value, onChange }) => {
  const [organisations, setOrganisations] = useState(null);
  const [teams, setTeams] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: o } = await api.get("/organisation");
      const { data: t } = await api.get(`/team?organisation=${value.organisationId}`);
      setOrganisations(o);
      setTeams(t);
    })();
  }, [value.organisationName]);

  if (!organisations) return <div>Loading...</div>;


  return (
    <Row style={{ marginTop: 15, marginBottom: 15 }}>
      <Col>
        <div>Organisation</div>
        <Input value={value.organisationId} type="select" name="organisation" onChange={(e) => onChange(e)}>
          <option value="">--Choisir--</option>
          {organisations.map((e) => (
            <option value={e._id}>{e.name}</option>
          ))}
        </Input>
      </Col>
      <Col>
        <div>Team</div>
        <Input disabled={!teams} value={value.teamId} type="select" name="team" onChange={(e) => onChange(e)}>
          <option value="">--Choisir--</option>
          {teams?.map((e) => (
            <option value={e._id}>{e.name}</option>
          ))}
        </Input>
      </Col>
    </Row>
  );
};
