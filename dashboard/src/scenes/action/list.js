import React, { useEffect, useMemo, useState } from 'react';
import { Col, Label, Row, Button } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import CreateActionModal from '../../components/CreateActionModal';
import { SmallHeader } from '../../components/header';
import Page from '../../components/pagination';
import Table from '../../components/table';
import ActionStatus from '../../components/ActionStatus';
import DateBloc from '../../components/DateBloc';
import Search from '../../components/search';
import ActionsCalendar from '../../components/ActionsCalendar';
import ActionsWeekly from '../../components/ActionsWeekly';
import SelectCustom from '../../components/SelectCustom';
import ActionName from '../../components/ActionName';
import PersonName from '../../components/PersonName';
import { formatTime } from '../../services/date';
import { actionsState, mappedIdsToLabels, TODO } from '../../recoil/actions';
import { commentsState } from '../../recoil/comments';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { personsWithPlacesSelector } from '../../recoil/selectors';
import { filterBySearch } from '../search/utils';
import ExclamationMarkButton from '../../components/ExclamationMarkButton';
import useTitle from '../../services/useTitle';
import useSearchParamState from '../../services/useSearchParamState';
import ConsultationButton from '../../components/ConsultationButton';
import { consultationsState, disableConsultationRow } from '../../recoil/consultations';
import { loadingState, refreshTriggerState, useRefreshOnMount } from '../../components/Loader';
import ButtonCustom from '../../components/ButtonCustom';
import agendaIcon from '../../assets/icons/agenda-icon.svg';

const showAsOptions = ['Calendrier', 'Liste', 'Hebdomadaire'];

