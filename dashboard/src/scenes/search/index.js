import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useHistory } from 'react-router-dom';
import DateBloc from '../../components/DateBloc';
import Header from '../../components/header';
import ActionStatus from '../../components/ActionStatus';
import Table from '../../components/table';
import Observation from '../territory-observations/view';
import dayjs from 'dayjs';
import { capture } from '../../services/sentry';
import UserName from '../../components/UserName';
import Search from '../../components/search';
import TagTeam from '../../components/TagTeam';
import { organisationState, teamsState } from '../../recoil/auth';
import { actionsState, CANCEL, DONE, sortActionsOrConsultations } from '../../recoil/actions';
import { personsState, sortPersons } from '../../recoil/persons';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { sortTerritories, territoriesState } from '../../recoil/territory';
import { selector, selectorFamily, useRecoilValue } from 'recoil';
import { itemsGroupedByPersonSelector, onlyFilledObservationsTerritories, personsObjectSelector } from '../../recoil/selectors';
import PersonName from '../../components/PersonName';
import { formatBirthDate, formatDateWithFullMonth, formatTime } from '../../services/date';
import { useDataLoader } from '../../components/DataLoader';
import { placesState } from '../../recoil/places';
import { filterBySearch } from './utils';
import { commentsState } from '../../recoil/comments';
import useTitle from '../../services/useTitle';
import ExclamationMarkButton from '../../components/tailwind/ExclamationMarkButton';
import ConsultationButton from '../../components/ConsultationButton';
import { useLocalStorage } from '../../services/useLocalStorage';
import { territoryObservationsState } from '../../recoil/territoryObservations';

const personsWithFormattedBirthDateSelector = selector({
  key: 'personsWithFormattedBirthDateSelector',
  get: ({ get }) => {
    const persons = get(personsState);
    const personsWithBirthdateFormatted = persons.map((person) => ({
      ...person,
      birthDate: formatBirthDate(person.birthDate),
    }));
    return personsWithBirthdateFormatted;
  },
});

const personsFilteredBySearchForSearchSelector = selectorFamily({
  key: 'personsFilteredBySearchForSearchSelector',
  get:
    ({ search, sortBy, sortOrder }) =>
    ({ get }) => {
      const persons = get(personsWithFormattedBirthDateSelector);
      const personsPopulated = get(itemsGroupedByPersonSelector);
      if (!search?.length) return [];
      return filterBySearch(search, persons).map((p) => personsPopulated[p._id]);
    },
});
const actionsObjectSelector = selector({
  key: 'actionsObjectSelector',
  get: ({ get }) => {
    const actions = get(actionsState);
    const actionsObject = {};
    for (const action of actions) {
      actionsObject[action._id] = { ...action };
    }
    return actionsObject;
  },
});

const commentsPopulatedSelector = selector({
  key: 'commentsPopulatedSelector',
  get: ({ get }) => {
    const comments = get(commentsState);
    const persons = get(personsObjectSelector);
    const actions = get(actionsObjectSelector);
    const commentsObject = {};
    for (const comment of comments) {
      if (comment.person) {
        commentsObject[comment._id] = {
          ...comment,
          person: persons[comment.person],
          type: 'person',
        };
        continue;
      }
      if (comment.action) {
        commentsObject[comment._id] = {
          ...comment,
          action: actions[comment.action],
          type: 'action',
        };
        continue;
      }
    }
    return commentsObject;
  },
});

const commentsFilteredBySearchSelector = selectorFamily({
  key: 'commentsFilteredBySearchSelector',
  get:
    ({ search }) =>
    ({ get }) => {
      const comments = get(commentsState);
      const commentsPopulated = get(commentsPopulatedSelector);
      if (!search?.length) return [];
      const commentsFilteredBySearch = filterBySearch(search, comments);
      return commentsFilteredBySearch.map((c) => commentsPopulated[c._id]).filter(Boolean);
    },
});
const territoriesObjectSelector = selector({
  key: 'territoriesObjectSelector',
  get: ({ get }) => {
    const territories = get(territoriesState);
    const territoriesObject = {};
    for (const territory of territories) {
      territoriesObject[territory._id] = { ...territory };
    }
    return territoriesObject;
  },
});

