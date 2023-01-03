import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { selectorFamily, useRecoilValue } from 'recoil';
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
import ActionOrConsultationName from '../../components/ActionOrConsultationName';
import PersonName from '../../components/PersonName';
import { formatTime } from '../../services/date';
import { CANCEL, DONE, mappedIdsToLabels, sortActionsOrConsultations, TODO } from '../../recoil/actions';
import { currentTeamState, teamsState, organisationState, userState } from '../../recoil/auth';
import { arrayOfitemsGroupedByActionSelector, arrayOfitemsGroupedByConsultationSelector } from '../../recoil/selectors';
import { filterBySearch } from '../search/utils';
import ExclamationMarkButton from '../../components/tailwind/ExclamationMarkButton';
import useTitle from '../../services/useTitle';
import useSearchParamState from '../../services/useSearchParamState';
import ConsultationButton from '../../components/ConsultationButton';
import { disableConsultationRow } from '../../recoil/consultations';
import ButtonCustom from '../../components/ButtonCustom';
import agendaIcon from '../../assets/icons/agenda-icon.svg';
import { useDataLoader } from '../../components/DataLoader';
import ActionsCategorySelect from '../../components/tailwind/ActionsCategorySelect';
import { useLocalStorage } from 'react-use';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import TagTeam from '../../components/TagTeam';
import ConsultationModal from '../../components/ConsultationModal';

const showAsOptions = ['Calendrier', 'Liste', 'Hebdomadaire'];

const actionsByTeamAndStatusSelector = selectorFamily({
  key: 'actionsByTeamAndStatusSelector',
  get:
    ({ statuses, categories, teamIds, viewAllOrganisationData }) =>
    ({ get }) => {
      const actions = get(arrayOfitemsGroupedByActionSelector);
      const actionsByTeamAndStatus = actions.filter(
        (action) =>
          (viewAllOrganisationData ||
            !teamIds.length ||
            (Array.isArray(action.teams) ? teamIds.some((t) => action.teams.includes(t)) : teamIds.includes(action.team))) &&
          (!statuses.length || statuses.includes(action.status)) &&
          (!categories.length || categories.some((c) => (c === '-- Aucune --' ? action.categories.length === 0 : action.categories?.includes(c))))
      );
      return actionsByTeamAndStatus;
    },
});

const consultationsByStatusSelector = selectorFamily({
  key: 'consultationsByStatusSelector',
  get:
    ({ statuses }) =>
    ({ get }) => {
      const consultations = get(arrayOfitemsGroupedByConsultationSelector);
      const consultationsByStatus = consultations.filter((consult) => !statuses.length || statuses.includes(consult.status));
      return consultationsByStatus;
    },
});

const dataFilteredBySearchSelector = selectorFamily({
  key: 'dataFilteredBySearchSelector',
  get:
    ({ search, statuses, categories, teamIds, viewAllOrganisationData, sortBy, sortOrder }) =>
    ({ get }) => {
      const actions = get(actionsByTeamAndStatusSelector({ statuses, categories, teamIds, viewAllOrganisationData }));
      // When we filter by category, we don't want to see all consultations.
      const consultations = categories?.length ? [] : get(consultationsByStatusSelector({ statuses }));
      if (!search) {
        const dataFitered = [...actions, ...consultations].sort(sortActionsOrConsultations(sortBy, sortOrder));
        return dataFitered;
      }
      const actionsFiltered = filterBySearch(search, actions);
      const consultationsFiltered = filterBySearch(search, consultations);
      const dataFitered = [...actionsFiltered, ...consultationsFiltered].sort(sortActionsOrConsultations(sortBy, sortOrder));
      return dataFitered;
    },
});

const limit = 20;

