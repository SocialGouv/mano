import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { addOneDay, dayjsInstance, formatCalendarDate, formatDateTimeWithNameOfDay, formatTime, subtractOneDay } from '../services/date';
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
import { useLocalStorage } from '../services/useLocalStorage';

const ActionsCalendar = ({ actions, isNightSession, columns = ['Heure', 'Nom', 'Personne suivie', 'Créée le', 'Statut', 'Équipe(s) en charge'] }) => {
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

    const offsetHours = isNightSession ? 12 : 0;
    const isoStartYesterday = dayjsInstance(currentDate).startOf('day').add(-1, 'day').add(offsetHours, 'hour').toISOString();
    const isoStartToday = dayjsInstance(currentDate).startOf('day').add(offsetHours, 'hour').toISOString();
    const isoStartTomorrow = dayjsInstance(currentDate).startOf('day').add(1, 'day').add(offsetHours, 'hour').toISOString();
    const isoEndTomorrow = dayjsInstance(currentDate).startOf('day').add(2, 'day').add(offsetHours, 'hour').toISOString();

    setTheDayBeforeActions(
      filteredActions
        .filter((a) => {
          const date = [DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt;
          return date >= isoStartYesterday && date < isoStartToday;
        })
        .sort(sortActionsOrConsultations(sortBy, sortOrder))
    );
    setTheDayAfterActions(
      filteredActions
        .filter((a) => {
          const date = [DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt;
          return date >= isoStartTomorrow && date < isoEndTomorrow;
        })
        .sort(sortActionsOrConsultations(sortBy, sortOrder))
    );
    setTheCurrentDayActions(
      filteredActions
        .filter((a) => {
          const date = [DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt;
          return date >= isoStartToday && date < isoStartTomorrow;
        })
        .sort(sortActionsOrConsultations(sortBy, sortOrder))
    );
  }, [actions, currentDate, sortBy, sortOrder, isNightSession]);

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
      rowDisabled={(actionOrConsultation) => disableConsultationRow(actionOrConsultation, user)}
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
          title: 'Nom',
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortBy,
          sortOrder,
          dataKey: 'name',
          render: (action) => {
            return (
              <div className="[overflow-wrap:anywhere]">
                <ActionOrConsultationName item={action} />
              </div>
            );
          },
        },
        {
          title: 'Personne suivie',
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortBy,
          sortOrder,
          dataKey: 'person',
          render: (action) => {
            return (
              <div className="[overflow-wrap:anywhere]">
                <PersonName item={action} />
              </div>
            );
          },
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
            <div className="px-2 tw-flex tw-flex-shrink-0 tw-flex-col tw-gap-px">
              {Array.isArray(a?.teams) ? a.teams.map((e) => <TagTeam key={e} teamId={e} />) : <TagTeam teamId={a?.team} />}
            </div>
          ),
        },
      ].filter((column) => columns.includes(column.title) || column.dataKey === 'urgentOrGroupOrConsultation')}
    />
  );

  const renderDate = (date) => {
    const dateString = formatCalendarDate(date);
    if (!isNightSession) return dateString;
    switch (dateString) {
      case "Aujourd'hui":
        return 'Ce soir';
      case 'Demain':
        return 'Demain soir';
      case 'Hier':
        return 'Hier soir';
      default:
        return `Nuit du ${dateString}`;
    }
  };

  return (
    <>
      <Nav fill tabs>
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
      <div className="tw-mb-5">
        {!!isNightSession && (
          <p className="tw-m-0 tw-text-center tw-text-xs tw-opacity-50">
            On affiche les actions faites/à faire entre midi de ce jour et 11h59 du jour suivant
          </p>
        )}
      </div>
      <TabContent activeTab={activeTab}>
        <TabPane tabId={1}>{renderActionsTable(theDayBeforeActions, subtractOneDay(currentDate))}</TabPane>
        <TabPane tabId={2}>{renderActionsTable(theCurrentDayActions, currentDate)}</TabPane>
        <TabPane tabId={3}>{renderActionsTable(theDayAfterActions, addOneDay(currentDate))}</TabPane>
      </TabContent>
    </>
  );
};

export default ActionsCalendar;
