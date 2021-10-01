/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext } from 'react';
import { Container, FormGroup, Input, Label, Row, Col } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import API from '../../services/api';
import Header from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import BackButton from '../../components/backButton';
import Box from '../../components/Box';
import DeleteOrganisation from '../../components/DeleteOrganisation';
import EncryptionKey from '../../components/EncryptionKey';
import SelectCustom from '../../components/SelectCustom';
import AuthContext from '../../contexts/auth';
import { actionsCategories } from '../../contexts/actions';
import styled from 'styled-components';
import { defaultCustomFields } from '../../contexts/territoryObservations';
import TableCustomeFields from '../../components/TableCustomFields';

const View = () => {
  const { organisation, setAuth } = useContext(AuthContext);

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={<BackButton />} />
      <Box>
        <Formik
          initialValues={{ ...organisation, receptionEnabled: organisation.receptionEnabled || false }}
          onSubmit={async (body) => {
            try {
              const response = await API.put({ path: `/organisation/${organisation._id}`, body });
              if (response.ok) {
                toastr.success('Mise à jour !');
                setAuth({ organisation: response.data });
              }
            } catch (orgUpdateError) {
              console.log('error in updating organisation', orgUpdateError);
              toastr.error('Erreur!', orgUpdateError.message);
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting }) => {
            return (
              <React.Fragment>
                <Title>Infos</Title>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nom</Label>
                      <Input name="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                  <DeleteOrganisation />
                  <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                </div>
                <hr />
                <Title>Encryption</Title>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                  <EncryptionKey />
                </div>
                <hr />
                <Title>Réglage des Actions</Title>
                <Row>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Categories des actions</Label>
                      <SelectCustom
                        creatable
                        options={actionsCategories.sort((c1, c2) => c1.localeCompare(c2)).map((cat) => ({ value: cat, label: cat }))}
                        value={(values.categories || []).map((cat) => ({ value: cat, label: cat }))}
                        isMulti
                        onChange={(cats) => handleChange({ target: { value: cats.map((cat) => cat.value), name: 'categories' } })}
                        placeholder={' -- Choisir -- '}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                  <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                </div>
                <hr />
                <Title>Réglage de l'Accueil de jour</Title>
                <Row>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Accueil de jour activé</Label>
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                        <span>Accueil de jour activé</span>
                        <Input type="checkbox" name="receptionEnabled" checked={values.receptionEnabled || false} onChange={handleChange} />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <FormGroup>
                      <Label>Services disponibles</Label>
                      <SelectCustom
                        creatable
                        options={(organisation.services || []).sort((c1, c2) => c1.localeCompare(c2)).map((cat) => ({ value: cat, label: cat }))}
                        value={(values.services || []).map((cat) => ({ value: cat, label: cat }))}
                        isMulti
                        onChange={(cats) => handleChange({ target: { value: cats.map((cat) => cat.value), name: 'services' } })}
                        placeholder={' -- Choisir -- '}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                  <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                </div>
                <hr />
                <Title>Réglage des Observations</Title>
                <Row>
                  <TableCustomeFields
                    customFields="customFieldsObs"
                    data={organisation.customFieldsObs ? JSON.parse(organisation.customFieldsObs) : defaultCustomFields}
                  />
                </Row>
              </React.Fragment>
            );
          }}
        </Formik>
      </Box>
    </Container>
  );
};

const Title = styled.h2`
  font-size: 20px;
  font-weight: 800;
  display: flex;
  justify-content: space-between;
  margin: 40px 0;
  span {
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 400;
    font-style: italic;
    display: block;
  }
`;
export default View;
