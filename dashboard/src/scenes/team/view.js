/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Container, FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import API from '../../services/api';

import Header from '../../components/header';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import Box from '../../components/Box';
import BackButton from '../../components/backButton';
import NightSessionModale from '../../components/NightSessionModale';

const View = () => {
  const [team, setTeam] = useState(null);
  const { id } = useParams();
  const history = useHistory();

  useEffect(() => {
    (async () => {
      const { data } = await API.get({ path: `/team/${id}` });
      setTeam(data);
    })();
  }, []);

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await API.delete({ path: `/team/${id}` });
      if (!res.ok) return;
      toastr.success('Suppression réussie');
      history.goBack();
    }
  };

  if (!team) return <Loading />;

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={<BackButton />} />
      <Box>
        <Formik
          initialValues={team}
          onSubmit={async (body) => {
            try {
              const response = await API.put({ path: `/team/${team._id}`, body });
              if (response.ok) toastr.success('Mise à jour !');
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
                    <Label>Nom</Label>
                    <Input name="name" value={values.name} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={6} />
                <Col md={12}>
                  <FormGroup>
                    <Label>
                      Maraude de nuit <NightSessionModale />
                    </Label>
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                      <span>Maraude de nuit</span>
                      <Input type="checkbox" name="nightSession" checked={values.nightSession} onChange={handleChange} />
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
    </Container>
  );
};

export default View;
