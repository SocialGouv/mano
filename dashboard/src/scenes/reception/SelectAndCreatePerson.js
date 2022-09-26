import React, { useMemo, useRef } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import { useRecoilState, useRecoilValue } from 'recoil';
import AsyncSelect from 'react-select/async-creatable';
import useApi from '../../services/api';
import { formatBirthDate, formatCalendarDate } from '../../services/date';
import { actionsState } from '../../recoil/actions';
import { passagesState } from '../../recoil/passages';
import { rencontresState } from '../../recoil/rencontres';
import { useHistory } from 'react-router-dom';
import ButtonCustom from '../../components/ButtonCustom';
import { userState } from '../../recoil/auth';
import ExclamationMarkButton from '../../components/ExclamationMarkButton';
import { theme } from '../../config';

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

const SelectAndCreatePerson = ({ value, onChange, autoCreate, inputId, classNamePrefix }) => {
  const [persons, setPersons] = useRecoilState(personsState);
  const actions = useRecoilValue(actionsState);
  const passages = useRecoilValue(passagesState);
  const rencontres = useRecoilValue(rencontresState);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const API = useApi();
  const optionsExist = useRef(null);

  const searchablePersons = useMemo(() => {
    return persons.map((person) => {
      return {
        ...person,
        searchString: [removeDiatricsAndAccents(person.name), formatBirthDate(person.birthdate)].join(' '),
      };
    });
  }, [persons]);

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
  }, [passages]);

  const lastRencontres = useMemo(() => {
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
  }, [rencontres]);

  return (
    <AsyncSelect
      loadOptions={(inputValue) => {
        const formattedInputValue = removeDiatricsAndAccents(inputValue);
        const options = personsToOptions(
          searchablePersons.filter((person) => person.searchString.includes(formattedInputValue)),
          lastActions,
          lastPassages,
          lastRencontres
        );
        optionsExist.current = options.length;
        return Promise.resolve(options);
      }}
      defaultOptions={personsToOptions(searchablePersons, lastActions, lastPassages, lastRencontres)}
      name="persons"
      isMulti
      isSearchable
      onChange={onChange}
      placeholder={'Entrez un nom, une date de naissance…'}
      onCreateOption={async (name) => {
        if (!autoCreate) {
          onChange([...value, { value: `temporary-id-${Date.now()}`, label: `${name} (en cours de création)`, name }]);
        } else {
          const existingPerson = persons.find((p) => p.name === name);
          if (existingPerson) return toast.error('Un utilisateur existe déjà à ce nom');
          const personResponse = await API.post({
            path: '/person',
            body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)({ name }),
          });
          if (personResponse.ok) {
            setPersons((persons) => [personResponse.decryptedData, ...persons].sort((p1, p2) => p1.name.localeCompare(p2.name)));
            toast.success('Nouvelle personne ajoutée !');
            onChange([...value, personResponse.decryptedData]);
          }
        }
      }}
      value={value}
      formatOptionLabel={(person, options) => {
        if (options.context === 'menu') {
          if (person.__isNew__) return <span>Créer "{person.value}"</span>;
          return <Person person={person} />;
        }
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
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: theme.black50 }}>{person.name}</span>
        {person.birthdate ? <small className="text-muted"> - {formatBirthDate(person.birthdate)}</small> : null}
        <ButtonCustom
          onClick={(e) => {
            e.stopPropagation();
            history.push(`/person/${person._id}`);
          }}
          color="link"
          title="Accéder au dossier"
          padding="0"
          style={{ marginLeft: '0.5rem' }}
        />
      </div>
    </div>
  );
};

const Person = ({ person }) => {
  const history = useHistory();
  const user = useRecoilValue(userState);
  return (
    <PersonWrapper>
      <PersonMainInfo>
        <div className="person-name">
          {person.outOfActiveList ? <b style={{ color: theme.black25 }}>Sortie de file active : {person.name}</b> : <b>{person.name}</b>}
          {person.birthdate ? <small className="text-muted"> - {formatBirthDate(person.birthdate)}</small> : null}
          {!!person.alertness && <ExclamationMarkButton />}
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
      </PersonMainInfo>
      {person.outOfActiveList && (
        <AdditionalInfoWrapper>
          <AdditionalInfo
            label="Date de sortie de file active"
            value={person.outOfActiveListDate ? formatCalendarDate(person.outOfActiveListDate) : 'Non renseignée'}
          />
          <AdditionalInfo label="Motif" value={person.outOfActiveListReason} />
        </AdditionalInfoWrapper>
      )}
      <AdditionalInfoWrapper>
        <AdditionalInfo
          label="Dernière action"
          value={
            !person.lastAction
              ? null
              : ['restricted-access'].includes(user.role)
              ? formatCalendarDate(person.lastAction.dueAt)
              : `${person.lastAction?.name} - ${formatCalendarDate(person.lastAction.dueAt)}`
          }
        />
        <AdditionalInfo label="Dernier passage" value={person.lastPassage?.date ? formatCalendarDate(person.lastPassage?.date) : null} />
        <AdditionalInfo label="Tel" value={person.phone} />
      </AdditionalInfoWrapper>
    </PersonWrapper>
  );
};

const AdditionalInfo = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <AdditionalInfoLabel>{label}</AdditionalInfoLabel>
      {value}
    </div>
  );
};

const AdditionalInfoLabel = styled.span`
  font-weight: bold;
  color: #aaa;
  margin-right: 7px;
`;

const AdditionalInfoWrapper = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 12px;
`;

const PersonWrapper = styled.div`
  border-top: 1px solid #ddd;
  margin-top: -9px;
  padding-top: 10px;
  padding-bottom: 5px;
`;

const PersonMainInfo = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 4px;
  .person-name {
    flex-grow: 1;
  }
`;

export default SelectAndCreatePerson;
