import React, { useEffect, useMemo, useState } from 'react';
import { Col, FormGroup, Input, Modal, ModalBody, ModalHeader, Row, Label } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { useRecoilValue } from 'recoil';
import { SmallHeader } from '../../components/header';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import Loading from '../../components/loading';
import ButtonCustom from '../../components/ButtonCustom';
import Table from '../../components/table';
import CreateWrapper from '../../components/createWrapper';
import TagTeam from '../../components/TagTeam';
import { userState } from '../../recoil/auth';
import useApi from '../../services/api';
import { formatDateWithFullMonth } from '../../services/date';
import useTitle from '../../services/useTitle';
import SelectRole from '../../components/SelectRole';
import { useLocalStorage } from 'react-use';

const defaultSort = (a, b, sortOrder) => (sortOrder === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

const sortUsers = (sortBy, sortOrder) => (a, b) => {
  if (sortBy === 'email') {
    return sortOrder === 'ASC' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
  }
  if (sortBy === 'role') {
    if (a.role === b.role) return defaultSort(a, b, sortOrder);
    return sortOrder === 'ASC' ? a.role.localeCompare(b.role) : b.role.localeCompare(a.role);
  }
  if (sortBy === 'createdAt') {
    if (a.createdAt > b.createdAt) return sortOrder === 'ASC' ? 1 : -1;
    if (a.createdAt < b.createdAt) return sortOrder === 'ASC' ? -1 : 1;
    return defaultSort(a, b, sortOrder);
  }
  if (sortBy === 'lastLoginAt') {
    if (!a.lastLoginAt && !b.lastLoginAt) return defaultSort(a, b, sortOrder);
    if (!a.lastLoginAt) return sortOrder === 'ASC' ? 1 : -1;
    if (!b.lastLoginAt) return sortOrder === 'ASC' ? -1 : 1;
    if (a.lastLoginAt > b.lastLoginAt) return sortOrder === 'ASC' ? 1 : -1;
    if (a.lastLoginAt < b.lastLoginAt) return sortOrder === 'ASC' ? -1 : 1;
    return defaultSort(a, b, sortOrder);
  }
  // default sort: name
  return defaultSort(a, b, sortOrder);
};

const List = () => {
  const [users, setUsers] = useState([]);
  const history = useHistory();
  const [refresh, setRefresh] = useState(true);
  const user = useRecoilValue(userState);
  useTitle('Utilisateurs');
  const API = useApi();
  const [sortBy, setSortBy] = useLocalStorage('users-sortBy', 'createdAt');
  const [sortOrder, setSortOrder] = useLocalStorage('users-sortOrder', 'ASC');

  const getUsers = async () => {
    const response = await API.get({ path: '/user' });
    if (response.error) return toast.error(response.error);
    setUsers(response.data);
    setRefresh(false);
  };

  const data = useMemo(() => users.sort(sortUsers(sortBy, sortOrder)), [users, sortBy, sortOrder]);

  useEffect(() => {
    getUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  if (!!refresh) return <Loading />;
  return (
    <>
      <SmallHeader title="Utilisateurs" />
      {['superadmin', 'admin'].includes(user.role) && <Create onChange={() => setRefresh(true)} />}
      <Table
        data={data}
        rowKey={'_id'}
        onRowClick={(user) => history.push(`/user/${user._id}`)}
        columns={[
          {
            title: 'Nom',
            dataKey: 'name',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
          },
          {
            title: 'Email',
            dataKey: 'email',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
          },
          {
            title: 'Rôle',
            dataKey: 'role',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (user) => {
              return (
                <>
                  <div>{user.role}</div>
                  {user.healthcareProfessional ? <div>🧑‍⚕️ professionnel de santé</div> : ''}
                </>
              );
            },
          },
          {
            title: 'Équipes',
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
          {
            title: 'Créé le',
            dataKey: 'createdAt',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (i) => formatDateWithFullMonth(i.createdAt),
          },
          {
            title: 'Dernière connection le',
            dataKey: 'lastLoginAt',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (i) => (i.lastLoginAt ? formatDateWithFullMonth(i.lastLoginAt) : null),
          },
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
  const API = useApi();

  return (
    <CreateWrapper>
      <ButtonCustom onClick={() => setOpen(true)} color="primary" title="Créer un nouvel utilisateur" padding="12px 24px" />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
        <ModalHeader toggle={() => setOpen(false)}>Créer un nouvel utilisateur</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{ name: '', email: '', role: '', team: [], healthcareProfessional: false }}
            validate={(values) => {
              const errors = {};
              if (!values.name) errors.name = 'Le nom est obligatoire';
              if (!values.email) errors.email = "L'email est obligatoire";
              else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) errors.email = "L'email est invalide";
              if (!values.role) errors.role = 'Le rôle est obligatoire';
              if (!values.team?.length) errors.team = 'Veuillez sélectionner une équipe';
              return errors;
            }}
            onSubmit={async (body, actions) => {
              try {
                const { ok } = await API.post({ path: '/user', body });
                actions.setSubmitting(false);
                if (!ok) return;
                toast.success('Création réussie !');
                onChange();
                setOpen(false);
              } catch (errorCreatingUser) {
                console.log('error in creating user', errorCreatingUser);
                toast.error(errorCreatingUser.message);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting, errors, touched }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="name">Nom</Label>
                      <Input name="name" id="name" value={values.name} onChange={handleChange} />
                      {touched.name && errors.name && <Error>{errors.name}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="email">Email</Label>
                      <Input name="email" id="email" value={values.email} onChange={handleChange} />
                      {touched.email && errors.email && <Error>{errors.email}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="role">Role</Label>
                      <SelectRole handleChange={handleChange} value={values.role} />
                      {touched.role && errors.role && <Error>{errors.role}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="team">Équipes</Label>
                      <div>
                        <SelectTeamMultiple
                          onChange={(teamIds) => handleChange({ target: { value: teamIds, name: 'team' } })}
                          value={values.team || []}
                          colored
                          inputId="team"
                        />
                        {touched.team && errors.team && <Error>{errors.team}</Error>}
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <Label htmlFor="healthcareProfessional" style={{ marginBottom: 0 }}>
                      <input
                        type="checkbox"
                        style={{ marginRight: '0.5rem' }}
                        name="healthcareProfessional"
                        id="healthcareProfessional"
                        checked={values.healthcareProfessional}
                        onChange={handleChange}
                      />
                      Professionnel de santé
                    </Label>
                    <div>
                      <small className="text-muted">Un professionnel de santé à accès au dossier médical complet des personnes.</small>
                    </div>
                  </Col>
                </Row>
                <br />
                <Row>
                  <Col md={6}>
                    <ButtonCustom title="Sauvegarder" loading={isSubmitting} onClick={handleSubmit} />
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

const Error = styled.span`
  color: red;
  font-size: 11px;
`;

export default List;
