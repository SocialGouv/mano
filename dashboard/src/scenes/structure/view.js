import React, { useEffect, useState } from 'react';
import { FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams, useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import ButtonCustom from '../../components/ButtonCustom';
import { SmallerHeaderWithBackButton } from '../../components/header';
import Loading from '../../components/loading';
import Box from '../../components/Box';
import useApi from '../../services/api';
import useTitle from '../../services/useTitle';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';

const View = () => {
  const [structure, setStructure] = useState(null);
  const { id } = useParams();
  const history = useHistory();
  const API = useApi();

  const getStructure = async () => {
    const { data } = await API.get({ path: `/structure/${id}` });
    setStructure(data);
  };

  useEffect(() => {
    getStructure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useTitle(`${structure?.name} - Structure`);

  if (!structure) return <Loading />;

  return (
    <>
      <SmallerHeaderWithBackButton />
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
                    <Label htmlFor="name">Nom</Label>
                    <Input name="name" id="name" value={values.name} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label htmlFor="description">Description</Label>
                    <Input type="textarea" name="description" id="description" value={values.description} onChange={handleChange} />
                  </FormGroup>
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <DeleteButtonAndConfirmModal
                  title={`Voulez-vous vraiment supprimer la structure ${structure.name}`}
                  textToConfirm={structure.name}
                  onConfirm={async () => {
                    const response = await API.delete({ path: `/structure/${id}` });
                    if (response.ok) toastr.success('Suppression réussie');
                    history.goBack();
                  }}>
                  <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
                    Cette opération est irréversible
                    <br />
                    et entrainera la suppression définitive de cette structure
                    <br />
                    pour toutes les organisations qui utilisent Mano
                  </span>
                </DeleteButtonAndConfirmModal>
                <ButtonCustom loading={isSubmitting} onClick={handleSubmit} title="Mettre à jour" />
              </div>
            </React.Fragment>
          )}
        </Formik>
      </Box>
    </>
  );
};

export default View;
