/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Container, FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import ButtonCustom from '../../components/ButtonCustom';
import Header from '../../components/header';
import Loading from '../../components/loading';
import BackButton from '../../components/backButton';
import Box from '../../components/Box';
import useApi from '../../services/api';

const View = () => {
  const [structure, setStructure] = useState(null);
  const { id } = useParams();
  const history = useHistory();
  const API = useApi();

  useEffect(() => {
    (async () => {
      const { data } = await API.get({ path: `/structure/${id}` });
      setStructure(data);
    })();
  }, []);

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const response = await API.delete({ path: `/structure/${id}` });
      if (response.ok) toastr.success('Suppression réussie');
      history.goBack();
    }
  };

  if (!structure) return <Loading />;

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={<BackButton />} />
      <Box>
        <Formik
          initialValues={structure}
          onSubmit={async (body) => {
            const res = await API.put({ path: `/structure/${id}`, body });
            if (res.ok) toastr.success('Structure modifiée avec succès');
            history.goBack();
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => (
            <React.Fragment>
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label>Nom</Label>
                    <Input name="name" value={values.name} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Description</Label>
                    <Input type="textarea" name="description" value={values.description} onChange={handleChange} />
                  </FormGroup>
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ButtonCustom loading={isSubmitting} color="info" onClick={handleSubmit} title="Mettre à jour" />
                <ButtonCustom style={{ marginLeft: 10 }} color="danger" onClick={deleteData} title="Supprimer" />
              </div>
            </React.Fragment>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default View;
