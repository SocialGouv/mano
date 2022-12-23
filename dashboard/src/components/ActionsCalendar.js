import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { addOneDay, dayjsInstance, formatCalendarDate, formatDateTimeWithNameOfDay, formatTime, isOnSameDay, subtractOneDay } from '../services/date';
import Table from './table';
import ActionStatus from './ActionStatus';
import ActionOrConsultationName from './ActionOrConsultationName';
import PersonName from './PersonName';
import ConsultationButton from './ConsultationButton';
import { organisationState, userState } from '../recoil/auth';
import { disableConsultationRow } from '../recoil/consultations';
import ExclamationMarkButton from './tailwind/ExclamationMarkButton';
import { CANCEL, DONE, sortActionsOrConsultations } from '../recoil/actions';
import TagTeam from './TagTeam';
import { useLocalStorage } from 'react-use';

const ActionsCalendar = ({ actions, columns = ['Heure', 'Nom', 'Personne suivie', 'Créée le', 'Statut', 'Équipe en charge'] }) => {
  const history = useHistory();
  const location = useLocation();
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const [theDayBeforeActions, setTheDayBeforeActions] = useState([]);
  const [theDayAfterActions, setTheDayAfterActions] = useState([]);
  const [theCurrentDayActions, setTheCurrentDayActions] = useState([]);
  const [sortBy, setSortBy] = useLocalStorage('actions-consultations-sortBy', 'dueAt');
  const [sortOrder, setSortOrder] = useLocalStorage('actions-consultations-sortOrder', 'ASC');

  const [currentDate, setCurrentDate] = useState(() => {
    const savedDate = new URLSearchParams(location.search)?.get('calendarDate');
    if (savedDate) return new Date(savedDate);
    return new Date();
  });
  const [activeTab, setActiveTab] = useState(Number(new URLSearchParams(location.search)?.get('calendarTab') || 2));

  useEffect(() => {
    if (!currentDate) return;
    const filteredActions = actions.filter((a) => a.completedAt || a.dueAt);
    setTheDayBeforeActions(
      filteredActions
        .filter((a) => isOnSameDay([DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt, subtractOneDay(currentDate)))
        .sort(sortActionsOrConsultations(sortBy, sortOrder))
    );
    setTheDayAfterActions(
      filteredActions
        .filter((a) => isOnSameDay([DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt, addOneDay(currentDate)))
        .sort(sortActionsOrConsultations(sortBy, sortOrder))
    );
    setTheCurrentDayActions(
      filteredActions
        .filter((a) => isOnSameDay([DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt, currentDate))
        .sort(sortActionsOrConsultations(sortBy, sortOrder))
    );
  }, [actions, currentDate, sortBy, sortOrder]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('calendarDate', dayjsInstance(currentDate).format('YYYY-MM-DD'));
    history.replace({ pathname: location.pathname, search: searchParams.toString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('calendarTab', activeTab);
    history.replace({ pathname: location.pathname, search: searchParams.toString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const renderActionsTable = (actions, date) => (
    <Table
      className="Table"
      noData={`Pas d'action à faire le ${formatDateTimeWithNameOfDay(date)}`}
      data={actions.map((a) => {
        if (a.urgent) return { ...a, style: { backgroundColor: '#fecaca99' } };
        if (a.isConsultation) return { ...a, style: { backgroundColor: '#DDF4FF99' } };
        return a;
      })}
      onRowClick={(actionOrConsultation) => {
        if (actionOrConsultation.isConsultation) {
          history.push(`/person/${actionOrConsultation.person}?tab=Dossier+Médical&consultationId=${actionOrConsultation._id}`);
        } else {
          history.push(`/action/${actionOrConsultation._id}`);
        }
      }}
      rowDisabled={(actionOrConsultation) => ['restricted-access'].includes(user.role) || disableConsultationRow(actionOrConsultation, user)}
      rowKey="_id"
      dataTestId="name"
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
          title: 'Heure',
          dataKey: 'dueAt',
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortBy,
          sortOrder,
          small: true,
          render: (action) => {
            if (!action.dueAt || !action.withTime) return null;
            return formatTime(action.dueAt);
          },
        },
        {
          title: ['restricted-access'].includes(user.role) ? null : 'Nom',
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
          title: 'Équipe en charge',
          dataKey: 'team',
          render: (a) => (
            <div className="px-2 tw-flex-shrink-0">
              {Array.isArray(a?.teams) ? a.teams.map((e) => <TagTeam key={e} teamId={e} />) : <TagTeam teamId={a?.team} />}
            </div>
          ),
        },
      ].filter((column) => columns.includes(column.title) || column.dataKey === 'urgentOrGroupOrConsultation')}
    />
  );

  const renderDate = (date) => {
    return formatCalendarDate(date);
  };

  return (
    <>
      <Nav fill tabs style={{ marginBottom: 20 }}>
        {['<', subtractOneDay(currentDate), currentDate, addOneDay(currentDate), '>'].map((tabCaption, index) => (
          <NavItem key={index} style={{ cursor: 'pointer' }}>
            <NavLink
              key={index}
              className={`${activeTab === index && 'active'}`}
              onClick={() => {
                if (index === 0) return setCurrentDate(subtractOneDay(currentDate));
                if (index === 4) return setCurrentDate(addOneDay(currentDate));
                setActiveTab(index);
              }}>
              {['<', '>'].includes(tabCaption)
                ? tabCaption
                : `${renderDate(tabCaption)} (${[theDayBeforeActions.length, theCurrentDayActions.length, theDayAfterActions.length][index - 1]})`}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId={1}>{renderActionsTable(theDayBeforeActions, subtractOneDay(currentDate))}</TabPane>
        <TabPane tabId={2}>{renderActionsTable(theCurrentDayActions, currentDate)}</TabPane>
        <TabPane tabId={3}>{renderActionsTable(theDayAfterActions, addOneDay(currentDate))}</TabPane>
      </TabContent>
    </>
  );
};

export default ActionsCalendar;