const List = () => {
  useTitle('Agenda');
  const history = useHistory();
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);

  const { isLoading, refresh } = useDataLoader();
  const [modalOpen, setModalOpen] = useState(false);

  const [showConsultationModal, setShowConsultationModal] = useState(false);

  const [search, setSearch] = useSearchParamState('search', '');
  const [page, setPage] = useSearchParamState('page', 0, { resetToDefaultIfTheFollowingValueChange: currentTeam?._id });
  const [categories, setCategories] = useLocalStorage('action-categories', []);
  const [statuses, setStatuses] = useLocalStorage('action-statuses', [TODO]);
  const [selectedTeamIds, setSelectedTeamIds] = useLocalStorage('action-teams', [currentTeam._id]);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage('action-allOrg', false);

  const [actionDate, setActionDate] = useState(new Date());
  const [showAs, setShowAs] = useLocalStorage('action-showAs', showAsOptions[0]); // calendar, list
  const [sortBy, setSortBy] = useLocalStorage('actions-consultations-sortBy', 'dueAt');
  const [sortOrder, setSortOrder] = useLocalStorage('actions-consultations-sortOrder', 'ASC');

  const dataConsolidated = useRecoilValue(
    dataFilteredBySearchSelector({ search, statuses, categories, teamIds: selectedTeamIds, viewAllOrganisationData, sortBy, sortOrder })
  );
  const dataConsolidatedPaginated = useMemo(() => dataConsolidated.slice(page * limit, (page + 1) * limit), [dataConsolidated, page]);

  const total = dataConsolidated.length;

  return (
    <>
      <SmallHeader
        title={
          <span>
            Agenda{' '}
            {viewAllOrganisationData ? (
              <>de toute l'organisation</>
            ) : (
              <>
                {selectedTeamIds.length > 1 ? 'des équipes' : "de l'équipe"}{' '}
                <b>
                  {teams
                    .filter((t) => selectedTeamIds.includes(t._id))
                    .map((e) => e?.name)
                    .join(', ')}
                </b>
              </>
            )}
          </span>
        }
      />
      <div className="tw-mb-5 tw-flex tw-flex-row tw-justify-center">
        <div className="noprint tw-flex tw-w-full tw-justify-end tw-gap-3">
          <ButtonCustom onClick={() => refresh()} title="Rafraichir" disabled={isLoading} color="link" />
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
          {Boolean(user.healthcareProfessional) && (
            <ButtonCustom
              icon={agendaIcon}
              disabled={!currentTeam}
              onClick={() => {
                setShowConsultationModal(true);
              }}
              color="primary"
              title="Créer une nouvelle consultation"
              padding={'12px 24px'}
            />
          )}
        </div>
      </div>
      <div className="tw-mb-10 tw-flex tw-flex-wrap tw-border-b tw-border-gray-200">
        <div className="tw-mb-5 tw-flex tw-w-full tw-items-center tw-px-2">
          <label htmlFor="actions-show-as" className="tw-mr-5 tw-w-40 tw-shrink-0">
            Afficher par&nbsp;:
          </label>
          <div className="tw-basis-1/3">
            <SelectCustom
              onChange={({ value }) => setShowAs(value)}
              value={{ value: showAs, label: showAs }}
              options={showAsOptions.map((_option) => ({ value: _option, label: _option }))}
              isClearable={false}
              isMulti={false}
              inputId="actions-show-as"
              getOptionValue={(o) => o.value}
              getOptionLabel={(o) => o.label}
            />
          </div>
        </div>
        <div className="tw-mb-5 tw-flex tw-w-full tw-items-center tw-px-2">
          <label htmlFor="search" className="tw-mr-5 tw-w-40 tw-shrink-0">
            Recherche&nbsp;:
          </label>
          <Search placeholder="Par mot clé, présent dans le nom, la catégorie, un commentaire, ..." value={search} onChange={setSearch} />
        </div>
        <div className="tw-mb-5 tw-flex tw-basis-1/3 tw-flex-col tw-items-start tw-px-2">
          <label htmlFor="action-select-categories-filter">Filtrer par catégorie&nbsp;:</label>
          <div className="tw-w-full">
            <ActionsCategorySelect id="action-select-categories-filter" onChange={(c) => setCategories(c)} values={categories} />
          </div>
        </div>
        <div className="tw-mb-5 tw-flex tw-basis-1/3 tw-flex-col tw-items-start tw-px-2">
          <label htmlFor="action-select-categories-filter">Filtrer par équipe&nbsp;:</label>
          <div className="tw-w-full">
            <SelectTeamMultiple
              onChange={(teamIds) => {
                setSelectedTeamIds(teamIds);
              }}
              value={selectedTeamIds}
              colored
              isDisabled={viewAllOrganisationData}
            />
            {teams.length > 1 && (
              <label htmlFor="viewAllOrganisationData" className="tw-flex tw-items-center tw-text-sm">
                <input
                  id="viewAllOrganisationData"
                  type="checkbox"
                  className="tw-mr-2"
                  checked={viewAllOrganisationData}
                  onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
                />
                Actions de toute l'organisation
              </label>
            )}
          </div>
        </div>
        <div className="tw-mb-5 tw-flex tw-basis-1/3 tw-flex-col tw-items-start tw-px-2">
          <label htmlFor="action-select-status-filter">Filtrer par statut&nbsp;:</label>
          <div className="tw-w-full">
            <SelectCustom
              inputId="action-select-status-filter"
              classNamePrefix="action-select-status-filter"
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
        </div>
      </div>

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
              if (a.urgent) return { ...a, style: { backgroundColor: '#fecaca99' } };
              if (a.isConsultation) return { ...a, style: { backgroundColor: '#DDF4FF99' } };
              return a;
            })}
            rowKey={'_id'}
            onRowClick={(actionOrConsultation) => {
              if (actionOrConsultation.isConsultation) {
                history.push(`/person/${actionOrConsultation.person}?tab=Dossier+Médical&consultationId=${actionOrConsultation._id}`);
              } else {
                history.push(`/action/${actionOrConsultation._id}`);
              }
            }}
            rowDisabled={(actionOrConsultation) => disableConsultationRow(actionOrConsultation, user)}
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
                dataKey: 'dueAt' || '_id',
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortBy,
                sortOrder,
                render: (action) => {
                  return <DateBloc date={[DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt} />;
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
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortBy,
                sortOrder,
                dataKey: 'name',
                render: (action) => <ActionOrConsultationName item={action} />,
              },
              {
                title: 'Personne suivie',
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortBy,
                sortOrder,
                dataKey: 'person',
                render: (action) => <PersonName item={action} />,
              },
              {
                title: 'Statut',
                onSortOrder: setSortOrder,
                onSortBy: setSortBy,
                sortBy,
                sortOrder,
                dataKey: 'status',
                render: (action) => <ActionStatus status={action.status} />,
              },
              {
                title: 'Équipe(s) en charge',
                dataKey: 'team',
                render: (a) => (
                  <div className="px-2 tw-flex-shrink-0">
                    {Array.isArray(a?.teams) ? a.teams.map((e) => <TagTeam key={e} teamId={e} />) : <TagTeam teamId={a?.team} />}
                  </div>
                ),
              },
            ]}
          />
          <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
        </>
      )}
      <CreateActionModal dueAt={actionDate} open={modalOpen} setOpen={(value) => setModalOpen(value)} disabled={!currentTeam} isMulti refreshable />
      {showConsultationModal && (
        <ConsultationModal
          onClose={() => {
            setShowConsultationModal(false);
          }}
        />
      )}
    </>
  );
};

export default List;
