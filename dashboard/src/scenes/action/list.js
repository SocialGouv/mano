import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import CreateAction from './CreateAction';
import { SmallerHeaderWithBackButton } from '../../components/header';
import Page from '../../components/pagination';
import SelectStatus from '../../components/SelectStatus';
import Loading from '../../components/loading';
import Table from '../../components/table';
import ActionStatus from '../../components/ActionStatus';
import DateBloc from '../../components/DateBloc';
import PaginationContext from '../../contexts/pagination';
import Search from '../../components/search';
import ActionsCalendar from '../../components/ActionsCalendar';
import SelectCustom from '../../components/SelectCustom';
import ActionName from '../../components/ActionName';
import PersonName from '../../components/PersonName';
import { formatDateWithFullMonth, formatTime } from '../../services/date';
import { actionsState } from '../../recoil/actions';
import { commentsState } from '../../recoil/comments';
import { currentTeamState } from '../../recoil/auth';
import { personsWithPlacesSelector } from '../../recoil/selectors';
import { filterBySearch } from '../search/utils';
import ExclamationMarkButton from '../../components/ExclamationMarkButton';

const showAsOptions = ['Calendrier', 'Liste'];

const List = () => {
  const history = useHistory();
  const location = useLocation();
  const currentTeam = useRecoilValue(currentTeamState);
  const actions = useRecoilValue(actionsState);
  const comments = useRecoilValue(commentsState);
  const persons = useRecoilValue(personsWithPlacesSelector);
  const { search, setSearch, status, setStatus, page, setPage } = useContext(PaginationContext);
  const [showAs, setShowAs] = useState(new URLSearchParams(location.search)?.get('showAs') || showAsOptions[0]); // calendar, list
  // List of actions filtered by current team and selected status.
  const actionsByTeamAndStatus = useMemo(
    () => actions.filter((action) => action.team === currentTeam._id && (status ? action.status === status : true)),
    [actions, currentTeam, status]
  );
  // The next memos are used to filter by search (empty array when search is empty).
  const actionsIds = useMemo(() => (search?.length ? actionsByTeamAndStatus.map((action) => action._id) : []), [actionsByTeamAndStatus, search]);
  const personsForActions = useMemo(
    () => (actionsIds?.length ? persons.filter((person) => actionsIds.includes(person.action)) : []),
    [actionsIds, persons]
  );
  const commentsForActions = useMemo(
    () => (actionsIds?.length ? comments.filter((comment) => actionsIds.includes(comment.action)) : []),
    [actionsIds, comments]
  );
  const actionsFiltered = useMemo(() => {
    if (!search?.length) return actionsByTeamAndStatus;
    const actionsIdsByActionsSearch = actionsByTeamAndStatus?.length ? filterBySearch(search, actionsByTeamAndStatus).map((a) => a._id) : [];
    const actionsIdsByActionsCommentsSearch = commentsForActions?.length ? filterBySearch(search, commentsForActions).map((c) => c.action) : [];
    const personIdsByPersonsSearch = personsForActions?.length ? filterBySearch(search, personsForActions).map((p) => p._id) : [];
    const actionIdsByPersonsSearch = personIdsByPersonsSearch?.length
      ? actionsByTeamAndStatus.filter((a) => personIdsByPersonsSearch.includes(a.person))
      : [];
    const actionsIdsFilterBySearch = [...new Set([...actionsIdsByActionsSearch, ...actionsIdsByActionsCommentsSearch, ...actionIdsByPersonsSearch])];
    return actionsByTeamAndStatus.filter((a) => actionsIdsFilterBySearch.includes(a._id));
  }, [actionsByTeamAndStatus, commentsForActions, personsForActions, search]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('showAs', showAs);
    history.replace({ pathname: location.pathname, search: searchParams.toString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAs]);
  const limit = 20;

  if (!actionsFiltered) return <Loading />;

  const data = actionsFiltered.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  const total = actionsFiltered.length;

  return (
    <>
      <SmallerHeaderWithBackButton
        titleStyle={{ fontWeight: '400' }}
        title={
          <span>
            Actions de l'équipe <b>{currentTeam?.name || ''}</b>
          </span>
        }
      />
      <Row style={{ marginBottom: 20, justifyContent: 'center' }}>
        <Col md={12}>
          <CreateAction disabled={!currentTeam} isMulti refreshable />
        </Col>
      </Row>
      <Row style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <label htmlFor="search" style={{ marginRight: 20, width: 250, flexShrink: 0 }}>
            Recherche :{' '}
          </label>
          <Search placeholder="Par mot clé, présent dans le nom, la catégorie, un commentaire, ..." value={search} onChange={setSearch} />
        </Col>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <label htmlFor="filter-by-status" style={{ marginRight: 20, width: 250, flexShrink: 0 }}>
            Filtrer par statut :
          </label>
          <div style={{ width: 300 }}>
            <SelectStatus inputId="filter-by-status" noTitle onChange={(event) => setStatus(event.target.value)} value={status} />
          </div>
        </Col>
        <Col md={6} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <label htmlFor="actions-show-as" style={{ marginRight: 20, width: 250, flexShrink: 0 }}>
            Afficher par :{' '}
          </label>
          <div style={{ width: 300 }}>
            <SelectCustom
              onChange={setShowAs}
              value={[showAs]}
              options={showAsOptions}
              isClearable={false}
              isMulti={false}
              inputId="actions-show-as"
              getOptionValue={(i) => i}
              getOptionLabel={(i) => i}
            />
          </div>
        </Col>
      </Row>

      {showAs === showAsOptions[0] && (
        <div style={{ minHeight: '100vh' }}>
          {' '}
          <ActionsCalendar actions={actionsFiltered} />
        </div>
      )}
      {showAs === showAsOptions[1] && (
        <>
          <Table
            data={data.map((a) => (a.urgent ? { ...a, style: { backgroundColor: '#fecaca' } } : a))}
            rowKey={'_id'}
            onRowClick={(action) => history.push(`/action/${action._id}`)}
            columns={[
              {
                title: '',
                dataKey: 'urgent',
                small: true,
                render: (action) => {
                  return action.urgent ? <ExclamationMarkButton /> : null;
                },
              },
              {
                title: 'À faire le',
                dataKey: 'dueAt' || '_id',
                render: (action) => {
                  return <DateBloc date={action.dueAt} />;
                },
              },
              {
                title: 'Heure',
                dataKey: '_id',
                render: (action) => {
                  if (!action.dueAt || !action.withTime) return null;
                  return formatTime(action.dueAt);
                },
              },
              {
                title: 'Nom',
                dataKey: 'name',
                render: (action) => <ActionName action={action} />,
              },
              {
                title: 'Personne suivie',
                dataKey: 'person',
                render: (action) => <PersonName item={action} />,
              },
              { title: 'Créée le', dataKey: 'createdAt', render: (action) => formatDateWithFullMonth(action.createdAt || '') },
              { title: 'Statut', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
            ]}
          />
          <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
        </>
      )}
    </>
  );
};

export default List;