const populatedObservationsSelector = selector({
  key: 'populatedObservationsSelector',
  get: ({ get }) => {
    const observations = get(territoryObservationsState);
    const territory = get(territoriesObjectSelector);
    const populatedObservations = {};
    for (const obs of observations) {
      populatedObservations[obs._id] = { ...obs, territory: territory[obs.territory] };
    }
    return populatedObservations;
  },
});

const observationsBySearchSelector = selectorFamily({
  key: 'observationsBySearchSelector',
  get:
    ({ search }) =>
    ({ get }) => {
      const populatedObservations = get(populatedObservationsSelector);
      const observations = get(onlyFilledObservationsTerritories);
      if (!search?.length) return [];
      const observationsFilteredBySearch = filterBySearch(search, observations, true);
      return observationsFilteredBySearch.map((obs) => populatedObservations[obs._id]).filter(Boolean);
    },
});

const initTabs = ['Actions', 'Personnes', 'Commentaires', 'Lieux', 'Territoires', 'Observations'];

const View = () => {
  useTitle('Recherche');
  useDataLoader({ refreshOnMount: true });

  const [search, setSearch] = useLocalStorage('fullsearch', '');
  const [activeTab, setActiveTab] = useLocalStorage('fullsearch-tab', 0);
  const [tabsContents, setTabsContents] = useState(initTabs);

  useEffect(() => {
    if (!search) setTabsContents(initTabs);
  }, [search]);

  const allActions = useRecoilValue(actionsState);
  const allTerritories = useRecoilValue(territoriesState);
  const allPlaces = useRecoilValue(placesState);

  const actions = useMemo(() => {
    if (!search?.length) return [];
    return filterBySearch(search, allActions);
  }, [search, allActions]);

  const persons = useRecoilValue(personsFilteredBySearchForSearchSelector({ search }));
  const organisation = useRecoilValue(organisationState);
  const comments = useRecoilValue(commentsFilteredBySearchSelector({ search }));

  const places = useMemo(() => {
    if (!search?.length) return [];
    return filterBySearch(search, allPlaces);
  }, [search, allPlaces]);

  const territories = useMemo(() => {
    if (!search?.length) return [];
    return filterBySearch(search, allTerritories);
  }, [search, allTerritories]);

  const observations = useRecoilValue(observationsBySearchSelector({ search }));

  const renderContent = () => {
    if (!search) return 'Pas de recherche, pas de résultat !';
    if (search.length < 3) return 'Recherche trop courte (moins de 3 caractères), pas de résultat !';
    return (
      <>
        <ul className="tw-mb-5 tw-flex tw-list-none tw-flex-wrap tw-justify-evenly tw-border-b tw-border-zinc-200 tw-pl-0">
          {tabsContents
            .filter((tabCaption) => {
              if (['Observations', 'Territoires'].includes(tabCaption)) {
                return !!organisation.territoriesEnabled;
              }
              return true;
            })
            .map((tabCaption, index) => {
              return (
                <li key={index} className="tw-grow tw-cursor-pointer">
                  <button
                    key={tabCaption}
                    className={[
                      '-tw-mb-px tw-block tw-w-full tw-rounded-t-md tw-border tw-border-transparent tw-py-2 tw-px-4',
                      activeTab !== tabCaption && 'tw-text-main75',
                      activeTab === tabCaption && 'tw-border-x-zinc-200 tw-border-t-zinc-200 tw-bg-white',
                    ].join(' ')}
                    onClick={() => setActiveTab(tabCaption)}>
                    {tabCaption === 'Actions' && `Actions (${actions.length})`}
                    {tabCaption === 'Personnes' && `Personnes (${persons.length})`}
                    {tabCaption === 'Commentaires' && `Commentaires (${comments.length})`}
                    {tabCaption === 'Lieux' && `Lieux (${places.length})`}
                    {tabCaption === 'Territoires' && `Territoires (${territories.length})`}
                    {tabCaption === 'Observations' && `Observations (${observations.length})`}
                  </button>
                </li>
              );
            })}
        </ul>
        <div className="[&_table]:!tw-p0 tw-w-full tw-rounded-lg tw-bg-white tw-py-4 tw-px-8 print:tw-mb-4 [&_.title]:!tw-pb-5">
          {activeTab === 'Actions' && <Actions actions={actions} />}
          {activeTab === 'Personnes' && <Persons persons={persons} />}
          {activeTab === 'Commentaires' && <Comments comments={comments} />}
          {activeTab === 'Lieux' && <Places places={places} />}
          {activeTab === 'Territoires' && <Territories territories={territories} />}
          {activeTab === 'Observations' && <TerritoryObservations observations={observations} />}
        </div>
      </>
    );
  };

  return (
    <>
      <Header title="Rechercher" />
      <div className="tw-mb-10 tw-flex tw-items-center tw-border-b tw-border-zinc-200 tw-pb-5">
        <Search placeholder="Par mot clé" value={search} onChange={setSearch} />
      </div>
      {renderContent()}
    </>
  );
};

