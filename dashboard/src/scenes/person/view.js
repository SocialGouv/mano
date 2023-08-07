import React, { useState } from 'react';
import { Container, Nav, NavItem, TabContent, TabPane, FormGroup, Input, Label, Row, Col } from 'reactstrap';

import { useParams } from 'react-router-dom';
import { Formik } from 'formik';

import Header from '../../components/header';
import Loading from '../../components/loading';
import Button from '../../components/Button';
import BackButton from '../../components/backButton';
import Box from '../../components/Box';
import TabButton from '../../components/tabButton';
import { personsObjectSelector } from '../../recoil/selectors';
import { useRecoilValue } from 'recoil';

export default function PersonView() {
  const [activeTab, setActiveTab] = useState('1');
  const { personId } = useParams();
  const person = useRecoilValue(personsObjectSelector)[personId];

  if (!person) return <Loading />;

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={<BackButton />} />
      <Box>
        <Nav tabs style={{ marginBottom: 30 }}>
          <NavItem>
            <TabButton style={{ backgroundColor: activeTab === '1' && '#eee' }} onClick={() => setActiveTab('1')}>
              Voir
            </TabButton>
          </NavItem>
          <NavItem>
            <TabButton style={{ backgroundColor: activeTab === '2' && '#eee' }} onClick={() => setActiveTab('2')}>
              Data
            </TabButton>
          </NavItem>
        </Nav>
        <TabContent activeTab={activeTab}>
          <TabPane tabId="1">
            <Formik
              initialValues={person}
              onSubmit={async (values) => {
                // try {
                //   await api.put(`/person?organisation_id=${organisation._id}`, values);
                //   toastr.success("Mis à jour !");
                // } catch (e) {
                //   console.log(e);
                //   toastr.error("Erreur!");
                // }
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
                  </Row>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button title={'Supprimer'} disabled style={{ marginRight: 10 }} color="danger" width={200} />
                    <Button title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
                  </div>
                </React.Fragment>
              )}
            </Formik>
          </TabPane>
          <TabPane tabId="2">
            <pre>
              {Object.keys(person).map((e) => (
                <div key={e}>
                  <strong>{e}:</strong> {JSON.stringify(person[e])}
                </div>
              ))}
            </pre>
          </TabPane>
        </TabContent>
      </Box>
    </Container>
  );
}
