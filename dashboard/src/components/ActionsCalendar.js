/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import {
  addOneDay,
  dayjsInstance,
  formatCalendarDate,
  formatDateTimeWithNameOfDay,
  formatDateWithFullMonth,
  formatTime,
  isOnSameDay,
  subtractOneDay,
} from '../services/date';
import Table from './table';
import ActionStatus from './ActionStatus';
import ActionName from './ActionName';
import ActionPersonName from './ActionPersonName';

const ActionsCalendar = ({ actions, columns = ['Heure', 'Nom', 'Personne suivie', 'Créée le', 'Status'] }) => {
  const history = useHistory();
  const location = useLocation();
  const [theDayBeforeActions, setTheDayBeforeActions] = useState([]);
  const [theDayAfterActions, setTheDayAfterActions] = useState([]);
  const [theCurrentDayActions, setTheCurrentDayActions] = useState([]);

  const [currentDate, setCurrentDate] = useState(() => {
    const savedDate = new URLSearchParams(location.search)?.get('calendarDate');
    if (savedDate) return new Date(savedDate);
    return new Date();
  });
  const [activeTab, setActiveTab] = useState(Number(new URLSearchParams(location.search)?.get('calendarTab') || 2));

  useEffect(() => {
    if (!currentDate || !actions?.length) return;
    const filteredActions = actions.filter((a) => a.dueAt);
    setTheDayBeforeActions(filteredActions.filter((a) => isOnSameDay(a.dueAt, subtractOneDay(currentDate))));
    setTheDayAfterActions(filteredActions.filter((a) => isOnSameDay(a.dueAt, addOneDay(currentDate))));
    setTheCurrentDayActions(filteredActions.filter((a) => isOnSameDay(a.dueAt, currentDate)));
  }, [actions, currentDate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('calendarDate', dayjsInstance(currentDate).format('YYYY-MM-DD'));
    history.replace({ pathname: location.pathname, search: searchParams.toString() });
  }, [currentDate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('calendarTab', activeTab);
    history.replace({ pathname: location.pathname, search: searchParams.toString() });
  }, [activeTab]);

  const renderActionsTable = (actions, date) => (
    <Table
      className="Table"
      noData={`Pas d'action à faire le ${formatDateTimeWithNameOfDay(date)}`}
      data={actions}
      onRowClick={(action) => history.push(`/action/${action._id}`)}
      rowKey="_id"
      columns={[
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
          render: (action) => <ActionPersonName action={action} />,
        },
        { title: 'Créée le', dataKey: 'createdAt', render: (action) => formatDateWithFullMonth(action.createdAt || '') },
        { title: 'Status', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
      ].filter((column) => columns.includes(column.title))}
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