const Actions = ({ actions }) => {
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);
  const [sortBy, setSortBy] = useLocalStorage('actions-consultations-sortBy', 'dueAt');
  const [sortOrder, setSortOrder] = useLocalStorage('actions-consultations-sortOrder', 'ASC');

  const data = useMemo(() => {
    return [...actions].sort(sortActionsOrConsultations(sortBy, sortOrder));
  }, [actions, sortBy, sortOrder]);

  if (!actions.length) return <div />;

  const moreThanOne = data.length > 1;

  return (
    <Table
      className="Table"
      data={data.map((a) => {
        if (a.urgent) return { ...a, style: { backgroundColor: '#fecaca' } };
        return a;
      })}
      title={`Action${moreThanOne ? 's' : ''} (${data.length})`}
      noData="Pas d'action"
      onRowClick={(action) => {
        const searchParams = new URLSearchParams(history.location.search);
        searchParams.set('actionId', action._id);
        history.push(`?${searchParams.toString()}`);
      }}
      rowKey="_id"
      columns={[
        {
          title: '',
          dataKey: 'urgentOrGroupOrConsultation',
          small: true,
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortBy,
          sortOrder,
          render: (actionOrConsult) => {
            return (
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                {!!actionOrConsult.urgent && <ExclamationMarkButton />}
                {!!organisation.groupsEnabled && !!actionOrConsult.group && (
                  <span className="tw-text-3xl" aria-label="Action familiale" title="Action familiale">
                    👪
                  </span>
                )}
                {!!actionOrConsult.isConsultation && <ConsultationButton />}
              </div>
            );
          },
        },
        {
          title: 'Date',
          dataKey: 'dueAt',
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortBy,
          sortOrder,
          render: (a) => <DateBloc date={[DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt} />,
        },
        {
          title: 'Heure',
          dataKey: 'time',
          render: (action) => {
            if (!action.dueAt || !action.withTime) return null;
            return formatTime(action.dueAt);
          },
        },
        {
          title: 'Nom',
          dataKey: 'name',
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortBy,
          sortOrder,
        },
        {
          title: 'Personne suivie',
          dataKey: 'person',
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortBy,
          sortOrder,
          render: (action) => <PersonName item={action} />,
        },
        {
          title: 'Statut',
          dataKey: 'status',
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortBy,
          sortOrder,
          render: (action) => <ActionStatus status={action.status} />,
        },
        {
          title: 'Équipe(s) en charge',
          dataKey: 'team',
          render: (a) => (
            <div className="px-2 tw-flex tw-flex-shrink-0 tw-flex-col tw-gap-px">
              {Array.isArray(a?.teams) ? a.teams.map((e) => <TagTeam key={e} teamId={e} />) : <TagTeam teamId={a?.team} />}
            </div>
          ),
        },
      ]}
    />
  );
};

