import React, { useEffect, useState } from 'react';
import { FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toast } from 'react-toastify';

import { SmallHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import NightSessionModale from '../../components/NightSessionModale';
import { currentTeamState, teamsState } from '../../recoil/auth';
import useApi from '../../services/api';
import { useRecoilState } from 'recoil';
import useTitle from '../../services/useTitle';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';

const View = () => {
  const [team, setTeam] = useState(null);
  const { id } = useParams();
  const history = useHistory();
  useTitle(`Équipes ${team?.name}`);

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

  if (!team) return <Loading />;

  return (
    <>
      <SmallHeaderWithBackButton />
      <Formik
        initialValues={team}
        enableReinitialize
        onSubmit={async (body) => {
          try {
            const response = await API.put({ path: `/team/${team._id}`, body });
            if (response.ok) {
              toast.success('Mise à jour !');
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
            toast.error(errorUpdatingTeam.message);
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <DeleteButtonAndConfirmModal
                title={`Voulez-vous vraiment supprimer l'équipe ${team.name}`}
                textToConfirm={team.name}
                onConfirm={async () => {
                  const res = await API.delete({ path: `/team/${id}` });
                  if (!res.ok) return;
                  setTeams(teams.filter((t) => t._id !== id));
                  toast.success('Suppression réussie');
                  history.goBack();
                }}>
                <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
                  Cette opération est irréversible
                  <br />
                </span>
              </DeleteButtonAndConfirmModal>
              <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} />
            </div>
          </React.Fragment>
        )}
      </Formik>
    </>
  );
};

export default View;
