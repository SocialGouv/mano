import React, { useCallback, useMemo } from 'react';
import { useLocalStorage } from 'react-use';
import { Col, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap';
import { useRecoilValue } from 'recoil';
import { HeaderStyled, RefreshButton, Title as HeaderTitle } from '../../components/header';
import Loading from '../../components/loading';
import {
  customFieldsPersonsSocialSelector,
  customFieldsPersonsMedicalSelector,
  fieldsPersonsCustomizableOptionsSelector,
  filterPersonsBaseSelector,
  personFieldsSelector,
} from '../../recoil/persons';
import { customFieldsObsSelector, territoryObservationsState } from '../../recoil/territoryObservations';
import DateRangePickerWithPresets from '../../components/DateRangePickerWithPresets';
import { CustomResponsiveBar, CustomResponsivePie } from '../../components/charts';
import Filters, { filterData } from '../../components/Filters';
import Card from '../../components/Card';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import { actionsCategoriesSelector, actionsState, DONE, flattenedCategoriesSelector, mappedIdsToLabels } from '../../recoil/actions';
import { reportsState } from '../../recoil/reports';
import ExportData from '../data-import-export/ExportData';
import SelectCustom from '../../components/SelectCustom';
import { territoriesState } from '../../recoil/territory';
import { dayjsInstance, getIsDayWithinHoursOffsetOfPeriod } from '../../services/date';
import { useDataLoader } from '../../components/DataLoader';
import { passagesState } from '../../recoil/passages';
import { rencontresState } from '../../recoil/rencontres';
import useTitle from '../../services/useTitle';
import { consultationsState } from '../../recoil/consultations';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import { customFieldsMedicalFileSelector } from '../../recoil/medicalFiles';
import { personsWithMedicalFileMergedSelector } from '../../recoil/selectors';
import { groupsState } from '../../recoil/groups';
import { capture } from '../../services/sentry';

const getDataForPeriod = (
  data,
  { startDate, endDate },
  selectedTeams,
  viewAllOrganisationData,
  { filters = [], field = 'createdAt', backupField = 'createdAt' } = {},
  callback = null
) => {
  if (!!filters?.filter((f) => Boolean(f?.value)).length) data = filterData(data, filters);
  if (!startDate || !endDate) {
    return data;
  }
  const offsetHours = Boolean(viewAllOrganisationData) || selectedTeams.every((e) => !e.nightSession) ? 0 : 12;

  if (callback) {
    return callback(data, offsetHours);
  }
  return data.filter((item) =>
    getIsDayWithinHoursOffsetOfPeriod(
      item[field] || item[backupField] || item.createdAt,
      { referenceStartDay: startDate, referenceEndDay: endDate },
      offsetHours
    )
  );
};
const tabs = ['Général', 'Accueil', 'Actions', 'Personnes suivies', 'Passages', 'Rencontres', 'Observations', 'Comptes-rendus', 'Consultations'];
const Stats = () => {
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const teams = useRecoilValue(teamsState);

  const allPersons = useRecoilValue(personsWithMedicalFileMergedSelector);
  const allConsultations = useRecoilValue(consultationsState);
  const allActions = useRecoilValue(actionsState);
  const allreports = useRecoilValue(reportsState);
  const allObservations = useRecoilValue(territoryObservationsState);
  const allPassages = useRecoilValue(passagesState);
  const allRencontres = useRecoilValue(rencontresState);
  const allGroups = useRecoilValue(groupsState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const fieldsPersonsCustomizableOptions = useRecoilValue(fieldsPersonsCustomizableOptionsSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const personFields = useRecoilValue(personFieldsSelector);
  const territories = useRecoilValue(territoriesState);
  const allCategories = useRecoilValue(flattenedCategoriesSelector);
  const groupsCategories = useRecoilValue(actionsCategoriesSelector);
  const { isLoading } = useDataLoader({ refreshOnMount: true });

  const [selectedTerritories, setSelectedTerritories] = useLocalStorage('stats-territories', []);
  const [activeTab, setActiveTab] = useLocalStorage('stats-tab', 0);
  const [filterPersons, setFilterPersons] = useLocalStorage('stats-filterPersons-defaultEverybody', [
    { field: 'outOfActiveList', value: "Oui et non (c'est-à-dire tout le monde)", type: 'multi-choice' },
  ]);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage('stats-viewAllOrganisationData', teams.length === 1);
  const [period, setPeriod] = useLocalStorage('period', { startDate: null, endDate: null });
  const [actionsStatuses, setActionsStatuses] = useLocalStorage('stats-actionsStatuses', DONE);
  const [selectedTeams, setSelectedTeams] = useLocalStorage('stats-teams', [currentTeam]);

  useTitle(`${tabs[activeTab]} - Statistiques`);

  const addFilter = ({ field, value }) => {
    setFilterPersons((filters) => [...filters, { field, value }]);
  };

  const filterByTeam = useCallback(
    (elements, key) => {
      return elements.filter((e) => viewAllOrganisationData || selectedTeams.some((f) => (e[key] || []).includes(f._id)));
    },
    [selectedTeams, viewAllOrganisationData]
  );

  const groupsForPersons = useCallback(
    (persons) => {
      const groupIds = persons.reduce((setOfGroupIds, person) => {
        if (person.group) {
          setOfGroupIds.add(person.group._id);
        }
        return setOfGroupIds;
      }, new Set());
      return allGroups.filter((group) => groupIds.has(group._id));
    },
    [allGroups]
  );

  const persons = useMemo(
    () =>
      getDataForPeriod(filterByTeam(allPersons, 'assignedTeams'), period, selectedTeams, viewAllOrganisationData, {
        filters: filterPersons.filter((f) => f.field !== 'outOfActiveList'),
        field: 'followedSince',
      }),
    [allPersons, filterByTeam, filterPersons, period, selectedTeams, viewAllOrganisationData]
  );

  const personsUpdated = useMemo(
    () =>
      getDataForPeriod(
        filterByTeam(allPersons, 'assignedTeams'),
        period,
        selectedTeams,
        viewAllOrganisationData,
        {
          filters: filterPersons.filter((f) => f.field !== 'outOfActiveList'),
          field: 'followedSince',
        },
        (data, offsetHours) => {
          const res = data.filter((item) => {
            const params = [{ referenceStartDay: period.startDate, referenceEndDay: period.endDate }, offsetHours];
            if (!item) return false;
            return (
              getIsDayWithinHoursOffsetOfPeriod(item.createdAt, ...params) ||
              getIsDayWithinHoursOffsetOfPeriod(item.updatedAt, ...params) ||
              item.actions?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.actions?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.comments?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.comments?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.passages?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.passages?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.rencontres?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.rencontres?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.relsPersonPlace?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.relsPersonPlace?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.treatments?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.treatments?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.consultations?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.consultations?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params))
            );
          });
          return res;
        }
      ),
    [filterByTeam, allPersons, period, selectedTeams, viewAllOrganisationData, filterPersons]
  );

  const personsForStats = useMemo(() => {
    const outOfActiveListFilter = filterPersons.find((f) => f.field === 'outOfActiveList')?.value;
    if (outOfActiveListFilter === 'Oui') return persons.filter((p) => p.outOfActiveList);
    if (outOfActiveListFilter === 'Non') return persons.filter((p) => !p.outOfActiveList);
    return persons;
  }, [filterPersons, persons]);

  const personsUpdatedForStats = useMemo(() => {
    const outOfActiveListFilter = filterPersons.find((f) => f.field === 'outOfActiveList')?.value;
    if (outOfActiveListFilter === 'Oui') return personsUpdated.filter((p) => p.outOfActiveList);
    if (outOfActiveListFilter === 'Non') return personsUpdated.filter((p) => !p.outOfActiveList);
    return personsUpdated;
  }, [filterPersons, personsUpdated]);

  const personsWithActions = useMemo(() => {
    const offsetHours = Boolean(viewAllOrganisationData) || selectedTeams.every((e) => !e.nightSession) ? 0 : 12;
    const params = [{ referenceStartDay: period.startDate, referenceEndDay: period.endDate }, offsetHours];
    return personsUpdatedForStats.filter((person) => {
      if (!person) return false;
      if (!period.startDate || !period.endDate) return !!person.actions?.length;
      const hasActions = person.actions?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params));
      return hasActions;
    });
  }, [period.endDate, period.startDate, personsUpdatedForStats, selectedTeams, viewAllOrganisationData]);

  const actions = useMemo(
    () =>
      getDataForPeriod(filterByTeam(allActions, 'team'), period, selectedTeams, viewAllOrganisationData, {
        field: 'completedAt',
        backupField: 'dueAt',
      }),
    [allActions, filterByTeam, period, selectedTeams, viewAllOrganisationData]
  );

  const actionsFilteredByStatus = useMemo(
    () => actions.filter((a) => !actionsStatuses.length || actionsStatuses.includes(a.status)),
    [actions, actionsStatuses]
  );
  const [actionsCategoriesGroups, setActionsCategoriesGroups] = useLocalStorage('stats-catGroups', []);
  const [actionsCategories, setActionsCategories] = useLocalStorage('stats-categories', []);

  const filterableActionsCategories = useMemo(() => {
    if (!actionsCategoriesGroups.length) return allCategories;
    return groupsCategories
      .filter((group) => actionsCategoriesGroups.includes(group.groupTitle))
      .reduce((filteredCats, group) => [...filteredCats, ...group.categories], []);
  }, [actionsCategoriesGroups, allCategories, groupsCategories]);

  const actionsWithDetailedGroupAndCategories = useMemo(
    () =>
      actionsFilteredByStatus
        .reduce((actionsDetailed, action) => {
          if (!!action.categories?.length) {
            for (const category of action.categories) {
              actionsDetailed.push({
                ...action,
                category,
                group: groupsCategories.find((g) => g.categories.includes(category))?.groupTitle ?? 'Autres',
              });
            }
          } else {
            actionsDetailed.push(action);
          }
          return actionsDetailed;
        }, [])
        .filter((a) => !actionsCategoriesGroups.length || actionsCategoriesGroups.includes(a.group))
        .filter((a) => !actionsCategories.length || actionsCategories.includes(a.category)),
    [actionsFilteredByStatus, groupsCategories, actionsCategoriesGroups, actionsCategories]
  );

  const numberOfActionsPerPerson = useMemo(() => {
    if (!personsUpdatedForStats.length) return 0;
    if (!actions.length) return 0;
    return Math.round((actions.length / personsUpdatedForStats.length) * 10) / 10;
  }, [actions.length, personsUpdatedForStats.length]);

  const numberOfActionsPerPersonConcernedByActions = useMemo(() => {
    if (!personsWithActions.length) return 0;
    if (!actions.length) return 0;
    return Math.round((actions.length / personsWithActions.length) * 10) / 10;
  }, [actions.length, personsWithActions.length]);

  const consultations = useMemo(() => getDataForPeriod(allConsultations, period, selectedTeams, true), [allConsultations, period, selectedTeams]);
  const observations = useMemo(
    () =>
      getDataForPeriod(
        filterByTeam(allObservations, 'team').filter((e) => !selectedTerritories.length || selectedTerritories.some((t) => e.territory === t._id)),
        period,
        selectedTeams,
        viewAllOrganisationData,
        { field: 'observedAt' }
      ),
    [allObservations, filterByTeam, period, selectedTeams, viewAllOrganisationData, selectedTerritories]
  );
  const passages = useMemo(
    () =>
      getDataForPeriod(
        filterByTeam(allPassages, 'team')
          .map((p) => ({ ...p, type: !!p.person ? 'Non-anonyme' : 'Anonyme' }))
          .map((passage) => ({
            ...passage,
            gender: !passage.person ? null : allPersons.find((person) => person._id === passage.person)?.gender || 'Non renseigné',
          })),
        period,
        selectedTeams,
        viewAllOrganisationData,
        { field: 'date' }
      ),
    [allPassages, filterByTeam, period, selectedTeams, viewAllOrganisationData, allPersons]
  );
  const personsInPassagesBeforePeriod = useMemo(() => {
    if (!period?.startDate) return [];
    const passagesIds = passages.map((p) => p._id);
    const passagesNotIncludedInPeriod = allPassages
      .filter((p) => !passagesIds.includes(p._id))
      .filter((p) => dayjsInstance(p.date).isBefore(period.startDate));
    return passagesNotIncludedInPeriod
      .reduce((personsIds, passage) => {
        if (!passage.person) return personsIds;
        if (personsIds.includes(passage.person)) return personsIds;
        return [...personsIds, passage.person];
      }, [])
      .map((personId) => allPersons.find((p) => p._id === personId) || { _id: personId, gender: 'Non précisé' });
  }, [allPassages, passages, period.startDate, allPersons]);
  const personsInPassagesOfPeriod = useMemo(
    () =>
      passages
        .reduce((personsIds, passage) => {
          if (!passage.person) return personsIds;
          if (personsIds.includes(passage.person)) return personsIds;
          return [...personsIds, passage.person];
        }, [])
        .map((personId) => allPersons.find((p) => p._id === personId) || { _id: personId, gender: 'Non précisé' }),
    [passages, allPersons]
  );

  const rencontres = useMemo(
    () =>
      getDataForPeriod(
        filterByTeam(allRencontres, 'team')
          .map((p) => ({ ...p, type: 'Rencontres' }))
          .map((rencontre) => ({
            ...rencontre,
            gender: !rencontre.person ? null : allPersons.find((person) => person._id === rencontre.person)?.gender || 'Non renseigné',
          })),
        period,
        selectedTeams,
        viewAllOrganisationData,
        { field: 'date' }
      ),
    [allRencontres, filterByTeam, period, selectedTeams, viewAllOrganisationData, allPersons]
  );

  const personsInRencontresBeforePeriod = useMemo(() => {
    if (!period?.startDate) return [];
    const rencontresIds = rencontres.map((p) => p._id);
    const rencontresNotIncludedInPeriod = allRencontres
      .filter((p) => !rencontresIds.includes(p._id))
      .filter((p) => dayjsInstance(p.date).isBefore(period.startDate));
    return rencontresNotIncludedInPeriod
      .reduce((personsIds, rencontre) => {
        if (!rencontre.person) return personsIds;
        if (personsIds.includes(rencontre.person)) return personsIds;
        return [...personsIds, rencontre.person];
      }, [])
      .map((personId) => allPersons.find((p) => p._id === personId) || { _id: personId, gender: 'Non précisé' });
  }, [allRencontres, rencontres, period.startDate, allPersons]);
  const personsInRencontresOfPeriod = useMemo(
    () =>
      rencontres
        .reduce((personsIds, rencontre) => {
          if (!rencontre.person) return personsIds;
          if (personsIds.includes(rencontre.person)) return personsIds;
          return [...personsIds, rencontre.person];
        }, [])
        .map((personId) => allPersons.find((p) => p._id === personId) || { _id: personId, gender: 'Non précisé' }),
    [rencontres, allPersons]
  );

  const reports = useMemo(
    () => getDataForPeriod(filterByTeam(allreports, 'team'), period, selectedTeams, viewAllOrganisationData, { field: 'date' }),
    [allreports, filterByTeam, period, selectedTeams, viewAllOrganisationData]
  );

  const reportsServices = useMemo(() => reports.map((rep) => (rep.services ? JSON.parse(rep.services) : null)).filter(Boolean), [reports]);

  const filterPersonsBase = useRecoilValue(filterPersonsBaseSelector);
  // Add enabled custom fields in filters.
  const filterPersonsWithAllFields = [
    ...filterPersonsBase.map((f) =>
      f.field !== 'outOfActiveList'
        ? f
        : {
            ...f,
            options: ['Oui', 'Non', "Oui et non (c'est-à-dire tout le monde)"],
            type: 'multi-choice',
          }
    ),
    ...customFieldsPersonsSocial.filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id)).map((a) => ({ field: a.name, ...a })),
    ...customFieldsPersonsMedical.filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id)).map((a) => ({ field: a.name, ...a })),
    ...customFieldsMedicalFile.filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id)).map((a) => ({ field: a.name, ...a })),
  ];

  if (isLoading) return <Loading />;

  return (
    <>
      <HeaderStyled style={{ padding: '16px 0' }}>
        <div style={{ display: 'flex', flexGrow: '1' }}>
          <HeaderTitle style={{ fontWeight: '400', width: '260px' }}>
            <span>Statistiques {viewAllOrganisationData ? <>globales</> : <>{selectedTeams.length > 1 ? 'des équipes' : "de l'équipe"}</>}</span>
          </HeaderTitle>
          <div className="tw-ml-4">
            <SelectTeamMultiple
              onChange={(teamsId) => {
                setSelectedTeams(teams.filter((t) => teamsId.includes(t._id)));
              }}
              value={selectedTeams.map((e) => e?._id)}
              colored
              isDisabled={viewAllOrganisationData}
            />
            {teams.length > 1 && (
              <label htmlFor="viewAllOrganisationData" className="tw-flex tw-items-center tw-text-sm">
                <input
                  id="viewAllOrganisationData"
                  type="checkbox"
                  className="tw-mr-2.5"
                  checked={viewAllOrganisationData}
                  value={viewAllOrganisationData}
                  onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
                />
                Statistiques de toute l'organisation
              </label>
            )}
          </div>
        </div>
      </HeaderStyled>
      <Row className="date-picker-container" style={{ marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Col md={4} style={{ flexShrink: 0, minWidth: '15rem', padding: 0 }}>
          <DateRangePickerWithPresets period={period} setPeriod={setPeriod} />
        </Col>
        {['admin'].includes(user.role) && (
          <Col md={8} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <RefreshButton />
            <ExportData />
          </Col>
        )}
      </Row>
      <Nav tabs style={{ marginBottom: 20 }}>
        {tabs
          .filter((e) => user.healthcareProfessional || e !== 'Consultations')
          .map((tabCaption, index) => {
            if (!organisation.receptionEnabled && index === 1) return null;
            return (
              <NavItem key={index} style={{ cursor: 'pointer' }}>
                <NavLink key={index} className={`${activeTab === index && 'active'}`} onClick={() => setActiveTab(index)}>
                  {tabCaption}
                </NavLink>
              </NavItem>
            );
          })}
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId={0}>
          <h3 className="tw-my-5 tw-text-xl">Statistiques générales</h3>
          <div className="-tw-mx-4 tw-flex tw-flex-wrap">
            <div className="tw-basis-1/6" />
            <Block data={personsForStats} title="Nombre de personnes créées" />
            <Block data={personsUpdatedForStats} title="Nombre de personnes suivies" />
          </div>
          <hr />
          <div className="-tw-mx-4 tw-flex tw-flex-wrap">
            <div className="tw-basis-1/6" />
            <BlockGroup groups={groupsForPersons(personsForStats)} title="Nombre de familles dans lesquelles se trouvent des personnes créées" />
            <BlockGroup
              groups={groupsForPersons(personsUpdatedForStats)}
              title="Nombre de familles dans lesquelles se trouvent des personnes suivies"
            />
          </div>
          <hr />
          <div className="-tw-mx-4 tw-flex tw-flex-wrap">
            <div className="tw-basis-1/6" />
            <Block data={passages.length} title="Nombre de passages" />
            <Block data={rencontres.length} title="Nombre de rencontres" />
          </div>
          <hr />
          <div className="-tw-mx-4 tw-flex tw-flex-wrap">
            <Block data={actions} title="Nombre d'actions" />
            <Block data={numberOfActionsPerPerson} title="Nombre d'actions par personne" />
            <Block data={numberOfActionsPerPersonConcernedByActions} title="Nombre d'actions par personne concernée par au moins une action" />
          </div>
        </TabPane>
        {!!organisation.receptionEnabled && (
          <TabPane tabId={1}>
            <h3 className="tw-my-5 tw-text-xl">Statistiques de l'accueil</h3>
            <Row>
              <Block data={passages.length} title="Nombre de passages" />
            </Row>
            <CustomResponsivePie
              title="Services"
              data={organisation.services?.map((service) => {
                return {
                  id: service,
                  label: service,
                  value: reportsServices.reduce((serviceNumber, rep) => (rep?.[service] || 0) + serviceNumber, 0),
                };
              })}
            />
          </TabPane>
        )}
        <TabPane tabId={2}>
          <h3 className="tw-my-5 tw-text-xl">Statistiques des actions</h3>
          <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <label htmlFor="filter-by-status" style={{ marginRight: 20, width: 250, flexShrink: 0 }}>
              Filtrer par statut :
            </label>
            <div style={{ width: 500 }}>
              <SelectCustom
                inputId="action-select-status-filter"
                options={mappedIdsToLabels}
                getOptionValue={(s) => s._id}
                getOptionLabel={(s) => s.name}
                name="action-status"
                onChange={(s) => setActionsStatuses(s.map((s) => s._id))}
                isClearable
                isMulti
                value={mappedIdsToLabels.filter((s) => actionsStatuses.includes(s._id))}
              />
            </div>
          </Col>
          <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <label htmlFor="filter-by-status" style={{ marginRight: 20, width: 250, flexShrink: 0 }}>
              Filtrer par groupe de catégories :
            </label>
            <div style={{ basis: 500, flexGrow: 1 }}>
              <SelectCustom
                value={actionsCategoriesGroups?.map((_option) => ({ value: _option, label: _option })) || []}
                options={groupsCategories.map((group) => group.groupTitle).map((_option) => ({ value: _option, label: _option }))}
                getOptionValue={(s) => s.value}
                getOptionLabel={(s) => s.label}
                onChange={(groups) => setActionsCategoriesGroups(groups.map((s) => s.value))}
                name="action-category-group"
                inputId="action-select-group-category-filter"
                isClearable
                isMulti
              />
            </div>
          </Col>
          <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <label htmlFor="filter-by-status" style={{ marginRight: 20, width: 250, flexShrink: 0 }}>
              Filtrer par catégorie:
            </label>
            <div style={{ basis: 500, flexGrow: 1 }}>
              <SelectCustom
                options={filterableActionsCategories.map((_option) => ({ value: _option, label: _option }))}
                value={actionsCategories?.map((_option) => ({ value: _option, label: _option })) || []}
                getOptionValue={(s) => s.value}
                getOptionLabel={(s) => s.label}
                onChange={(categories) => setActionsCategories(categories.map((s) => s.value))}
                inputId="action-select-category-filter"
                name="action-category"
                isClearable
                isMulti
              />
            </div>
          </Col>
          <CustomResponsivePie
            title="Répartition des actions par groupe"
            data={getPieData(actionsWithDetailedGroupAndCategories, 'group', { options: groupsCategories.map((group) => group.groupTitle) })}
          />
          <CustomResponsivePie
            title="Répartition des actions par catégorie"
            data={getPieData(actionsWithDetailedGroupAndCategories, 'category', { options: allCategories })}
          />
        </TabPane>
        <TabPane tabId={3}>
          <h3 className="tw-my-5 tw-text-xl">Statistiques des personnes suivies</h3>
          <Filters base={filterPersonsWithAllFields} filters={filterPersons} onChange={setFilterPersons} />
          <div className="-tw-mx-4 tw-flex tw-flex-wrap">
            <div className="tw-basis-1/6" />
            <Block data={personsForStats} title="Nombre de personnes créées" />
            <Block data={personsUpdatedForStats} title="Nombre de personnes suivies" />
            <div className="tw-basis-1/6" />
            <div className="tw-basis-1/6" />
            <BlockCreatedAt persons={personsForStats} />
            <BlockWanderingAt persons={personsForStats} />
            <div className="tw-basis-1/6" />
            <div className="tw-basis-1/6" />
            <BlockGroup groups={groupsForPersons(personsForStats)} title="Nombre de familles dans lesquelles se trouvent des personnes créées" />
            <BlockGroup
              groups={groupsForPersons(personsUpdatedForStats)}
              title="Nombre de familles dans lesquelles se trouvent des personnes suivies"
            />
          </div>
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Nationalité"
            field="nationalitySituation"
            data={getPieData(personsForStats, 'nationalitySituation', {
              options: personFields.find((f) => f.name === 'nationalitySituation').options,
            })}
          />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Genre"
            field="gender"
            data={getPieData(personsForStats, 'gender', { options: personFields.find((f) => f.name === 'gender').options })}
          />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Situation personnelle"
            field="personalSituation"
            data={getPieData(personsForStats, 'personalSituation', { options: personFields.find((f) => f.name === 'personalSituation').options })}
          />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Motif de la situation de rue"
            field="reasons"
            data={getPieData(personsForStats, 'reasons', { options: personFields.find((f) => f.name === 'reasons').options })}
          />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Ressources des personnes suivies"
            field="resources"
            data={getPieData(personsForStats, 'resources', { options: personFields.find((f) => f.name === 'resources').options })}
          />
          <AgeRangeBar persons={personsForStats} />
          <StatsCreatedAtRangeBar persons={personsForStats} />
          <StatsWanderingAtRangeBar persons={personsForStats} />
          <CustomResponsivePie onAddFilter={addFilter} title="Type d'hébergement" data={getAdressPieData(personsForStats)} />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Couverture médicale des personnes"
            field="healthInsurances"
            data={getPieData(personsForStats, 'healthInsurances', { options: personFields.find((f) => f.name === 'healthInsurances').options })}
          />
          <CustomResponsivePie onAddFilter={addFilter} title="Avec animaux" data={getPieData(personsForStats, 'hasAnimal')} />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Personnes très vulnérables"
            field="alertness"
            data={getPieData(personsForStats, 'alertness', { isBoolean: true })}
          />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Sortie de file active"
            field="outOfActiveList"
            data={getPieData(persons, 'outOfActiveList', { isBoolean: true })}
          />
          <CustomResponsivePie
            onAddFilter={addFilter}
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
          <CustomFieldsStats data={personsForStats} customFields={customFieldsMedicalFile} />
        </TabPane>
        <TabPane tabId={4}>
          <h3 className="tw-my-5 tw-text-xl">Statistiques des passages</h3>
          <CustomResponsivePie title="Nombre de passages" data={getPieData(passages, 'type', { options: ['Anonyme', 'Non-anonyme'] })} />
          <CustomResponsivePie
            title="Répartition des passages non-anonymes"
            data={getPieData(
              passages.filter((p) => !!p.gender),
              'gender',
              { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
            )}
          />
          <CustomResponsivePie
            title="Nombre de personnes différentes passées (passages anonymes exclus)"
            data={getPieData(personsInPassagesOfPeriod, 'gender', {
              options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'],
            })}
          />
          <CustomResponsivePie
            title="Nombre de nouvelles personnes passées (passages anonymes exclus)"
            data={getPieData(
              personsInPassagesOfPeriod.filter((personId) => !personsInPassagesBeforePeriod.includes(personId)),
              'gender',
              { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
            )}
          />
        </TabPane>
        <TabPane tabId={5}>
          <h3 className="tw-my-5 tw-text-xl">Statistiques des rencontres</h3>
          <CustomResponsivePie title="Nombre de rencontres" data={getPieData(rencontres, 'type', { options: ['Anonyme', 'Non-anonyme'] })} />
          <CustomResponsivePie
            title="Répartition des rencontres"
            data={getPieData(
              rencontres.filter((p) => !!p.gender),
              'gender',
              { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
            )}
          />
          <CustomResponsivePie
            title="Nombre de personnes différentes rencontrées"
            data={getPieData(personsInRencontresOfPeriod, 'gender', {
              options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'],
            })}
          />
          <CustomResponsivePie
            title="Nombre de nouvelles personnes rencontrées"
            data={getPieData(
              personsInRencontresOfPeriod.filter((personId) => !personsInRencontresBeforePeriod.includes(personId)),
              'gender',
              { options: [...personFields.find((f) => f.name === 'gender').options, 'Non précisé'] }
            )}
          />
        </TabPane>
        <TabPane tabId={6}>
          <h3 className="tw-my-5 tw-text-xl">Statistiques des observations de territoire</h3>
          <div style={{ marginBottom: '2rem' }}>
            <Label htmlFor="filter-territory">Filter par territoire</Label>
            <SelectCustom
              isMulti
              options={territories}
              name="place"
              placeholder="Tous les territoires"
              onChange={(t) => {
                setSelectedTerritories(t);
              }}
              isClearable={true}
              inputId="filter-territory"
              getOptionValue={(i) => i._id}
              getOptionLabel={(i) => i.name}
            />
          </div>
          <Row>
            <CustomFieldsStats
              data={observations}
              customFields={customFieldsObs}
              dataTestId="number-observations"
              additionalCols={[
                {
                  title: "Nombre d'observation de territoire",
                  value: observations.length,
                },
              ]}
            />
          </Row>
        </TabPane>
        <TabPane tabId={7}>
          <h3 className="tw-my-5 tw-text-xl">Statistiques des comptes-rendus</h3>
          <CustomResponsivePie
            title="Répartition des comptes-rendus par collaboration"
            data={getPieData(reports, 'collaborations', { options: organisation.collaborations || [] })}
          />
        </TabPane>
        {user.healthcareProfessional && (
          <TabPane tabId={8}>
            <h3 className="tw-my-5 tw-text-xl">Statistiques des consultations</h3>
            <Row style={{ marginBottom: '20px' }}>
              <Col md={4} />
              <Block data={consultations} title="Nombre de consultations" />
              <Col md={4} />
            </Row>
            <CustomResponsivePie title="Consultations par type" data={getPieData(consultations, 'type')} />
            <CustomResponsivePie title="Consultations par statut" data={getPieData(consultations, 'status')} />
            {organisation.consultations.map((c) => {
              return (
                <div key={c.name}>
                  <h4 style={{ color: '#444', fontSize: '20px', margin: '2rem 0' }}>Statistiques des consultations de type « {c.name} »</h4>
                  <CustomFieldsStats data={consultations.filter((d) => d.type === c.name)} customFields={c.fields} />
                </div>
              );
            })}
          </TabPane>
        )}
      </TabContent>
    </>
  );
};

const getPieData = (source, key, { options = null, isBoolean = false, debug = false } = {}) => {
  const data = source.reduce(
    (newData, item) => {
      if (isBoolean) {
        newData[Boolean(item[key]) ? 'Oui' : 'Non']++;
        return newData;
      }
      if (!item[key] || !item[key].length || item[key].includes('Choisissez') || item[key].includes('Choisir')) {
        newData['Non renseigné']++;
        return newData;
      }
      if (options && options.length) {
        let hasMatched = false;
        for (let option of [...options, 'Uniquement']) {
          if (typeof item[key] === 'string' ? item[key] === option : item[key].includes(option)) {
            if (!newData[option]) newData[option] = 0;
            newData[option]++;
            hasMatched = true;
          }
        }
        if (!hasMatched) {
          if (typeof item[key] === 'string') {
            const unregisteredOption = item[key];
            if (!newData[unregisteredOption]) newData[unregisteredOption] = 0;
            newData[unregisteredOption]++;
          }
        }
        return newData;
      }
      if (!newData[item[key]]) newData[item[key]] = 0;
      newData[item[key]]++;
      return newData;
    },
    { 'Non renseigné': 0, Oui: 0, Non: 0 }
  );
  return Object.keys(data)
    .map((key) => ({ id: key, label: key, value: data[key] }))
    .filter((d) => d.value > 0);
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

const AgeRangeBar = ({ persons }) => {
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

const initCategories = (categories) => {
  const objCategories = {};
  for (const cat of categories) {
    objCategories[cat] = 0;
  }
  return objCategories;
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

const Block = ({ data, title = 'Nombre de personnes suivies' }) => (
  <div className="tw-basis-1/3 tw-px-4 tw-py-2">
    <Card title={title} count={Array.isArray(data) ? String(data.length) : data} />
  </div>
);

const getDuration = (timestampFromNow) => {
  const inDays = Math.round(timestampFromNow / 1000 / 60 / 60 / 24);
  if (inDays < 90) return [inDays, 'jours'];
  const inMonths = inDays / (365 / 12);
  if (inMonths < 24) return [Math.round(inMonths), 'mois'];
  const inYears = inDays / 365.25;
  return [Math.round(inYears), 'années'];
};

const BlockDateWithTime = ({ data, field }) => {
  if (!data.filter((item) => Boolean(item[field.name])).length) return null;

  const averageField =
    data.filter((item) => Boolean(item[field.name])).reduce((total, item) => total + Date.parse(item[field.name]), 0) / (data.length || 1);

  const durationFromNowToAverage = Date.now() - averageField;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return <Card title={field.label + ' (moyenne)'} unit={unit} count={count} />;
};

const BlockCreatedAt = ({ persons }) => {
  if (persons.length === 0) {
    return (
      <div className="tw-basis-1/3 tw-px-4 tw-py-2">
        <Card title="Temps de suivi moyen" count={'-'} />
      </div>
    );
  }
  const averageFollowedSince =
    persons.reduce((total, person) => total + Date.parse(person.followedSince || person.createdAt), 0) / (persons.length || 1);
  const durationFromNowToAverage = Date.now() - averageFollowedSince;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return (
    <div className="tw-basis-1/3 tw-px-4 tw-py-2">
      <Card title="Temps de suivi moyen" unit={unit} count={count} />
    </div>
  );
};

const BlockWanderingAt = ({ persons }) => {
  persons = persons.filter((p) => Boolean(p.wanderingAt));
  if (!persons.length) {
    return (
      <div className="tw-basis-1/3 tw-px-4 tw-py-2">
        <Card title="Temps d'errance des personnes en&nbsp;moyenne" unit={'N/A'} count={0} />
      </div>
    );
  }
  const averageWanderingAt = persons.reduce((total, person) => total + Date.parse(person.wanderingAt), 0) / (persons.length || 1);
  const durationFromNowToAverage = Date.now() - averageWanderingAt;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return (
    <div className="tw-basis-1/3 tw-px-4 tw-py-2">
      <Card title="Temps d'errance des personnes en&nbsp;moyenne" unit={unit} count={count} />
    </div>
  );
};

const BlockTotal = ({ title, unit, data, field }) => {
  try {
    if (!data.length) {
      return <Card title={title} unit={unit} count={0} />;
    }
    const dataWithOnlyNumbers = data.filter((item) => Boolean(item[field])).filter((e) => !isNaN(Number(e[field])));
    const total = dataWithOnlyNumbers.reduce((total, item) => total + Number(item[field]), 0);
    const avg = Math.round((total / data.length) * 100) / 100;
    return (
      <Card
        title={title}
        unit={unit}
        count={total}
        children={
          <span className="font-weight-normal">
            Moyenne: <strong>{avg}</strong>
          </span>
        }
      />
    );
  } catch (errorBlockTotal) {
    capture('error block total', errorBlockTotal, { title, unit, data, field });
  }
  return null;
};

const BlockGroup = ({ title, groups }) => {
  try {
    if (!groups.length) {
      return <Card title={title} count={0} />;
    }

    const avg = groups.reduce((total, group) => total + group.relations.length, 0) / groups.length;
    return (
      <div className="tw-basis-1/3 tw-px-4 tw-py-2">
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

function CustomFieldsStats({ customFields, data, additionalCols = [], dataTestId = '' }) {
  const team = useRecoilValue(currentTeamState);
  function getColsSize(totalCols) {
    if (totalCols === 1) return 12;
    if (totalCols === 2) return 6;
    if (totalCols % 4 === 0) return 3;
    return 4;
  }

  const customFieldsInStats = customFields
    .filter((f) => f)
    .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
    .filter((f) => f.showInStats);

  const customFieldsNumber = customFieldsInStats.filter((field) => ['number'].includes(field.type));
  const customFieldsDate = customFieldsInStats.filter((field) => ['date', 'date-with-time'].includes(field.type));
  const customFieldsResponsivePie = customFieldsInStats.filter((field) => ['boolean', 'yes-no', 'enum', 'multi-choice'].includes(field.type));

  const totalCols = customFieldsNumber.length + customFieldsDate.length + additionalCols.length;

  const colSize = getColsSize(totalCols);

  return (
    <>
      {totalCols > 0 && (
        <Row>
          {additionalCols.map((col) => (
            <Col md={colSize} style={{ marginBottom: 20 }} key={col.title}>
              {/* TODO: fix alignment. */}
              <Card title={col.title} count={col.value} children={<div></div>} dataTestId={dataTestId} />
            </Col>
          ))}
          {customFieldsNumber.map((field) => (
            <Col md={colSize} style={{ marginBottom: '20px' }} key={field.name}>
              <BlockTotal title={field.label} data={data} field={field.name} />
            </Col>
          ))}
          {customFieldsDate.map((field) => (
            <Col md={colSize} style={{ marginBottom: '20px' }} key={field.name}>
              <BlockDateWithTime data={data} field={field} />
            </Col>
          ))}
        </Row>
      )}
      {customFieldsResponsivePie.map((field) => (
        <CustomResponsivePie
          title={field.label}
          key={field.name}
          data={getPieData(data, field.name, { options: field.options, isBoolean: field.type === 'boolean' })}
        />
      ))}
    </>
  );
}

export default Stats;