const Persons = ({ persons }) => {
  const history = useHistory();
  const teams = useRecoilValue(teamsState);
  const organisation = useRecoilValue(organisationState);

  const [sortBy, setSortBy] = useLocalStorage('person-sortBy', 'name');
  const [sortOrder, setSortOrder] = useLocalStorage('person-sortOrder', 'ASC');
  const data = useMemo(() => {
    return [...persons].sort(sortPersons(sortBy, sortOrder));
  }, [persons, sortBy, sortOrder]);

  if (!data?.length) return <div />;
  const moreThanOne = data.length > 1;

  const Teams = ({ person: { _id, assignedTeams } }) => (
    <React.Fragment key={_id}>
      {assignedTeams?.map((teamId) => (
        <TagTeam key={teamId} teamId={teamId} />
      ))}
    </React.Fragment>
  );

  return (
    <Table
      data={data}
      title={`Personne${moreThanOne ? 's' : ''} suivie${moreThanOne ? 's' : ''} (${data.length})`}
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
          title: 'Vigilance',
          dataKey: 'alertness',
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortOrder,
          sortBy,
          render: (p) =>
            p.alertness ? (
              <ExclamationMarkButton
                aria-label="Personne très vulnérable, ou ayant besoin d'une attention particulière"
                title="Personne très vulnérable, ou ayant besoin d'une attention particulière"
              />
            ) : null,
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
  );
};

const Comments = ({ comments }) => {
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);

  if (!comments?.length) return <div />;
  const moreThanOne = comments.length > 1;

  return (
    <Table
      className="Table"
      title={`Commentaire${moreThanOne ? 's' : ''} (${comments.length})`}
      data={comments}
      noData="Pas de commentaire"
      onRowClick={(comment) => {
        try {
          history.push(`/${comment.type}/${comment[comment.type]._id}`);
        } catch (errorLoadingComment) {
          capture(errorLoadingComment, { extra: { message: 'error loading comment from search', comment } });
        }
      }}
      rowKey="_id"
      columns={[
        {
          title: '',
          dataKey: 'urgentOrGroup',
          small: true,
          render: (comment) => {
            return (
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                {!!comment.urgent && <ExclamationMarkButton />}
                {!!organisation.groupsEnabled && !!comment.group && (
                  <span className="tw-text-3xl" aria-label="Commentaire familial" title="Commentaire familial">
                    👪
                  </span>
                )}
              </div>
            );
          },
        },
        {
          title: 'Date',
          dataKey: 'date',
          render: (comment) => (
            <span>
              {dayjs(comment.date || comment.createdAt).format('ddd DD/MM/YY')}
              <br />à {dayjs(comment.date || comment.createdAt).format('HH:mm')}
            </span>
          ),
        },
        {
          title: 'Utilisateur',
          dataKey: 'user',
          render: (comment) => <UserName id={comment.user} />,
        },
        {
          title: 'Type',
          dataKey: 'type',
          render: (comment) => <span>{comment.type === 'action' ? 'Action' : 'Personne suivie'}</span>,
        },
        {
          title: 'Nom',
          dataKey: 'person',
          render: (comment) => (
            <>
              <b></b>
              <b>{comment[comment.type]?.name}</b>
              {comment.type === 'action' && (
                <>
                  <br />
                  <i>(pour {comment.person?.name || ''})</i>
                </>
              )}
            </>
          ),
        },
        {
          title: 'Commentaire',
          dataKey: 'comment',
          render: (comment) => {
            return (
              <p>
                {comment.comment
                  ? comment.comment.split('\n').map((c, i, a) => {
                      if (i === a.length - 1) return c;
                      return (
                        <React.Fragment key={i}>
                          {c}
                          <br />
                        </React.Fragment>
                      );
                    })
                  : ''}
              </p>
            );
          },
        },
      ]}
    />
  );
};

