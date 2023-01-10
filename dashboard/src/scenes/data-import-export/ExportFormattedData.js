import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useRecoilValue } from 'recoil';
import { personFieldsIncludingCustomFieldsSelector, personsState } from '../../recoil/persons';
import { utils, writeFile } from 'xlsx';
import { dayjsInstance } from '../../services/date';
import { teamsState, usersState } from '../../recoil/auth';

// Source: https://tailwindui.com/components/application-ui/elements/dropdowns
export default function ExportFormattedData({ personCreated, personUpdated, actions }) {
  const users = useRecoilValue(usersState);
  const teams = useRecoilValue(teamsState);
  const persons = useRecoilValue(personsState);
  const personFieldsIncludingCustomFields = useRecoilValue(personFieldsIncludingCustomFieldsSelector);

  function transformPerson(person) {
    return {
      id: person._id,
      ...personFieldsIncludingCustomFields
        .filter((person) => !['_id', 'organisation', 'user', 'createdAt', 'updatedAt', 'documents', 'history'].includes(person.name))
        .reduce((fields, field) => {
          if (field.name === 'assignedTeams') {
            fields[field.label] = (person[field.name] || []).map((t) => teams.find((person) => person._id === t)?.name)?.join(', ');
          } else if (['date', 'date-with-time'].includes(field.type))
            fields[field.label || field.name] = person[field.name] ? dayjsInstance(person[field.name]).format('YYYY-MM-DD') : '';
          else if (['boolean', 'yes-no'].includes(field.type)) fields[field.label || field.name] = person[field.name] ? 'Oui' : 'Non';
          else fields[field.label || field.name] = person[field.name];
          return fields;
        }, {}),
      'Créé par': users.find((u) => u._id === person.user)?.name,
      'Créé le': dayjsInstance(person.createdAt).format('YYYY-MM-DD'),
      'Mis à jour le': dayjsInstance(person.updatedAt).format('YYYY-MM-DD'),
    };
  }

  function transformAction(action) {
    return {
      id: action._id,
      Nom: action.name,
      Description: action.description,
      Catégories: (action.categories || []).join(', '),
      'Personne suivie': persons.find((p) => p._id === action.person)?.name,
      Groupe: action.group,
      Structure: action.structure,
      'Avec heure': action.withTime ? 'Oui' : 'Non',
      Équipe: action.teams?.length ? action.teams.map((t) => teams.find((action) => action._id === t)?.name).join(', ') : action.team,
      Urgent: action.urgent ? 'Oui' : 'Non',
      Statut: action.status,
      'Complétée le': action.completedAt ? dayjsInstance(action.completedAt).format('YYYY-MM-DD') : '',
      'À faire le': action.dueAt ? dayjsInstance(action.dueAt).format(action.withTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD') : '',
      'Créé par': users.find((u) => u._id === action.user)?.name,
      'Créé le': dayjsInstance(action.createdAt).format('YYYY-MM-DD'),
      'Mis à jour le': dayjsInstance(action.updatedAt).format('YYYY-MM-DD'),
    };
  }

  function exportXlsx(name, json) {
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(json);
    utils.book_append_sheet(wb, ws, name);
    writeFile(wb, name + '.xlsx');
  }

  return (
    <Menu as="div" className="tw-relative tw-inline-block tw-text-left">
      <div>
        <Menu.Button className="tw-inline-flex tw-w-full tw-justify-center tw-rounded-md tw-border tw-border-gray-300 tw-bg-main tw-py-2 tw-px-4 tw-text-sm tw-font-medium tw-text-white focus:tw-outline-none">
          Télécharger un export
          <div className="-tw-mr-1 -tw-mt-1 tw-ml-2 tw-h-5 tw-w-5" aria-hidden="true">
            ⌄
          </div>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="tw-transition tw-ease-out tw-duration-100"
        enterFrom="tw-transform tw-opacity-0 tw-scale-95"
        enterTo="tw-transform tw-opacity-100 tw-scale-100"
        leave="tw-transition tw-ease-in tw-duration-75"
        leaveFrom="tw-transform tw-opacity-100 tw-scale-100"
        leaveTo="tw-transform tw-opacity-0 tw-scale-95">
        <Menu.Items className="tw-absolute tw-right-0 tw-z-10 tw-mt-2 tw-w-56 tw-origin-top-right tw-rounded-md tw-bg-white tw-shadow-lg tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none">
          <div className="tw-py-1">
            <MenuItem
              text="Personnes suivies"
              onClick={() => {
                exportXlsx('Personnes suivies', personUpdated.map(transformPerson));
              }}
            />
            <MenuItem
              text="Personnes créées"
              onClick={() => {
                exportXlsx('Personnes créées', personCreated.map(transformPerson));
              }}
            />
            <MenuItem
              text="Actions"
              onClick={() => {
                exportXlsx('Actions', actions.map(transformAction));
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
