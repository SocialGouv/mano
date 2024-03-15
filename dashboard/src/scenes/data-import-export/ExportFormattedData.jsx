import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useRecoilValue } from 'recoil';
import { personFieldsIncludingCustomFieldsSelector, personsState } from '../../recoil/persons';
import { utils, writeFile } from '@e965/xlsx';
import { dayjsInstance } from '../../services/date';
import { teamsState, userState } from '../../recoil/auth';
import API from '../../services/api';
import { customFieldsObsSelector } from '../../recoil/territoryObservations';
import { territoriesState } from '../../recoil/territory';
import { flattenedCustomFieldsConsultationsSelector } from '../../recoil/consultations';

// Source: https://tailwindui.com/components/application-ui/elements/dropdowns
export default function ExportFormattedData({ personCreated, personUpdated, actions, rencontres, passages, observations, consultations }) {
  const teams = useRecoilValue(teamsState);
  const persons = useRecoilValue(personsState);
  const territories = useRecoilValue(territoriesState);
  const user = useRecoilValue(userState);
  const personFieldsIncludingCustomFields = useRecoilValue(personFieldsIncludingCustomFieldsSelector);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const consultationsFields = useRecoilValue(flattenedCustomFieldsConsultationsSelector);
  const [users, setUsers] = useState([]);

  async function fetchUsers() {
    if (users.length) return users;
    const response = await API.get({ path: '/user' });
    if (response.data) {
      setUsers(response.data);
      return response.data;
    }
    return [];
  }

  const transformPerson = (loadedUsers) => (person) => {
    return {
      id: person._id,
      ...personFieldsIncludingCustomFields
        .filter((field) => !['_id', 'user', 'organisation', 'createdAt', 'updatedAt', 'documents', 'history'].includes(field.name))
        .reduce((fields, field) => {
          if (field.name === 'assignedTeams') {
            fields[field.label] = (person[field.name] || []).map((t) => teams.find((person) => person._id === t)?.name)?.join(', ');
          } else if (field.name === 'user') {
          } else if (['date', 'date-with-time', 'duration'].includes(field.type))
            fields[field.label || field.name] = person[field.name]
              ? dayjsInstance(person[field.name]).format(field.type === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm')
              : '';
          else if (['boolean'].includes(field.type)) fields[field.label || field.name] = person[field.name] ? 'Oui' : 'Non';
          else if (['yes-no'].includes(field.type)) fields[field.label || field.name] = person[field.name];
          else if (Array.isArray(person[field.name])) fields[field.label || field.name] = person[field.name].join(', ');
          else fields[field.label || field.name] = person[field.name];
          return fields;
        }, {}),
      'Créée par': loadedUsers.find((u) => u._id === person.user)?.name,
      'Créée le': dayjsInstance(person.createdAt).format('YYYY-MM-DD HH:mm'),
      'Mise à jour le': dayjsInstance(person.updatedAt).format('YYYY-MM-DD HH:mm'),
    };
  };

  const transformAction = (loadedUsers) => (action) => {
    return {
      id: action._id,
      Nom: action.name,
      Description: action.description,
      Catégories: (action.categories || []).join(', '),
      'Personne suivie - Nom': persons.find((p) => p._id === action.person)?.name,
      'Personne suivie - id': persons.find((p) => p._id === action.person)?._id,
      Groupe: action.group,
      Structure: action.structure,
      'Avec heure': action.withTime ? 'Oui' : 'Non',
      Équipe: action.teams?.length ? action.teams.map((t) => teams.find((team) => team._id === t)?.name).join(', ') : action.team,
      Urgent: action.urgent ? 'Oui' : 'Non',
      Statut: action.status,
      'Complétée le': action.completedAt ? dayjsInstance(action.completedAt).format('YYYY-MM-DD HH:mm') : '',
      'À faire le': action.dueAt ? dayjsInstance(action.dueAt).format(action.withTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD') : '',
      'Créée par': loadedUsers.find((u) => u._id === action.user)?.name,
      'Créée le': dayjsInstance(action.createdAt).format('YYYY-MM-DD HH:mm'),
      'Mise à jour le': dayjsInstance(action.updatedAt).format('YYYY-MM-DD HH:mm'),
    };
  };

  const transformConsultation = (loadedUsers) => (consultation) => {
    return {
      id: consultation._id,
      Équipe: consultation.teams?.length ? consultation.teams.map((t) => teams.find((team) => team._id === t)?.name).join(', ') : consultation.team,
      'Avec heure': consultation.withTime ? 'Oui' : 'Non',
      Statut: consultation.status,
      'Personne suivie - Nom': persons.find((p) => p._id === consultation.person)?.name,
      'Personne suivie - id': persons.find((p) => p._id === consultation.person)?._id,
      Type: consultation.type,
      ...consultationsFields.reduce((fields, field) => {
        if (['date', 'date-with-time', 'duration'].includes(field.type))
          fields[field.label || field.name] = consultation[field.name]
            ? dayjsInstance(consultation[field.name]).format(field.type === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm')
            : '';
        else if (['boolean'].includes(field.type)) fields[field.label || field.name] = consultation[field.name] ? 'Oui' : 'Non';
        else if (['yes-no'].includes(field.type)) fields[field.label || field.name] = consultation[field.name];
        else if (Array.isArray(consultation[field.name])) fields[field.label || field.name] = consultation[field.name].join(', ');
        else fields[field.label || field.name] = consultation[field.name];
        return fields;
      }, {}),
      'Complétée le': consultation.completedAt ? dayjsInstance(consultation.completedAt).format('YYYY-MM-DD HH:mm') : '',
      'À faire le': consultation.dueAt ? dayjsInstance(consultation.dueAt).format(consultation.withTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD') : '',
      'Créée par': loadedUsers.find((u) => u._id === consultation.user)?.name,
      'Créée le': dayjsInstance(consultation.createdAt).format('YYYY-MM-DD HH:mm'),
      'Mise à jour le': dayjsInstance(consultation.updatedAt).format('YYYY-MM-DD HH:mm'),
    };
  };

  const transformRencontre = (loadedUsers) => (rencontre) => {
    return {
      id: rencontre._id,
      'Personne suivie - Nom': persons.find((p) => p._id === rencontre.person)?.name,
      'Personne suivie - id': persons.find((p) => p._id === rencontre.person)?._id,
      Équipe: rencontre.team ? teams.find((t) => t._id === rencontre.team)?.name : '',
      Date: dayjsInstance(rencontre.date).format('YYYY-MM-DD HH:mm'),
      Commentaire: rencontre.comment,
      'Créée par': loadedUsers.find((u) => u._id === rencontre.user)?.name,
      'Créée le': dayjsInstance(rencontre.createdAt).format('YYYY-MM-DD HH:mm'),
      'Mise à jour le': dayjsInstance(rencontre.updatedAt).format('YYYY-MM-DD HH:mm'),
    };
  };

  const transformPassage = (loadedUsers) => (passage) => {
    return {
      id: passage._id,
      'Personne suivie - Nom': persons.find((p) => p._id === passage.person)?.name,
      'Personne suivie - id': persons.find((p) => p._id === passage.person)?._id,
      Équipe: passage.team ? teams.find((t) => t._id === passage.team)?.name : '',
      Date: dayjsInstance(passage.date).format('YYYY-MM-DD HH:mm'),
      Commentaire: passage.comment,
      'Créée par': loadedUsers.find((u) => u._id === passage.user)?.name,
      'Créée le': dayjsInstance(passage.createdAt).format('YYYY-MM-DD HH:mm'),
      'Mise à jour le': dayjsInstance(passage.updatedAt).format('YYYY-MM-DD HH:mm'),
    };
  };

  const transformObservation = (loadedUsers) => (observation) => {
    return {
      id: observation._id,
      'Territoire - Nom': territories.find((t) => t._id === observation.territory)?.name,
      'Observé le': dayjsInstance(observation.observedAt).format('YYYY-MM-DD HH:mm'),
      Équipe: observation.team ? teams.find((t) => t._id === observation.team)?.name : '',
      ...customFieldsObs.reduce((fields, field) => {
        if (['date', 'date-with-time', 'duration'].includes(field.type))
          fields[field.label || field.name] = observation[field.name]
            ? dayjsInstance(observation[field.name]).format(field.type === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm')
            : '';
        else if (['boolean'].includes(field.type)) fields[field.label || field.name] = observation[field.name] ? 'Oui' : 'Non';
        else if (['yes-no'].includes(field.type)) fields[field.label || field.name] = observation[field.name];
        else if (Array.isArray(observation[field.name])) fields[field.label || field.name] = observation[field.name].join(', ');
        else fields[field.label || field.name] = observation[field.name];
        return fields;
      }, {}),
      'Créée par': loadedUsers.find((u) => u._id === observation.user)?.name,
      'Créée le': dayjsInstance(observation.createdAt).format('YYYY-MM-DD HH:mm'),
      'Mise à jour le': dayjsInstance(observation.updatedAt).format('YYYY-MM-DD HH:mm'),
    };
  };

  async function exportXlsx(name, json) {
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(json);
    utils.book_append_sheet(wb, ws, name);
    writeFile(wb, name + '.xlsx');
  }

  return (
    <Menu as="div" className="tw-relative tw-inline-block tw-text-left">
      <div>
        {['admin'].includes(user.role) && (
          <Menu.Button className="tw-inline-flex tw-w-full tw-justify-center tw-rounded-md tw-border tw-border-gray-300 tw-bg-main tw-py-2 tw-px-4 tw-text-sm tw-font-medium tw-text-white focus:tw-outline-none">
            Télécharger un export
            <div className="-tw-mr-1 -tw-mt-1 tw-ml-2 tw-h-5 tw-w-5" aria-hidden="true">
              ⌄
            </div>
          </Menu.Button>
        )}
      </div>
      <Transition
        as={Fragment}
        enter="tw-transition tw-ease-out tw-duration-100"
        enterFrom="tw-transform tw-opacity-0 tw-scale-95"
        enterTo="tw-transform tw-opacity-100 tw-scale-100"
        leave="tw-transition tw-ease-in tw-duration-75"
        leaveFrom="tw-transform tw-opacity-100 tw-scale-100"
        leaveTo="tw-transform tw-opacity-0 tw-scale-95">
        <Menu.Items className="tw-absolute tw-right-0 tw-z-50 tw-mt-2 tw-w-56 tw-origin-top-right tw-rounded-md tw-bg-white tw-shadow-lg tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none">
          <div className="tw-py-1">
            <MenuItem
              text="Personnes suivies"
              onClick={async () => {
                const loadedUsers = await fetchUsers();
                exportXlsx('Personnes suivies', personUpdated.map(transformPerson(loadedUsers)));
              }}
            />
            <MenuItem
              text="Personnes créées"
              onClick={async () => {
                const loadedUsers = await fetchUsers();
                exportXlsx('Personnes créées', personCreated.map(transformPerson(loadedUsers)));
              }}
            />
            <MenuItem
              text="Actions"
              onClick={async () => {
                const loadedUsers = await fetchUsers();
                exportXlsx(
                  'Actions',
                  actions
                    .reduce((uniqueActions, action) => {
                      if (!uniqueActions.find((a) => a._id === action._id)) uniqueActions.push(action);
                      return uniqueActions;
                    }, [])
                    .map(transformAction(loadedUsers))
                );
              }}
            />
            <MenuItem
              text="Consultations"
              onClick={async () => {
                const loadedUsers = await fetchUsers();
                exportXlsx('Consultations', consultations.map(transformConsultation(loadedUsers)));
              }}
            />
            <MenuItem
              text="Rencontres"
              onClick={async () => {
                const loadedUsers = await fetchUsers();
                exportXlsx('Rencontres', rencontres.map(transformRencontre(loadedUsers)));
              }}
            />
            <MenuItem
              text="Passages"
              onClick={async () => {
                const loadedUsers = await fetchUsers();
                exportXlsx('Passages', passages.map(transformPassage(loadedUsers)));
              }}
            />
            <MenuItem
              text="Observations"
              onClick={async () => {
                const loadedUsers = await fetchUsers();
                exportXlsx('Observations', observations.map(transformObservation(loadedUsers)));
              }}
            />
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function MenuItem({ text = 'Account settings', onClick = () => {} }) {
  return (
    <Menu.Item>
      {({ active }) => (
        <div
          onClick={onClick}
          className={classNames(
            active ? 'tw-bg-gray-100 tw-text-gray-900' : 'tw-text-gray-700',
            'tw-block tw-cursor-pointer tw-px-4 tw-py-2 tw-text-sm'
          )}>
          {text}
        </div>
      )}
    </Menu.Item>
  );
}