const Territories = ({ territories }) => {
  const history = useHistory();
  const [sortBy, setSortBy] = useLocalStorage('territory-sortBy', 'name');
  const [sortOrder, setSortOrder] = useLocalStorage('territory-sortOrder', 'ASC');

  const data = useMemo(() => {
    return [...territories].sort(sortTerritories(sortBy, sortOrder));
  }, [territories, sortBy, sortOrder]);

  if (!data?.length) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <Table
      className="Table"
      title={`Territoire${moreThanOne ? 's' : ''} (${data.length})`}
      noData="Pas de territoire"
      data={data}
      onRowClick={(territory) => history.push(`/territory/${territory._id}`)}
      rowKey="_id"
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
          title: 'Types',
          dataKey: 'types',
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortOrder,
          sortBy,
          render: ({ types }) => (types ? types.join(', ') : ''),
        },
        {
          title: 'Périmètre',
          dataKey: 'perimeter',
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortOrder,
          sortBy,
        },
        {
          title: 'Créé le',
          dataKey: 'createdAt',
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortOrder,
          sortBy,
          render: (territory) => formatDateWithFullMonth(territory.createdAt || ''),
        },
      ]}
    />
  );
};

const Places = ({ places }) => {
  const relsPersonPlace = useRecoilValue(relsPersonPlaceState);
  const persons = useRecoilValue(personsState);

  if (!places?.length) return <div />;
  const moreThanOne = places.length > 1;

  return (
    <Table
      className="Table"
      title={`Lieu${moreThanOne ? 'x' : ''} fréquenté${moreThanOne ? 's' : ''} (${places.length})`}
      noData="Pas de lieu fréquenté"
      data={places}
      rowKey="_id"
      columns={[
        { title: 'Nom', dataKey: 'name' },
        {
          title: 'Personnes suivies',
          dataKey: 'persons',
          render: (place) => (
            <p style={{ marginBottom: 0 }}>
              {relsPersonPlace
                .filter((rel) => rel.place === place._id)
                .map((rel) => persons.find((p) => p._id === rel.person))
                .map(({ _id, name }, index, arr) => (
                  <Fragment key={_id}>
                    {name}
                    {index < arr.length - 1 && <br />}
                  </Fragment>
                ))}
            </p>
          ),
        },
        { title: 'Créée le', dataKey: 'createdAt', render: (place) => formatDateWithFullMonth(place.createdAt) },
      ]}
    />
  );
};

const TerritoryObservations = ({ observations }) => {
  const history = useHistory();

  if (!observations?.length) return <div />;
  const moreThanOne = observations.length > 1;

  return (
    <Table
      className="Table"
      title={`Observation${moreThanOne ? 's' : ''} de territoire${moreThanOne ? 's' : ''}  (${observations.length})`}
      noData="Pas d'observation"
      data={observations}
      onRowClick={(obs) => history.push(`/territory/${obs.territory._id}`)}
      rowKey="_id"
      columns={[
        {
          title: 'Date',
          dataKey: 'observedAt',
          render: (obs) => (
            <span>
              {dayjs(obs.observedAt || obs.createdAt).format('ddd DD/MM/YY')}
              <br />à {dayjs(obs.observedAt || obs.createdAt).format('HH:mm')}
            </span>
          ),
        },
        {
          title: 'Utilisateur',
          dataKey: 'user',
          render: (obs) => <UserName id={obs.user} />,
        },
        { title: 'Territoire', dataKey: 'territory', render: (obs) => obs?.territory?.name },
        { title: 'Observation', dataKey: 'entityKey', render: (obs) => <Observation noBorder obs={obs} />, left: true },
      ]}
    />
  );
};

export default View;
