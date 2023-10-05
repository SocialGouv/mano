import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useRecoilValue } from 'recoil';
import { teamsState, userState } from '../../recoil/auth';
import API from '../../services/api';
import { formatDateWithFullMonth } from '../../services/date';
import useTitle from '../../services/useTitle';
import { useLocalStorage } from '../../services/useLocalStorage';
import { ModalBody, ModalContainer, ModalHeader, ModalFooter } from '../../components/tailwind/Modal';
import { SmallHeader } from '../../components/header';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import Loading from '../../components/loading';
import Table from '../../components/table';
import TagTeam from '../../components/TagTeam';
import SelectRole from '../../components/SelectRole';
import { emailRegex } from '../../utils';

const defaultSort = (a, b, sortOrder) => (sortOrder === 'ASC' ? (a.name || '').localeCompare(b.name) : (b.name || '').localeCompare(a.name));

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

  const [sortBy, setSortBy] = useLocalStorage('users-sortBy', 'createdAt');
  const [sortOrder, setSortOrder] = useLocalStorage('users-sortOrder', 'ASC');

  const data = useMemo(() => users.sort(sortUsers(sortBy, sortOrder)), [users, sortBy, sortOrder]);

  useEffect(() => {
    API.get({ path: '/user' }).then((response) => {
      if (response.error) {
        toast.error(response.error);
        return false;
      }
      setUsers(response.data);
      setRefresh(false);
    });
  }, [refresh]);

  if (!users.length) return <Loading />;
  return (
    <>
      <SmallHeader title="Utilisateurs" />
      {['admin'].includes(user.role) && <Create users={users} onChange={() => setRefresh(true)} />}
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
                  {user.healthcareProfessional ? <div>🧑‍⚕️ professionnel·le de santé</div> : ''}
                </>
              );
            },
          },
          {
            title: 'Équipes',
            dataKey: 'teams',
            render: (user) => {
              return (
                <div className="tw-flex tw-flex-col tw-gap-1">
                  {user.teams.map((t) => (
                    <TagTeam teamId={t._id} key={t._id} />
                  ))}
                </div>
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

const Create = ({ onChange, users }) => {
  const [open, setOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const teams = useRecoilValue(teamsState);
  const initialState = useMemo(() => {
    return {
      name: '',
      email: '',
      role: 'normal',
      team: teams.map((t) => t._id),
      healthcareProfessional: false,
    };
  }, [teams]);
  useEffect(() => {
    if (!open) setData(initialState);
  }, [open, initialState]);
  const [data, setData] = useState(initialState);
  const handleChange = (event) => {
    const target = event.currentTarget || event.target;
    const { name, value } = target;
    setData((data) => ({ ...data, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (data.role === 'restricted-access') data.healthcareProfessional = false;
      if (!data.email) {
        toast.error("L'email est obligatoire");
        return false;
      }
      if (!emailRegex.test(data.email)) {
        toast.error("L'email est invalide");
        return false;
      }
      if (!data.name) {
        toast.error('Le nom est obligatoire');
        return false;
      }
      if (!data.role) {
        toast.error('Le rôle est obligatoire');
        return false;
      }
      if (!data.team?.length) {
        toast.error('Veuillez sélectionner une équipe');
        return false;
      }
      setIsSubmitting(true);
      const { ok } = await API.post({ path: '/user', body: data });
      setIsSubmitting(false);
      if (!ok) {
        return false;
      }
      toast.success('Création réussie !');
      onChange();
      setData(initialState);
      return true;
    } catch (errorCreatingUser) {
      console.log('error in creating user', errorCreatingUser);
      toast.error(errorCreatingUser.message);
      setIsSubmitting(false);
      return false;
    }
  };

  return (
    <div className="tw-mb-10 tw-flex tw-w-full tw-justify-end">
      <button type="button" className="button-submit" onClick={() => setOpen(true)}>
        Créer un nouvel utilisateur
      </button>
      <ModalContainer open={open} onClose={() => setOpen(false)} size="full">
        <ModalHeader onClose={() => setOpen(false)} title="Créer de nouveaux utilisateurs" />
        <ModalBody>
          <form
            id="create-user-form"
            initialValues={{ name: '', email: '', role: '', team: [], healthcareProfessional: false }}
            className="tw-p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await handleSubmit();
            }}>
            <div className="tw-flex tw-w-full tw-flex-wrap">
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label htmlFor="email">Email</label>
                <input
                  className="tailwindui"
                  placeholder="email@truc.fr"
                  name="email"
                  id="email"
                  value={data.email}
                  onChange={(event) => {
                    const target = event.currentTarget || event.target;
                    const { value } = target;
                    if (data.email === data.name) {
                      setData((data) => ({ ...data, email: value, name: value }));
                    } else {
                      setData((data) => ({ ...data, email: value }));
                    }
                  }}
                />
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label htmlFor="role">Role</label>
                <div className="tw-mt-1 tw-w-full">
                  <SelectRole handleChange={handleChange} value={data.role} />
                </div>
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label htmlFor="team">Équipe(s)</label>
                <div className="tw-mt-1 tw-w-full">
                  <SelectTeamMultiple
                    onChange={(teamIds) => handleChange({ target: { value: teamIds, name: 'team' } })}
                    value={data.team}
                    inputId="team"
                    name="team"
                  />
                </div>
              </div>
              <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
                <label htmlFor="email">Nom</label>
                <input
                  className="tailwindui"
                  placeholder="email@truc.fr"
                  name="name"
                  id="name"
                  type="search"
                  value={data.name}
                  onChange={handleChange}
                />
              </div>
              {data.role !== 'restricted-access' && (
                <div className="tw-flex tw-basis-full tw-flex-col tw-px-4 tw-py-2">
                  <label htmlFor="healthcareProfessional" style={{ marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      style={{ marginRight: '0.5rem' }}
                      name="healthcareProfessional"
                      id="healthcareProfessional"
                      checked={data.healthcareProfessional}
                      onChange={() => {
                        handleChange({
                          target: {
                            name: 'healthcareProfessional',
                            checked: Boolean(!data.healthcareProfessional),
                            value: Boolean(!data.healthcareProfessional),
                          },
                        });
                      }}
                    />
                    Professionnel·le de santé
                  </label>
                  <div>
                    <small className="text-muted">Un professionnel·le de santé a accès au dossier médical complet des personnes.</small>
                  </div>
                </div>
              )}
            </div>
            <details className="tw-mt-8">
              <summary>Utilisateurs existants ({users?.length ?? 0})</summary>
              <ul className="tw-mt-4 tw-grid tw-grid-cols-2 tw-flex-col tw-gap-2">
                {users.map((user) => {
                  return (
                    <React.Fragment key={user._id}>
                      <div className="tw-font-bold">{user.name}</div>
                      <div className="tw-text-sm tw-text-gray-500">{user.email}</div>
                    </React.Fragment>
                  );
                })}
              </ul>
            </details>
          </form>
        </ModalBody>
        <ModalFooter>
          <button name="Fermer" type="button" className="button-cancel" onClick={() => setOpen(false)}>
            Fermer
          </button>
          <button
            type="button"
            name="Fermer"
            className="button-classic"
            onClick={async () => {
              const success = await handleSubmit();
              if (success) setOpen(false);
            }}
            disabled={isSubmitting}>
            Créer et fermer
          </button>
          <button type="submit" className="button-submit" form="create-user-form" disabled={isSubmitting}>
            Créer et ajouter un autre
          </button>
        </ModalFooter>
      </ModalContainer>
    </div>
  );
};

export default List;
