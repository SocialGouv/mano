import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { Row, Col, TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import DateBloc from '../../components/DateBloc';
import Header from '../../components/header';
import Box from '../../components/Box';
import ActionStatus from '../../components/ActionStatus';
import Table from '../../components/table';
import Observation from '../territory-observations/view';
import dayjs from 'dayjs';
import { capture } from '../../services/sentry';
import UserName from '../../components/UserName';
import Search from '../../components/search';
import TagTeam from '../../components/TagTeam';
import { organisationState, teamsState } from '../../recoil/auth';
import { actionsState } from '../../recoil/actions';
import { personsState } from '../../recoil/persons';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { territoriesState } from '../../recoil/territory';
import { selector, selectorFamily, useRecoilValue } from 'recoil';
import { itemsGroupedByPersonSelector, onlyFilledObservationsTerritories, personsObjectSelector } from '../../recoil/selectors';
import PersonName from '../../components/PersonName';
import { formatBirthDate, formatDateWithFullMonth, formatTime } from '../../services/date';
import { useDataLoader } from '../../components/DataLoader';
import { placesState } from '../../recoil/places';
import { filterBySearch } from './utils';
import { commentsState } from '../../recoil/comments';
import useTitle from '../../services/useTitle';
import useSearchParamState from '../../services/useSearchParamState';
import ExclamationMarkButton from '../../components/tailwind/ExclamationMarkButton';
import ConsultationButton from '../../components/ConsultationButton';

const initTabs = ['Actions', 'Personnes', 'Commentaires', 'Lieux', 'Territoires', 'Observations'];

const View = () => {
  useTitle('Recherche');
  useDataLoader({ refreshOnMount: true });

  const [search, setSearch] = useSearchParamState('search', '');
  const [activeTab, setActiveTab] = useSearchParamState('tab', 0);
  const [tabsContents, setTabsContents] = useState(initTabs);

  const updateTabContent = (tabIndex, content) => setTabsContents((contents) => contents.map((c, index) => (index === tabIndex ? content : c)));

  useEffect(() => {
    if (!search) setTabsContents(initTabs);
  }, [search]);

  const renderContent = () => {
    if (!search) return 'Pas de recherche, pas de résultat !';
    if (search.length < 3) return 'Recherche trop courte (moins de 3 caractères), pas de résultat !';
    return (
      <>
        <Nav tabs fill style={{ marginBottom: 20 }}>
          {tabsContents.map((tabCaption, index) => (
            <NavItem key={index} style={{ cursor: 'pointer' }}>
              <NavLink key={index} className={`${Number(activeTab) === index && 'active'}`} onClick={() => setActiveTab(index)}>
                {tabCaption}
              </NavLink>
            </NavItem>
          ))}
        </Nav>
        <TabContent activeTab={Number(activeTab)}>
          <TabPane tabId={0}>
            <Actions search={search} onUpdateResults={(total) => updateTabContent(0, `Actions (${total})`)} />
          </TabPane>
          <TabPane tabId={1}>
            <Persons search={search} onUpdateResults={(total) => updateTabContent(1, `Personnes (${total})`)} />
          </TabPane>
          <TabPane tabId={2}>
            <Comments search={search} onUpdateResults={(total) => updateTabContent(2, `Commentaires (${total})`)} />
          </TabPane>
          <TabPane tabId={3}>
            <Places search={search} onUpdateResults={(total) => updateTabContent(3, `Lieux (${total})`)} />
          </TabPane>
          <TabPane tabId={4}>
            <Territories search={search} onUpdateResults={(total) => updateTabContent(4, `Territoires (${total})`)} />
          </TabPane>
          <TabPane tabId={5}>
            <TerritoryObservations search={search} onUpdateResults={(total) => updateTabContent(5, `Observations (${total})`)} />
          </TabPane>
        </TabContent>
      </>
    );
  };

  return (
    <>
      <Header title="Rechercher" refreshButton />
      <Row style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <Search placeholder="Par mot clé" value={search} onChange={setSearch} />
        </Col>
      </Row>
      {renderContent()}
    </>
  );
};

const Actions = ({ search, onUpdateResults }) => {
  const history = useHistory();
  const actions = useRecoilValue(actionsState);
  const organisation = useRecoilValue(organisationState);

  const data = useMemo(() => {
    if (!search?.length) return [];
    return filterBySearch(search, actions);
  }, [search, actions]);

  useEffect(() => {
    onUpdateResults(data.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  if (!data) return <div />;

  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Action${moreThanOne ? 's' : ''} (${data.length})`}
          noData="Pas d'action"
          data={data}
          onRowClick={(action) => history.push(`/action/${action._id}`)}
          rowKey="_id"
          columns={[
            {
              title: '',
              dataKey: 'urgentOrGroupOrConsultation',
              small: true,
              render: (actionOrConsult) => {
                return (
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                    {!!actionOrConsult.urgent && <ExclamationMarkButton />}
                    {!!organisation.groupEnabled && !!actionOrConsult.group && (
                      <span className="tw-text-3xl" aria-label="Action familiale" title="Action familiale">
                        👪
                      </span>
                    )}
                    {!!actionOrConsult.isConsultation && <ConsultationButton />}
                  </div>
                );
              },
            },
            { title: 'À faire le ', dataKey: 'dueAt', render: (action) => <DateBloc date={action.dueAt} /> },
            {
              title: 'Heure',
              dataKey: '_id',
              render: (action) => {
                if (!action.dueAt || !action.withTime) return null;
                return formatTime(action.dueAt);
              },
            },
            { title: 'Nom', dataKey: 'name' },
            { title: 'Personne suivie', dataKey: 'person', render: (action) => <PersonName item={action} /> },
            { title: 'Statut', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

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
    ({ search }) =>
    ({ get }) => {
      const persons = get(personsWithFormattedBirthDateSelector);
      const personsPopulated = get(itemsGroupedByPersonSelector);
      if (!search?.length) return [];
      return filterBySearch(search, persons).map((p) => personsPopulated[p._id]);
    },
});

const Persons = ({ search, onUpdateResults }) => {
  const history = useHistory();
  const teams = useRecoilValue(teamsState);
  const organisation = useRecoilValue(organisationState);

  const data = useRecoilValue(personsFilteredBySearchForSearchSelector({ search }));

  useEffect(() => {
    onUpdateResults(data.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  if (!data) return <div />;

  const moreThanOne = data.length > 1;

  const Teams = ({ person: { _id, assignedTeams } }) => (
    <React.Fragment key={_id}>
      {assignedTeams?.map((teamId) => (
        <TagTeam key={teamId} teamId={teamId} />
      ))}
    </React.Fragment>
  );

  return (
    <>
      <StyledBox>
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
              small: true,
              render: (person) => {
                if (!person.group) return null;
                return (
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                    <span className="tw-text-3xl" aria-label="Person avec des liens familiaux" title="Person avec des liens familiaux">
                      👪
                    </span>
                  </div>
                );
              },
            },
            { title: 'Nom', dataKey: 'name' },
            {
              title: 'Vigilance',
              dataKey: 'alertness',
              render: (p) =>
                p.alertness ? (
                  <ExclamationMarkButton
                    aria-label="Personne très vulnérable, ou ayant besoin d'une attention particulière"
                    title="Personne très vulnérable, ou ayant besoin d'une attention particulière"
                  />
                ) : null,
            },
            { title: 'Équipe(s) en charge', dataKey: 'assignedTeams', render: (person) => <Teams teams={teams} person={person} /> },
            { title: 'Suivi(e) depuis le', dataKey: 'followedSince', render: (p) => formatDateWithFullMonth(p.followedSince || p.createdAt || '') },
          ].filter((c) => organisation.groupsEnabled || c.dataKey !== 'group')}
        />
      </StyledBox>
      <hr />
    </>
  );
};

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

const Comments = ({ search, onUpdateResults }) => {
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);

  const data = useRecoilValue(commentsFilteredBySearchSelector({ search }));

  useEffect(() => {
    onUpdateResults(data.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  if (!data) return <div />;

  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Commentaire${moreThanOne ? 's' : ''} (${data.length})`}
          data={data}
          noData="Pas de commentaire"
          onRowClick={(comment) => {
            try {
              history.push(`/${comment.type}/${comment[comment.type]._id}`);
            } catch (errorLoadingComment) {
              capture(errorLoadingComment, { extra: { message: 'error loading comment from search', comment, search } });
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
                    {!!organisation.groupEnabled && !!comment.group && (
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
      </StyledBox>
      <hr />
    </>
  );
};

const Territories = ({ search, onUpdateResults }) => {
  const history = useHistory();
  const territories = useRecoilValue(territoriesState);

  const data = useMemo(() => {
    if (!search?.length) return [];
    return filterBySearch(search, territories);
  }, [search, territories]);

  useEffect(() => {
    onUpdateResults(data.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Territoire${moreThanOne ? 's' : ''} (${data.length})`}
          noData="Pas de territoire"
          data={data}
          onRowClick={(territory) => history.push(`/territory/${territory._id}`)}
          rowKey="_id"
          columns={[
            { title: 'Nom', dataKey: 'name' },
            { title: 'Types', dataKey: 'types', render: ({ types }) => (types ? types.join(', ') : '') },
            { title: 'Périmètre', dataKey: 'perimeter' },
            { title: 'Créé le', dataKey: 'createdAt', render: (territory) => formatDateWithFullMonth(territory.createdAt || '') },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const Places = ({ search, onUpdateResults }) => {
  const history = useHistory();
  const relsPersonPlace = useRecoilValue(relsPersonPlaceState);
  const persons = useRecoilValue(personsState);
  const places = useRecoilValue(placesState);

  const data = useMemo(() => {
    if (!search?.length) return [];
    return filterBySearch(search, places);
  }, [search, places]);

  useEffect(() => {
    onUpdateResults(data.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Lieu${moreThanOne ? 'x' : ''} fréquenté${moreThanOne ? 's' : ''} (${data.length})`}
          noData="Pas de lieu fréquenté"
          data={data}
          onRowClick={(obs) => history.push(`/territory/${obs.territory._id}`)}
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
      </StyledBox>
      <hr />
    </>
  );
};

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
    const onlyFilledObservations = get(onlyFilledObservationsTerritories);
    const territory = get(territoriesObjectSelector);
    const populatedObservations = {};
    for (const obs of onlyFilledObservations) {
      populatedObservations[obs._id] = { ...obs, territory: territory[obs.territory] };
    }
    return populatedObservations;
  },
});

const observationsBySerachSelector = selectorFamily({
  key: 'observationsBySerachSelector',
  get:
    ({ search }) =>
    ({ get }) => {
      const populatedObservations = get(populatedObservationsSelector);
      const observations = get(onlyFilledObservationsTerritories);
      if (!search?.length) return [];
      const observationsFilteredBySearch = filterBySearch(search, observations);
      return observationsFilteredBySearch.map((obs) => populatedObservations[obs._id]).filter(Boolean);
    },
});

const TerritoryObservations = ({ search, onUpdateResults }) => {
  const history = useHistory();

  const data = useRecoilValue(observationsBySerachSelector({ search }));

  useEffect(() => {
    onUpdateResults(data.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Observation${moreThanOne ? 's' : ''} de territoire${moreThanOne ? 's' : ''}  (${data.length})`}
          noData="Pas d'observation"
          data={data}
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
      </StyledBox>
      <hr />
    </>
  );
};

const StyledBox = styled(Box)`
  border-radius: 16px;
  padding: 16px 32px;
  @media print {
    margin-bottom: 15px;
  }

  .Table {
    padding: 0;
  }
`;

export default View;
