import React from 'react';
import { CustomResponsiveBar, CustomResponsivePie } from './charts';
import Filters from '../../components/Filters';
import { getDuration, getPieData } from './utils';
import Card from '../../components/Card';
import { capture } from '../../services/sentry';
import { Block } from './Blocks';
import CustomFieldsStats from './CustomFieldsStats';

const PersonStats = ({
  filterBase,
  filterPersons,
  setFilterPersons,
  personsForStats,
  personsUpdatedForStats,
  groupsForPersons,
  personFields,
  persons,
  fieldsPersonsCustomizableOptions,
  customFieldsPersonsMedical,
  customFieldsPersonsSocial,
}) => {
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des personnes suivies</h3>
      <Filters base={filterBase} filters={filterPersons} onChange={setFilterPersons} />
      <div className="-tw-mx-4 tw-flex tw-flex-wrap">
        <Block data={personsForStats} title="Nombre de personnes créées" />
        <Block data={personsUpdatedForStats} title="Nombre de personnes suivies" />
        <BlockCreatedAt persons={personsForStats} />
        <BlockWanderingAt persons={personsForStats} />
        <BlockGroup groups={groupsForPersons(personsForStats)} title="Nombre de familles dans lesquelles se trouvent des personnes créées" />
        <BlockGroup groups={groupsForPersons(personsUpdatedForStats)} title="Nombre de familles dans lesquelles se trouvent des personnes suivies" />
      </div>
      <CustomResponsivePie
        title="Nationalité"
        field="nationalitySituation"
        data={getPieData(personsForStats, 'nationalitySituation', {
          options: personFields.find((f) => f.name === 'nationalitySituation').options,
        })}
      />
      <CustomResponsivePie
        title="Genre"
        field="gender"
        data={getPieData(personsForStats, 'gender', { options: personFields.find((f) => f.name === 'gender').options })}
      />
      <CustomResponsivePie
        title="Situation personnelle"
        field="personalSituation"
        data={getPieData(personsForStats, 'personalSituation', { options: personFields.find((f) => f.name === 'personalSituation').options })}
      />
      <CustomResponsivePie
        title="Motif de la situation de rue"
        field="reasons"
        data={getPieData(personsForStats, 'reasons', { options: personFields.find((f) => f.name === 'reasons').options })}
      />
      <CustomResponsivePie
        title="Ressources des personnes suivies"
        field="resources"
        data={getPieData(personsForStats, 'resources', { options: personFields.find((f) => f.name === 'resources').options })}
      />
      <AgeRangeBar persons={personsForStats} />
      <StatsCreatedAtRangeBar persons={personsForStats} />
      <StatsWanderingAtRangeBar persons={personsForStats} />
      <CustomResponsivePie title="Type d'hébergement" data={getAdressPieData(personsForStats)} />
      <CustomResponsivePie
        title="Couverture médicale des personnes"
        field="healthInsurances"
        data={getPieData(personsForStats, 'healthInsurances', { options: personFields.find((f) => f.name === 'healthInsurances').options })}
      />
      <CustomResponsivePie title="Avec animaux" data={getPieData(personsForStats, 'hasAnimal')} />
      <CustomResponsivePie
        title="Personnes très vulnérables"
        field="alertness"
        data={getPieData(personsForStats, 'alertness', { isBoolean: true })}
      />
      <CustomResponsivePie title="Sortie de file active" field="outOfActiveList" data={getPieData(persons, 'outOfActiveList', { isBoolean: true })} />
      <CustomResponsivePie
        title="Raison de sortie de file active"
        field="outOfActiveListReasons"
        data={getPieData(
          persons.filter((p) => !!p.outOfActiveList),
          'outOfActiveListReasons',
          { options: fieldsPersonsCustomizableOptions.find((f) => f.name === 'outOfActiveListReasons').options }
        )}
      />
      <CustomFieldsStats data={personsForStats} customFields={customFieldsPersonsMedical} />
      <CustomFieldsStats data={personsForStats} customFields={customFieldsPersonsSocial} />
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
      <Card title="Temps d'errance des personnes en&nbsp;moyenne" unit={unit} count={count} />
    </div>
  );
};

