import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router';
import { useRecoilValue } from 'recoil';
import { useLocalStorage } from 'react-use';
import { CustomResponsiveBar, CustomResponsivePie } from './charts';
import Filters, { filterData } from '../../components/Filters';
import { getDuration, getPieData } from './utils';
import Card from '../../components/Card';
import { capture } from '../../services/sentry';
import { Block } from './Blocks';
import CustomFieldsStats from './CustomFieldsStats';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../components/tailwind/Modal';
import { organisationState, teamsState } from '../../recoil/auth';
import { sortPersons } from '../../recoil/persons';
import TagTeam from '../../components/TagTeam';
import Table from '../../components/table';
import { formatDateWithFullMonth } from '../../services/date';
import CustomFieldDisplay from '../../components/CustomFieldDisplay';

const PersonStats = ({
  title,
  firstBlockHelp,
  filterBase,
  filterPersons,
  setFilterPersons,
  personsForStats,
  groupsForPersons,
  personFields,
  customFieldsPersonsMedical,
  customFieldsPersonsSocial,
}) => {
  const [personsModalOpened, setPersonsModalOpened] = useState(false);
  const [sliceField, setSliceField] = useState(null);
  const [sliceValue, setSliceValue] = useState(null);
  const [slicedData, setSlicedData] = useState([]);

  const onSliceClick = (newSlice, fieldName, personConcerned = personsForStats) => {
    const newSlicefield = filterBase.find((f) => f.field === fieldName);
    setSliceField(newSlicefield);
    setSliceValue(newSlice);
    setSlicedData(
      filterData(
        personConcerned,
        [{ ...newSlicefield, value: newSlice, type: newSlicefield.field === 'outOfActiveList' ? 'boolean' : newSlicefield.field }],
        true
      )
    );
    setPersonsModalOpened(true);
  };
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des personnes suivies</h3>
      <Filters base={filterBase} filters={filterPersons} onChange={setFilterPersons} />
      <div className="-tw-mx-4 tw-flex tw-flex-wrap">
        <Block data={personsForStats} title={`Nombre de ${title}`} help={firstBlockHelp} />
        <BlockCreatedAt persons={personsForStats} />
        <BlockWanderingAt persons={personsForStats} />
        <BlockGroup groups={groupsForPersons(personsForStats)} title={`Nombre de familles dans lesquelles se trouvent des ${title}`} />
      </div>
      <CustomResponsivePie
        title="Nationalité"
        onItemClick={(newSlice) => {
          onSliceClick(newSlice, 'nationalitySituation');
        }}
        field="nationalitySituation"
        data={getPieData(personsForStats, 'nationalitySituation', {
          options: personFields.find((f) => f.name === 'nationalitySituation').options,
        })}
        help={`Nationalité des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <CustomResponsivePie
        title="Genre"
        field="gender"
        onItemClick={(newSlice) => {
          onSliceClick(newSlice, 'gender');
        }}
        data={getPieData(personsForStats, 'gender', { options: personFields.find((f) => f.name === 'gender').options })}
        help={`Genre des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <CustomResponsivePie
        title="Situation personnelle"
        field="personalSituation"
        onItemClick={(newSlice) => {
          onSliceClick(newSlice, 'personalSituation');
        }}
        data={getPieData(personsForStats, 'personalSituation', { options: personFields.find((f) => f.name === 'personalSituation').options })}
        help={`Situation personnelle des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <CustomResponsivePie
        title="Motif de la situation de rue"
        field="reasons"
        onItemClick={(newSlice) => {
          onSliceClick(newSlice, 'reasons');
        }}
        data={getPieData(personsForStats, 'reasons', { options: personFields.find((f) => f.name === 'reasons').options })}
        help={`Motif de la situation de rue des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <CustomResponsivePie
        title="Ressources"
        field="resources"
        onItemClick={(newSlice) => {
          onSliceClick(newSlice, 'resources');
        }}
        data={getPieData(personsForStats, 'resources', { options: personFields.find((f) => f.name === 'resources').options })}
        help={`Ressources des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <AgeRangeBar
        persons={personsForStats}
        onItemClick={(newSlice, data) => {
          setSliceField(personFields.find((f) => f.name === 'birthdate'));
          setSliceValue(newSlice);
          setSlicedData(data);
          setPersonsModalOpened(true);
        }}
      />
      <StatsCreatedAtRangeBar
        persons={personsForStats}
        onItemClick={(newSlice, data) => {
          setSliceField(personFields.find((f) => f.name === 'followedSince'));
          setSliceValue(newSlice);
          setSlicedData(data);
          setPersonsModalOpened(true);
        }}
      />
      <StatsWanderingAtRangeBar
        persons={personsForStats}
        onItemClick={(newSlice, data) => {
          setSliceField(personFields.find((f) => f.name === 'wanderingAt'));
          setSliceValue(newSlice);
          setSlicedData(data);
          setPersonsModalOpened(true);
        }}
      />
      <CustomResponsivePie
        title="Type d'hébergement"
        data={getAdressPieData(personsForStats)}
        onItemClick={(newSlice) => {
          const newSlicefield = filterBase.find((f) => f.field === 'addressDetail');
          setSliceField(newSlicefield);
          setSliceValue(newSlice);
          // FIXME
          setSlicedData(
            personsForStats.filter((person) => {
              if (newSlice === 'Oui (Autre)') {
                return person.address === 'Oui' && !person.addressDetail;
              }
              if (newSlice === 'Non') {
                return person.address === 'Non';
              }
              if (['Non renseigné'].includes(newSlice)) {
                return person.address == null || !person.address?.length;
              }
              return person.address === 'Oui' && person[newSlicefield.field]?.includes(newSlice);
            })
          );
          setPersonsModalOpened(true);
        }}
        help={`Type d'hébergement des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <CustomResponsivePie
        title="Couverture médicale des personnes"
        field="healthInsurances"
        onItemClick={(newSlice) => {
          onSliceClick(newSlice, 'healthInsurances');
        }}
        data={getPieData(personsForStats, 'healthInsurances', { options: personFields.find((f) => f.name === 'healthInsurances').options })}
        help={`Couverture médicale des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <CustomResponsivePie
        title="Avec animaux"
        data={getPieData(personsForStats, 'hasAnimal')}
        onItemClick={(newSlice) => {
          onSliceClick(newSlice, 'hasAnimal');
        }}
        help={`Répartition des ${title} avec animaux dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <CustomResponsivePie
        title="Personnes très vulnérables"
        field="alertness"
        onItemClick={(newSlice) => {
          onSliceClick(newSlice, 'alertness');
        }}
        data={getPieData(personsForStats, 'alertness', { isBoolean: true })}
        help={`${title.capitalize()} vulnérables dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <CustomResponsivePie
        title="Sortie de file active"
        field="outOfActiveList"
        onItemClick={(newSlice) => {
          onSliceClick(newSlice, 'outOfActiveList');
        }}
        data={getPieData(personsForStats, 'outOfActiveList', { isBoolean: true })}
        help={`${title} dans la période définie, sorties de la file active. La date de sortie de la file active n'est pas nécessairement dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
      />
      <CustomResponsivePie
        title="Raison de sortie de file active"
        field="outOfActiveListReasons"
        help={`Raisons de sortie de file active des ${title} dans la période définie, sorties de la file active. La date de sortie de la file active n'est pas nécessairement dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
        onItemClick={(newSlice) => {
          onSliceClick(
            newSlice,
            'outOfActiveListReasons',
            personsForStats.filter((p) => !!p.outOfActiveList)
          );
        }}
        data={getPieData(
          personsForStats.filter((p) => !!p.outOfActiveList),
          'outOfActiveListReasons'
        )}
      />
      <CustomFieldsStats
        data={personsForStats}
        customFields={customFieldsPersonsMedical}
        onSliceClick={onSliceClick}
        help={(label) =>
          `${label.capitalize()} des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`
        }
      />
      <CustomFieldsStats
        data={personsForStats}
        customFields={customFieldsPersonsSocial}
        onSliceClick={onSliceClick}
        help={(label) =>
          `${label.capitalize()} des ${title} dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`
        }
      />
      <SelectedPersonsModal
        open={personsModalOpened}
        onClose={() => {
          setPersonsModalOpened(false);
        }}
        persons={slicedData}
        sliceField={sliceField}
        onAfterLeave={() => {
          setSliceField(null);
          setSliceValue(null);
          setSlicedData([]);
        }}
        title={`${sliceField?.label} : ${sliceValue} (${slicedData.length})`}
      />
    </>
  );
};

export const BlockWanderingAt = ({ persons }) => {
  persons = persons.filter((p) => Boolean(p.wanderingAt));
  if (!persons.length) {
    return (
      <div className="tw-basis-1/2 tw-px-4 tw-py-2 lg:tw-basis-1/3">
        <Card title="Temps d'errance des personnes en&nbsp;moyenne" unit={'N/A'} count={0} />
      </div>
    );
  }
  const averageWanderingAt = persons.reduce((total, person) => total + Date.parse(person.wanderingAt), 0) / (persons.length || 1);
  const durationFromNowToAverage = Date.now() - averageWanderingAt;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return (
    <div className="tw-basis-1/2 tw-px-4 tw-py-2 lg:tw-basis-1/3">
      <Card
        title="Temps d'errance des personnes en&nbsp;moyenne"
        unit={unit}
        count={count}
        help={`Cela veut dire qu'en moyenne, chaque personne considérée est en rue depuis ${count} ${unit}`}
      />
    </div>
  );
};

export const BlockGroup = ({ title, groups }) => {
  try {
    if (!groups.length) {
      return (
        <div className="tw-basis-1/2 tw-px-4 tw-py-2 lg:tw-basis-1/3">
          <Card
            title={title}
            count={0}
            help={`Une personne ne peut appartenir qu'à une famille. On comptabilise donc le nombre de familles dans lesquelles se trouvent les personnes concernées.\n\nSi plusieurs personnes appartiennent à la même famille, on comptabilisera seulement une seule famille.`}
          />
        </div>
      );
    }

    const avg = groups.reduce((total, group) => total + group.relations.length, 0) / groups.length;
    return (
      <div className="tw-basis-1/2 tw-px-4 tw-py-2 lg:tw-basis-1/3">
        <Card
          title={title}
          count={groups.length}
          help={`Une personne ne peut appartenir qu'à une famille. On comptabilise donc le nombre de familles dans lesquelles se trouvent les personnes concernées.\n\nSi plusieurs personnes appartiennent à la même famille, on comptabilisera seulement une seule famille.`}
          children={
            <span className="font-weight-normal">
              Taille moyenne des familles: <strong>{avg}</strong>
            </span>
          }
        />
      </div>
    );
  } catch (errorBlockTotal) {
    capture('error block total', errorBlockTotal, { title, groups });
  }
  return null;
};

export const BlockCreatedAt = ({ persons }) => {
  if (persons.length === 0) {
    return (
      <div className="tw-basis-1/2 tw-px-4 tw-py-2 lg:tw-basis-1/3">
        <Card title="Temps de suivi moyen" count={'-'} />
      </div>
    );
  }
  const averageFollowedSince =
    persons.reduce((total, person) => total + Date.parse(person.followedSince || person.createdAt), 0) / (persons.length || 1);
  const durationFromNowToAverage = Date.now() - averageFollowedSince;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return (
    <div className="tw-basis-1/2 tw-px-4 tw-py-2 lg:tw-basis-1/3">
      <Card
        title="Temps de suivi moyen"
        unit={unit}
        count={count}
        help={`Cela veut dire qu'en moyenne, chaque personne considérée est suivie depuis ${count} ${unit}`}
      />
    </div>
  );
};

const initCategories = (categories) => {
  const objCategories = {};
  for (const cat of categories) {
    objCategories[cat] = [];
  }
  return objCategories;
};

export const AgeRangeBar = ({ persons, onItemClick }) => {
  const categories = ['0 - 2', '3 - 17', '18 - 24', '25 - 44', '45 - 59', '60+', 'Non renseigné'];

  const data = persons.reduce((newData, person) => {
    if (!person.birthdate || !person.birthdate.length) {
      newData['Non renseigné'].push(person);
      return newData;
    }
    const parsedDate = Date.parse(person.birthdate);
    const fromNowInYear = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / 365.25;
    if (fromNowInYear < 2) {
      newData['0 - 2'].push(person);
      return newData;
    }
    if (fromNowInYear < 18) {
      newData['3 - 17'].push(person);
      return newData;
    }
    if (fromNowInYear < 25) {
      newData['18 - 24'].push(person);
      return newData;
    }
    if (fromNowInYear < 45) {
      newData['25 - 44'].push(person);
      return newData;
    }
    if (fromNowInYear < 60) {
      newData['45 - 59'].push(person);
      return newData;
    }
    newData['60+'].push(person);
    return newData;
  }, initCategories(categories));

  const dataCount = Object.keys(data)
    .filter((key) => data[key]?.length > 0)
    .map((key) => ({ name: key, [key]: data[key]?.length }));

  return (
    <CustomResponsiveBar
      title="Tranche d'âges"
      categories={categories.filter((c) => c !== 'Non renseigné')}
      onItemClick={(item) => {
        onItemClick(item, data[item]);
      }}
      data={dataCount}
      axisTitleX="Tranche d'âge"
      axisTitleY="Nombre de personnes"
      help={`Répartition des âges des personnes concernées, dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
    />
  );
};

const StatsCreatedAtRangeBar = ({ persons, onItemClick }) => {
  const categories = ['0-6 mois', '6-12 mois', '1-2 ans', '2-5 ans', '+ 5 ans'];

  let data = persons.reduce((newData, person) => {
    if (!person.followedSince || !person.createdAt || !person.createdAt.length) {
      return newData;
      // newData["Non renseigné"].push(person);
    }
    const parsedDate = Date.parse(person.followedSince || person.createdAt);
    const fromNowInMonths = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / (365.25 / 12);
    if (fromNowInMonths < 6) {
      newData['0-6 mois'].push(person);
      return newData;
    }
    if (fromNowInMonths < 12) {
      newData['6-12 mois'].push(person);
      return newData;
    }
    if (fromNowInMonths < 24) {
      newData['1-2 ans'].push(person);
      return newData;
    }
    if (fromNowInMonths < 60) {
      newData['2-5 ans'].push(person);
      return newData;
    }
    newData['+ 5 ans'].push(person);
    return newData;
  }, initCategories(categories));

  const dataCount = Object.keys(data)
    .filter((key) => data[key]?.length > 0)
    .map((key) => ({ name: key, [key]: data[key]?.length }));

  return (
    <CustomResponsiveBar
      title="Temps de suivi (par tranche)"
      categories={categories}
      data={dataCount}
      onItemClick={(item) => {
        onItemClick(item, data[item]);
      }}
      axisTitleX="Temps de suivi"
      axisTitleY="Nombre de personnes"
      help={`Répartition des temps de suivi des personnes concernées, dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
    />
  );
};

const StatsWanderingAtRangeBar = ({ persons, onItemClick }) => {
  const categories = ['0-6 mois', '6-12 mois', '1-2 ans', '2-5 ans', '5-10 ans', '+ 10 ans', 'Non renseigné'];

  let data = persons.reduce((newData, person) => {
    if (!person.wanderingAt || !person.wanderingAt.length) {
      newData['Non renseigné'].push(person);
      return newData;
    }
    const parsedDate = Date.parse(person.wanderingAt);
    const fromNowInMonths = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / (365.25 / 12);
    if (fromNowInMonths < 6) {
      newData['0-6 mois'].push(person);
      return newData;
    }
    if (fromNowInMonths < 12) {
      newData['6-12 mois'].push(person);
      return newData;
    }
    if (fromNowInMonths < 24) {
      newData['1-2 ans'].push(person);
      return newData;
    }
    if (fromNowInMonths < 60) {
      newData['2-5 ans'].push(person);
      return newData;
    }
    if (fromNowInMonths < 120) {
      newData['5-10 ans'].push(person);
      return newData;
    }
    newData['+ 10 ans'].push(person);
    return newData;
  }, initCategories(categories));

  const dataCount = Object.keys(data)
    .filter((key) => data[key]?.length > 0)
    .map((key) => ({ name: key, [key]: data[key]?.length }));

  return (
    <CustomResponsiveBar
      title="Temps d'errance (par tranche)"
      categories={categories}
      data={dataCount}
      onItemClick={(item) => {
        onItemClick(item, data[item]);
      }}
      axisTitleX="Temps d'errance"
      axisTitleY="Nombre de personnes"
      help={`Répartition des temps d'errance des personnes concernées, dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
    />
  );
};

const getAdressPieData = (data) => {
  data = data.reduce(
    (newData, person) => {
      if (!person.address) {
        newData['Non renseigné']++;
        return newData;
      }
      if (person.address === 'Non') {
        newData.Non++;
        return newData;
      }
      if (!person.addressDetail) {
        newData['Oui (Autre)']++;
        return newData;
      }
      if (!newData[person.addressDetail]) newData[person.addressDetail] = 0;
      newData[person.addressDetail]++;
      return newData;
    },
    { 'Oui (Autre)': 0, Non: 0, 'Non renseigné': 0 }
  );
  return Object.keys(data).map((key) => ({ id: key, label: key, value: data[key] }));
};

const Teams = ({ person: { _id, assignedTeams } }) => (
  <React.Fragment key={_id}>
    {assignedTeams?.map((teamId) => (
      <TagTeam key={teamId} teamId={teamId} />
    ))}
  </React.Fragment>
);

const SelectedPersonsModal = ({ open, onClose, persons, title, onAfterLeave, sliceField }) => {
  const history = useHistory();
  const teams = useRecoilValue(teamsState);
  const organisation = useRecoilValue(organisationState);

  const [sortBy, setSortBy] = useLocalStorage('person-sortBy', 'name');
  const [sortOrder, setSortOrder] = useLocalStorage('person-sortOrder', 'ASC');
  const data = useMemo(() => {
    return [...persons].sort(sortPersons(sortBy, sortOrder));
  }, [persons, sortBy, sortOrder]);

  if (!sliceField) return null;

  return (
    <ModalContainer open={open} size="full" onClose={onClose} onAfterLeave={onAfterLeave}>
      <ModalHeader title={title} />
      <ModalBody>
        <div className="tw-p-4">
          <Table
            data={data}
            rowKey={'_id'}
            noData="Pas de personne suivie"
            onRowClick={(p) => history.push(`/person/${p._id}`)}
            columns={[
              {
                title: '',
                dataKey: 'group',
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortOrder,
                sortBy,
                small: true,
                render: (person) => {
                  if (!person.group) return null;
                  return (
                    <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                      <span className="tw-text-3xl" aria-label="Personne avec des liens familiaux" title="Personne avec des liens familiaux">
                        👪
                      </span>
                    </div>
                  );
                },
              },
              {
                title: 'Nom',
                dataKey: 'name',
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortOrder,
                sortBy,
              },
              {
                title: sliceField.label,
                dataKey: sliceField,
                render: (person) => <CustomFieldDisplay type={sliceField.type} value={person[sliceField.field]} />,
              },
              { title: 'Équipe(s) en charge', dataKey: 'assignedTeams', render: (person) => <Teams teams={teams} person={person} /> },
              {
                title: 'Suivi(e) depuis le',
                dataKey: 'followedSince',
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortOrder,
                sortBy,
                render: (p) => formatDateWithFullMonth(p.followedSince || p.createdAt || ''),
              },
            ].filter((c) => organisation.groupsEnabled || c.dataKey !== 'group')}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          name="cancel"
          className="button-cancel"
          onClick={() => {
            onClose(null);
          }}>
          Fermer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default PersonStats;
