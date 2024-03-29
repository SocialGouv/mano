import React, { useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { personsState, usePreparePersonForEncryption } from '../../recoil/persons';
import { selector, useRecoilState, useRecoilValue } from 'recoil';
import AsyncSelect from 'react-select/async-creatable';
import API from '../../services/api';
import { formatBirthDate, formatCalendarDate } from '../../services/date';
import { actionsState } from '../../recoil/actions';
import { passagesState } from '../../recoil/passages';
import { rencontresState } from '../../recoil/rencontres';
import { useHistory } from 'react-router-dom';
import ButtonCustom from '../../components/ButtonCustom';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import ExclamationMarkButton from '../../components/tailwind/ExclamationMarkButton';
import { theme } from '../../config';
import useCreateReportAtDateIfNotExist from '../../services/useCreateReportAtDateIfNotExist';
import dayjs from 'dayjs';

function removeDiatricsAndAccents(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function personsToOptions(persons, actions, passages, rencontres) {
  return persons.slice(0, 50).map((person) => ({
    value: person._id,
    label: person.name,
    ...person,
    lastAction: actions.find((action) => action.person === person._id),
    lastPassage: passages.find((passage) => passage.person === person._id),
    lastRencontre: rencontres.find((rencontre) => rencontre.person === person._id),
  }));
}

const searchablePersonsSelector = selector({
  key: 'searchablePersonsSelector',
  get: ({ get }) => {
    const persons = get(personsState);
    return persons.map((person) => {
      return {
        ...person,
        searchString: [removeDiatricsAndAccents(person.name), removeDiatricsAndAccents(person.otherNames), formatBirthDate(person.birthdate)]
          .join(' ')
          .toLowerCase(),
      };
    });
  },
});

// This function is used to filter persons by search string. It ignores diacritics and accents.
const filterEasySearch = (search, items = []) => {
  const searchNormalized = removeDiatricsAndAccents((search || '').toLocaleLowerCase());
  const searchTerms = searchNormalized.split(' ');
  // Items that have exact match in the beginning of the search string are first.
  const firstItems = items.filter((item) => item.searchString.startsWith(searchNormalized));
  const firstItemsIds = new Set(firstItems.map((item) => item._id));
  // Items that have all words in search (the order does not matter) are second.
  const secondItems = items.filter(
    (item) =>
      // Include only items that are not already in firstItems…
      !firstItemsIds.has(item._id) &&
      //  … and that have all words in search (the order does not matter).
      searchTerms.every((e) => item.searchString.includes(e))
  );
  return [...firstItems, ...secondItems];
};

const SelectAndCreatePerson = ({ value, onChange, inputId, classNamePrefix }) => {
  const [persons, setPersons] = useRecoilState(personsState);
  const [isDisabled, setIsDisabled] = useState(false);
  const actions = useRecoilValue(actionsState);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const passages = useRecoilValue(passagesState);
  const rencontres = useRecoilValue(rencontresState);

  const optionsExist = useRef(null);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();
  const preparePersonForEncryption = usePreparePersonForEncryption();

  const searchablePersons = useRecoilValue(searchablePersonsSelector);

  const lastActions = useMemo(() => {
    return Object.values(
      actions.reduce((acc, action) => {
        if (!acc[action.person] || action.dueAt > acc[action.person].dueAt) {
          acc[action.person] = {
            name: action.name,
            dueAt: action.dueAt,
            person: action.person,
          };
        }
        return acc;
      }, {})
    );
  }, [actions]);

  const lastPassages = useMemo(() => {
    if (!organisation.passagesEnabled) return [];
    return Object.values(
      passages
        .filter((passage) => Boolean(passage.person))
        .reduce((acc, passage) => {
          if (!acc[passage.person] || passage.date > acc[passage.person].date) {
            acc[passage.person] = {
              date: passage.date,
              person: passage.person,
            };
          }
          return acc;
        }, {})
    );
  }, [passages, organisation]);

  const lastRencontres = useMemo(() => {
    if (!organisation.rencontresEnabled) return [];
    return Object.values(
      rencontres
        .filter((passage) => Boolean(passage.person))
        .reduce((acc, passage) => {
          if (!acc[passage.person] || passage.date > acc[passage.person].date) {
            acc[passage.person] = {
              date: passage.date,
              person: passage.person,
            };
          }
          return acc;
        }, {})
    );
  }, [rencontres, organisation]);

  return (
    <AsyncSelect
      loadOptions={(inputValue) => {
        const options = personsToOptions(filterEasySearch(inputValue, searchablePersons), lastActions, lastPassages, lastRencontres);
        optionsExist.current = options.length;
        return Promise.resolve(options);
      }}
      defaultOptions={personsToOptions(searchablePersons, lastActions, lastPassages, lastRencontres)}
      name="persons"
      isMulti
      isDisabled={isDisabled}
      isSearchable
      onChange={onChange}
      placeholder={'Entrez un nom, une date de naissance…'}
      onCreateOption={async (name) => {
        const existingPerson = persons.find((p) => p.name === name);
        if (existingPerson) return toast.error('Un utilisateur existe déjà à ce nom');
        setIsDisabled(true);
        const newPerson = { name, assignedTeams: [currentTeam._id], followedSince: dayjs(), user: user._id };
        const currentValue = value || [];
        onChange([...currentValue, { ...newPerson, __isNew__: true }]);
        const personResponse = await API.post({
          path: '/person',
          body: preparePersonForEncryption(newPerson),
        });
        setIsDisabled(false);
        if (personResponse.ok) {
          setPersons((persons) => [personResponse.decryptedData, ...persons].sort((p1, p2) => (p1?.name || '').localeCompare(p2?.name || '')));
          toast.success('Nouvelle personne ajoutée !');
          onChange([...currentValue, personResponse.decryptedData]);
          await createReportAtDateIfNotExist(dayjs());
        }
      }}
      value={value}
      formatOptionLabel={(person, options) => {
        if (options.context === 'menu') {
          if (person.__isNew__) return <span>Créer "{person.value}"</span>;
          return <Person person={person} />;
        }
        if (person.__isNew__) return <span>Création de {person.name}...</span>;
        return <PersonSelected person={person} />;
      }}
      format
      creatable
      onKeyDown={(e, b) => {
        // prevent create Person on Enter press
        if (e.key === 'Enter' && !optionsExist.current) e.preventDefault();
      }}
      inputId={inputId}
      classNamePrefix={classNamePrefix}
    />
  );
};

const PersonSelected = ({ person }) => {
  const history = useHistory();
  const onClick = (e) => {
    e.stopPropagation();
    history.push(`/person/${person._id}`);
  };
  return (
    <div className="tw-flex tw-items-center">
      <span className="tw-text-black50">{person.name}</span>
      {person.birthdate ? (
        <small className="text-muted">
          &nbsp;-&nbsp;
          {formatBirthDate(person.birthdate)}
        </small>
      ) : null}
      <button
        onMouseUp={onClick}
        // onTouchEnd required to work on tablet
        // see https://github.com/JedWatson/react-select/issues/3117#issuecomment-1286232693 for similar issue
        onTouchEnd={onClick}
        className="noprint tw-ml-2 tw-p-0 tw-text-sm tw-font-semibold tw-text-main hover:tw-underline">
        Accéder au dossier
      </button>
    </div>
  );
};

const Person = ({ person }) => {
  const history = useHistory();
  const user = useRecoilValue(userState);
  return (
    <div className="-tw-mt-2 tw-border-t tw-border-t-gray-300 tw-pt-2.5 tw-pb-1">
      <div className="tw-mb-1 tw-flex tw-gap-1">
        <div className="tw-grow">
          {person.outOfActiveList ? <b style={{ color: theme.black25 }}>Sortie de file active : {person.name}</b> : <b>{person.name}</b>}
          {person.otherNames ? <small className="text-muted"> - {person.otherNames}</small> : null}
          {person.birthdate ? <small className="text-muted"> - {formatBirthDate(person.birthdate)}</small> : null}
          {!!person.alertness && (
            <ExclamationMarkButton
              aria-label="Personne très vulnérable, ou ayant besoin d'une attention particulière"
              title="Personne très vulnérable, ou ayant besoin d'une attention particulière"
            />
          )}
        </div>
        <ButtonCustom
          onClick={(e) => {
            e.stopPropagation();
            history.push(`/person/${person._id}`);
          }}
          color="link"
          title="Accéder au dossier"
          padding="0px"
        />
      </div>
      {person.outOfActiveList && (
        <div className="tw-flex tw-gap-1 tw-text-xs">
          <AdditionalInfo
            label="Date de sortie de file active"
            value={person.outOfActiveListDate ? formatCalendarDate(person.outOfActiveListDate) : 'Non renseignée'}
          />
          <AdditionalInfo label="Motif" value={person.outOfActiveListReasons?.join(', ')} />
        </div>
      )}
      <div className="tw-flex tw-gap-1 tw-text-xs">
        <AdditionalInfo
          label="Dernière action"
          value={
            !person.lastAction
              ? null
              : ['restricted-access'].includes(user.role)
              ? formatCalendarDate(person.lastAction.completedAt || person.lastAction.dueAt)
              : `${person.lastAction?.name} - ${formatCalendarDate(person.lastAction.completedAt || person.lastAction.dueAt)}`
          }
        />
        <AdditionalInfo label="Dernier passage" value={person.lastPassage?.date ? formatCalendarDate(person.lastPassage?.date) : null} />
        <AdditionalInfo label="Tel" value={person.phone} />
      </div>
    </div>
  );
};

const AdditionalInfo = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="tw-m-0 tw-mr-2 tw-text-gray-400">{label}</p>
      {value}
    </div>
  );
};

export default SelectAndCreatePerson;