export const BlockGroup = ({ title, groups }) => {
  try {
    if (!groups.length) {
      return (
        <div className="tw-basis-1/2 tw-px-4 tw-py-2 lg:tw-basis-1/3">
          <Card title={title} count={0} />
        </div>
      );
    }

    const avg = groups.reduce((total, group) => total + group.relations.length, 0) / groups.length;
    return (
      <div className="tw-basis-1/2 tw-px-4 tw-py-2 lg:tw-basis-1/3">
        <Card
          title={title}
          count={groups.length}
          children={
            <span className="font-weight-normal">
              Moyenne de relations par famille: <strong>{avg}</strong>
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
      <Card title="Temps de suivi moyen" unit={unit} count={count} />
    </div>
  );
};

const initCategories = (categories) => {
  const objCategories = {};
  for (const cat of categories) {
    objCategories[cat] = 0;
  }
  return objCategories;
};

export const AgeRangeBar = ({ persons }) => {
  const categories = ['0 - 2', '3 - 17', '18 - 24', '25 - 44', '45 - 59', '60+'];

  let data = persons.reduce((newData, person) => {
    if (!person.birthdate || !person.birthdate.length) {
      newData['Non renseigné']++;
      return newData;
    }
    const parsedDate = Date.parse(person.birthdate);
    const fromNowInYear = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / 365.25;
    if (fromNowInYear < 2) {
      newData['0 - 2']++;
      return newData;
    }
    if (fromNowInYear < 18) {
      newData['3 - 17']++;
      return newData;
    }
    if (fromNowInYear < 25) {
      newData['18 - 24']++;
      return newData;
    }
    if (fromNowInYear < 45) {
      newData['25 - 44']++;
      return newData;
    }
    if (fromNowInYear < 60) {
      newData['45 - 59']++;
      return newData;
    }
    newData['60+']++;
    return newData;
  }, initCategories(categories));

  data = Object.keys(data)
    .filter((key) => data[key] > 0)
    .map((key) => ({ name: key, [key]: data[key] }));

  return (
    <CustomResponsiveBar title="Tranche d'âges" categories={categories} data={data} axisTitleX="Tranche d'âge" axisTitleY="Nombre de personnes" />
  );
};

const StatsCreatedAtRangeBar = ({ persons }) => {
  const categories = ['0-6 mois', '6-12 mois', '1-2 ans', '2-5 ans', '+ 5 ans'];

  let data = persons.reduce((newData, person) => {
    if (!person.followedSince || !person.createdAt || !person.createdAt.length) {
      return newData;
      // newData["Non renseigné"]++;
    }
    const parsedDate = Date.parse(person.followedSince || person.createdAt);
    const fromNowInMonths = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / (365.25 / 12);
    if (fromNowInMonths < 6) {
      newData['0-6 mois']++;
      return newData;
    }
    if (fromNowInMonths < 12) {
      newData['6-12 mois']++;
      return newData;
    }
    if (fromNowInMonths < 24) {
      newData['1-2 ans']++;
      return newData;
    }
    if (fromNowInMonths < 60) {
      newData['2-5 ans']++;
      return newData;
    }
    newData['+ 5 ans']++;
    return newData;
  }, initCategories(categories));

  data = Object.keys(data)
    .filter((key) => data[key] > 0)
    .map((key) => ({ name: key, [key]: data[key] }));

  return (
    <CustomResponsiveBar
      title="Temps de suivi (par tranche)"
      categories={categories}
      data={data}
      axisTitleX="Temps de suivi"
      axisTitleY="Nombre de personnes"
    />
  );
};

const StatsWanderingAtRangeBar = ({ persons }) => {
  const categories = ['0-6 mois', '6-12 mois', '1-2 ans', '2-5 ans', '5-10 ans', '+ 10 ans'];

  let data = persons.reduce((newData, person) => {
    if (!person.wanderingAt || !person.wanderingAt.length) {
      return newData;
    }
    const parsedDate = Date.parse(person.wanderingAt);
    const fromNowInMonths = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / (365.25 / 12);
    if (fromNowInMonths < 6) {
      newData['0-6 mois']++;
      return newData;
    }
    if (fromNowInMonths < 12) {
      newData['6-12 mois']++;
      return newData;
    }
    if (fromNowInMonths < 24) {
      newData['1-2 ans']++;
      return newData;
    }
    if (fromNowInMonths < 60) {
      newData['2-5 ans']++;
      return newData;
    }
    if (fromNowInMonths < 120) {
      newData['5-10 ans']++;
      return newData;
    }
    newData['+ 10 ans']++;
    return newData;
  }, initCategories(categories));

  data = Object.keys(data)
    .filter((key) => data[key] > 0)
    .map((key) => ({ name: key, [key]: data[key] }));

  return (
    <CustomResponsiveBar
      title="Temps d'errance (par tranche)"
      categories={categories}
      data={data}
      axisTitleX="Temps d'errance"
      axisTitleY="Nombre de personnes"
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

export default PersonStats;
