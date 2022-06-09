import React, { useState } from 'react';
import styled from 'styled-components';
import { Col, Row } from 'reactstrap';
import { toastr } from 'react-redux-toastr';

import Box from '../../components/Box';
import ButtonCustom from '../../components/ButtonCustom';
import Observation from './view';
import CreateObservation from '../../components/CreateObservation';
import { territoryObservationsState } from '../../recoil/territoryObservations';
import { useRecoilState } from 'recoil';
import useApi from '../../services/api';

const List = ({ territory = {} }) => {
  const [territoryObservations, setTerritoryObservations] = useRecoilState(territoryObservationsState);
  const [observation, setObservation] = useState({});
  const [openObservationModale, setOpenObservationModale] = useState(null);
  const API = useApi();

  const observations = territoryObservations.filter((obs) => obs.territory === territory._id)
    .sort((a, b) => new Date(b.observedAt || b.createdAt) - new Date(a.observedAt || a.createdAt));

  if (!observations) return null;

  const deleteData = async (id) => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await API.delete({ path: `/territory-observation/${id}` });
      if (res.ok) {
        setTerritoryObservations((territoryObservations) => territoryObservations.filter((p) => p._id !== id));
      }
      if (!res.ok) return;
      toastr.success('Suppression réussie');
    }
  };

  return (
    <>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col md={9}>
          <Title>Observations</Title>
        </Col>
      </Row>
      <Box>
        <Row style={{ marginBottom: '30px', justifyContent: 'flex-end' }}>
          <Col md={3}>
            <ButtonCustom
              onClick={() => {
                setObservation({});
                setOpenObservationModale((k) => k + 1);
              }}
              color="primary"
              title="Nouvelle observation"
              padding="12px 24px"
            />
          </Col>
        </Row>
        {observations.map((obs) => (
          <Observation
            key={obs._id}
            obs={obs}
            onDelete={deleteData}
            onClick={() => {
              setObservation(obs);
              setOpenObservationModale((k) => k + 1);
            }}
          />
        ))}
      </Box>
      <CreateObservation observation={{ ...observation, territory: observation.territory || territory?._id }} forceOpen={openObservationModale} />
    </>
  );
};

const Title = styled.h1`
  font-size: 20px;
  font-weight: 800;
`;

export default List;