const List = () => {
  const history = useHistory();
  useTitle('Agenda');
  useRefreshOnMount();
  const [modalOpen, setModalOpen] = useState(false);
  const currentTeam = useRecoilValue(currentTeamState);
  const actions = useRecoilValue(actionsState);
  const consultations = useRecoilValue(consultationsState);
  const comments = useRecoilValue(commentsState);
  const persons = useRecoilValue(personsWithPlacesSelector);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const loading = useRecoilValue(loadingState);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const catsSelect = ['-- Aucune --', ...(organisation.categories || [])];

  const [search, setSearch] = useSearchParamState('search', '');
  const [page, setPage] = useSearchParamState('page', 0, { resetOnValueChange: currentTeam._id });
  const [statuses, setStatuses] = useSearchParamState('statuses', [TODO]);
  const [categories, setCategories] = useSearchParamState('categories', []);

  const [actionDate, setActionDate] = useState(new Date());
  const [showAs, setShowAs] = useState(window.localStorage.getItem('showAs') || showAsOptions[0]); // calendar, list

  // List of actions filtered by current team and selected statuses.
  const actionsByTeamAndStatus = useMemo(
    () =>
      actions.filter(
        (action) =>
          action.team === currentTeam._id &&
          (!statuses.length || statuses.includes(action.status)) &&
          (!categories.length || categories.some((c) => (c === '-- Aucune --' ? action.categories.length === 0 : action.categories?.includes(c))))
      ),
    [actions, currentTeam._id, statuses, categories]
  );
  // List of consultations filtered by current team and selected statuses.
  const consultationsByStatusAndAuthorization = useMemo(() => {
    return consultations.filter((consult) => !statuses.length || statuses.includes(consult.status));
  }, [consultations, statuses]);

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

  const consultationsFiltered = useMemo(() => {
    if (!search?.length) return consultationsByStatusAndAuthorization;
    if (!consultationsByStatusAndAuthorization?.length) return [];
    return filterBySearch(search, consultationsByStatusAndAuthorization);
  }, [search, consultationsByStatusAndAuthorization]);

  useEffect(() => {
    window.localStorage.setItem('showAs', showAs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAs]);
  const limit = 20;

  const dataConsolidated = useMemo(
    () => [...actionsFiltered, ...consultationsFiltered].sort((a, b) => new Date(b.dueAt) - new Date(a.dueAt)),
    [actionsFiltered, consultationsFiltered]
  );

  const dataConsolidatedPaginated = useMemo(
    () => dataConsolidated.filter((_, index) => index < (page + 1) * limit && index >= page * limit),
    [dataConsolidated, page]
  );
  const total = dataConsolidated.length;

  return (
    <>
      <SmallHeader
        title={
          <span>
            Agenda de l'équipe <b>{currentTeam?.name || ''}</b>
          </span>
        }
      />
      <Row style={{ marginBottom: 20, justifyContent: 'center' }}>
        <Col md={12}>
          <div className="noprint" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              onClick={() => {
                setRefreshTrigger({
                  status: true,
                  options: { showFullScreen: false, initialLoad: false },
                });
              }}
              disabled={!!loading}
              color="link"
              style={{ marginRight: 10 }}>
              Rafraichir
            </Button>
            <ButtonCustom
              icon={agendaIcon}
              disabled={!currentTeam}
              onClick={() => {
                setActionDate(new Date());
                setModalOpen(true);
              }}
              color="primary"
              title="Créer une nouvelle action"
              padding={'12px 24px'}
            />
          </div>
        </Col>
        <CreateActionModal dueAt={actionDate} open={modalOpen} setOpen={(value) => setModalOpen(value)} disabled={!currentTeam} isMulti refreshable />
      </Row>
      <Row style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={6} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <label htmlFor="actions-show-as" style={{ marginRight: 10, width: 155, flexShrink: 0 }}>
            Afficher par&nbsp;:
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
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <label htmlFor="search" style={{ marginRight: 10, width: 155, flexShrink: 0 }}>
            Recherche&nbsp;:
          </label>
          <Search placeholder="Par mot clé, présent dans le nom, la catégorie, un commentaire, ..." value={search} onChange={setSearch} />
        </Col>
        <Col md={12} lg={6} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <Label style={{ marginRight: 10, width: 155, flexShrink: 0 }} htmlFor="action-select-categories-filter">
            Filtrer par catégorie&nbsp;:
          </Label>
          <div style={{ width: '100%' }}>
            <SelectCustom
              options={catsSelect}
              value={categories}
              inputId="action-select-categories-filter"
              name="categories"
              onChange={(c) => setCategories(c)}
              isClearable
              isMulti
              getOptionValue={(c) => c}
              getOptionLabel={(c) => c}
            />
          </div>
        </Col>
        <Col md={12} lg={6} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <Label style={{ marginRight: 10, width: 155, flexShrink: 0 }} htmlFor="action-select-status-filter">
            Filtrer par statut&nbsp;:
          </Label>
          <div style={{ width: '100%' }}>
            <SelectCustom
              inputId="action-select-status-filter"
              options={mappedIdsToLabels}
              getOptionValue={(s) => s._id}
              getOptionLabel={(s) => s.name}
              name="statuses"
              onChange={(s) => setStatuses(s.map((s) => s._id))}
              isClearable
              isMulti
              value={mappedIdsToLabels.filter((s) => statuses.includes(s._id))}
            />
          </div>
        </Col>
      </Row>

      {showAs === showAsOptions[2] && (
        <div style={{ minHeight: '100vh' }}>
          <ActionsWeekly
            actions={dataConsolidated}
            onCreateAction={(date) => {
              setActionDate(date);
              setModalOpen(true);
            }}
          />
        </div>
      )}

      {showAs === showAsOptions[0] && (
        <div style={{ minHeight: '100vh' }}>
          <ActionsCalendar actions={dataConsolidated} />
        </div>
      )}
      {showAs === showAsOptions[1] && (
        <>
          <Table
            data={dataConsolidatedPaginated.map((a) => {
              if (a.urgent) return { ...a, style: { backgroundColor: '#fecaca' } };
              if (a.isConsultation) return { ...a, style: { backgroundColor: '#DDF4FF' } };
              return a;
            })}
            rowKey={'_id'}
            onRowClick={(actionOrConsultation) => {
              if (actionOrConsultation.isConsultation) {
                history.push(`/person/${actionOrConsultation.person}?tab=dossier+médical&consultationId=${actionOrConsultation._id}`);
              } else {
                history.push(`/action/${actionOrConsultation._id}`);
              }
            }}
            rowDisabled={(actionOrConsultation) => disableConsultationRow(actionOrConsultation, user)}
            columns={[
              {
                title: '',
                dataKey: 'urgentOrConsultation',
                small: true,
                render: (action) => {
                  if (action.urgent) return <ExclamationMarkButton />;
                  if (action.isConsultation) return <ConsultationButton />;
                  return null;
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
