import React, { useEffect, useState } from 'react';
import { FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import { SmallerHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import Box from '../../components/Box';
import NightSessionModale from '../../components/NightSessionModale';
import { currentTeamState, teamsState } from '../../recoil/auth';
import useApi from '../../services/api';
import { useRecoilState } from 'recoil';

const View = () => {
  const [team, setTeam] = useState(null);
  const { id } = useParams();
  const history = useHistory();

  const [currentTeam, setCurrentTeam] = useRecoilState(currentTeamState);
  const [teams, setTeams] = useRecoilState(teamsState);

  const API = useApi();

  const getTeam = async () => {
    const { data } = await API.get({ path: `/team/${id}` });
    setTeam(data);
  };

  useEffect(() => {
    getTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await API.delete({ path: `/team/${id}` });
      if (!res.ok) return;
      setTeams(teams.filter((t) => t._id !== id));
      toastr.success('Suppression réussie');
      history.goBack();
    }
  };

  if (!team) return <Loading />;

  return (
    <>
      <SmallerHeaderWithBackButton />
      <Box>
        <Formik
          initialValues={team}
          onSubmit={async (body) => {
            try {
              const response = await API.put({ path: `/team/${team._id}`, body });
              if (response.ok) {
                toastr.success('Mise à jour !');
                setTeams(
                  teams.map((t) => {
                    if (t._id !== id) return t;
                    return response.data;
                  })
                );
                if (currentTeam._id === id) setCurrentTeam(response.data);
              }
            } catch (errorUpdatingTeam) {
              console.log('error in updating team', errorUpdatingTeam);
              toastr.error('Erreur!', errorUpdatingTeam.message);
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => (
            <React.Fragment>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="name">Nom</Label>
                    <Input name="name" id="name" value={values.name} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={6} />
                <Col md={12}>
                  <FormGroup>
                    <Label />
                    <div style={{ display: 'flex', marginLeft: 20, width: '80%' }}>
                      <label htmlFor="nightSession">Maraude de nuit</label>
                      <Input type="checkbox" name="nightSession" id="nightSession" checked={values.nightSession} onChange={handleChange} />
                      <NightSessionModale />
                    </div>
                  </FormGroup>
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} width={200} />
                <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
              </div>
            </React.Fragment>
          )}
        </Formik>
      </Box>
    </>
  );
};

export default View;
