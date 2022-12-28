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

  function transformPerson(e) {
    return {
      id: e._id,
      ...personFieldsIncludingCustomFields
        .filter((e) => !['_id', 'organisation', 'user', 'createdAt', 'updatedAt', 'documents', 'historic'].includes(e.name))
        .reduce((acc, f) => {
          if (f.name === 'assignedTeams') {
            acc[f.label] = (e[f.name] || []).map((t) => teams.find((e) => e._id === t)?.name)?.join(', ');
          } else if (['date', 'date-with-time'].includes(f.type))
            acc[f.label || f.name] = e[f.name] ? dayjsInstance(e[f.name]).format('YYYY-MM-DD') : '';
          else if (['boolean', 'yes-no'].includes(f.type)) acc[f.label || f.name] = e[f.name] ? 'Oui' : 'Non';
          else acc[f.label || f.name] = e[f.name];
          return acc;
        }, {}),
      'Créé par': users.find((u) => u._id === e.user)?.name,
      'Créé le': dayjsInstance(e.createdAt).format('YYYY-MM-DD'),
      'Mis à jour le': dayjsInstance(e.updatedAt).format('YYYY-MM-DD'),
    };
  }

  function transformAction(e) {
    return {
      id: e._id,
      Nom: e.name,
      Description: e.description,
      Catégories: (e.categories || []).join(', '),
      'Personne suivie': persons.find((p) => p._id === e.person)?.name,
      Groupe: e.group,
      Structure: e.structure,
      'Avec heure': e.withTime ? 'Oui' : 'Non',
      Équipe: e.teams?.length ? e.teams.map((t) => teams.find((e) => e._id === t)?.name).join(', ') : e.team,
      Urgent: e.urgent ? 'Oui' : 'Non',
      Statut: e.status,
      'Complétée le': e.completedAt ? dayjsInstance(e.completedAt).format('YYYY-MM-DD') : '',
      'À faire le': e.dueAt ? dayjsInstance(e.dueAt).format(e.withTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD') : '',
      'Créé par': users.find((u) => u._id === e.user)?.name,
      'Créé le': dayjsInstance(e.createdAt).format('YYYY-MM-DD'),
      'Mis à jour le': dayjsInstance(e.updatedAt).format('YYYY-MM-DD'),
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
                exportXlsx(
                  'Personnes suivies',
                  personUpdated.map((e) => transformPerson(e))
                );
              }}
            />
            <MenuItem
              text="Personnes créées"
              onClick={() => {
                exportXlsx(
                  'Personnes créées',
                  personCreated.map((e) => transformPerson(e))
                );
              }}
            />
            <MenuItem
              text="Actions"
              onClick={() => {
                exportXlsx(
                  'Actions',
                  actions.map((e) => transformAction(e))
                );
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
