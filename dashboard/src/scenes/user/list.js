/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Col, FormGroup, Input, Modal, ModalBody, ModalHeader, Row, Label } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';
import { useRecoilValue } from 'recoil';
import Header from '../../components/header';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import Table from '../../components/table';
import CreateWrapper from '../../components/createWrapper';
import SelectCustom from '../../components/SelectCustom';
import TagTeam from '../../components/TagTeam';
import { organisationState, userState } from '../../recoil/auth';
import useApi from '../../services/api';
import { formatDateWithFullMonth } from '../../services/date';

const List = () => {
  const [users, setUsers] = useState(null);
  const history = useHistory();
  const [refresh, setRefresh] = useState(false);
  const user = useRecoilValue(userState);
  const API = useApi();

  useEffect(() => {
    (async () => {
      const { data } = await API.get({ path: '/user' });
      setUsers(data);
    })();
  }, [refresh]);

  if (!users) return <Loading />;
  return (
    <>
      <Header titleStyle={{ fontWeight: 400 }} title="Utilisateurs" />
      {['superadmin', 'admin'].includes(user.role) && <Create onChange={() => setRefresh(true)} />}
      <Table
        data={users}
        rowKey={'_id'}
        onRowClick={(user) => history.push(`/user/${user._id}`)}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          { title: 'Email', dataKey: 'email' },
          {
            title: 'Equipe',
            dataKey: 'teams',
            render: (user) => {
              return (
                <TeamWrapper>
                  {user.teams.map((t) => (
                    <TagTeam teamId={t._id} key={t._id} />
                  ))}
                </TeamWrapper>
              );
            },
          },
          { title: 'Créée le', dataKey: 'createdAt', render: (i) => formatDateWithFullMonth(i.createdAt) },
          { title: 'Dernière connection le', dataKey: 'lastLoginAt', render: (i) => formatDateWithFullMonth(i.lastLoginAt) },
        ]}
      />
    </>
  );
};

const TeamWrapper = styled.div`
  display: grid;
  grid-auto-flow: row;
  row-gap: 5px;
`;

const Create = ({ onChange }) => {
  const [open, setOpen] = useState(false);
  const organisation = useRecoilValue(organisationState);
  const API = useApi();

  return (
    <CreateWrapper>
      <ButtonCustom onClick={() => setOpen(true)} color="primary" title="Créer un nouvel utilisateur" padding="12px 24px" />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>Créer un nouvel utilisateur</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: '', email: '' }}
            onSubmit={async (body, actions) => {
              try {
                body.organisation = organisation._id;
                const res = await API.post({ path: '/user', body });
                actions.setSubmitting(false);
                if (!res.ok) return;
                toastr.success('Création réussie !');
                onChange();
                setOpen(false);
              } catch (errorCreatingUser) {
                console.log('error in creating user', errorCreatingUser);
                toastr.error('Erreur!', errorCreatingUser.message);
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
                  <Col md={6}>
                    <FormGroup>
                      <Label>Email</Label>
                      <Input name="email" value={values.email} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Role</Label>
                      <SelectCustom
                        options={['normal', 'admin'].map((role) => ({ value: role, label: role }))}
                        onChange={({ value }) => handleChange({ target: { value, name: 'role' } })}
                        value={{ value: values.role, label: values.role }}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Équipes</Label>
                      <div>
                        <SelectTeamMultiple
                          onChange={(team) => handleChange({ target: { value: team || [], name: 'team' } })}
                          value={values.team || []}
                          colored
                        />
                      </div>
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <Row>
                  <Col md={6}>
                    <ButtonCustom title="Sauvegarder" loading={isSubmitting} color="info" onClick={handleSubmit} />
                  </Col>
                </Row>
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </CreateWrapper>
  );
};

export default List;
