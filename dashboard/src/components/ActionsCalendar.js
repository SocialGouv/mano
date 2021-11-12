/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';

import { isOnSameDay, theDayAfter, theDayBefore, today } from '../services/date';
import Table from './table';
import { toFrenchDate } from '../utils';
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
    const theDayBeforeComputed = theDayBefore(currentDate).toISOString().slice(0, 10);
    const theDayAfterComputed = theDayAfter(currentDate).toISOString().slice(0, 10);
    const theCurrentDayComputed = currentDate.toISOString().slice(0, 10);
    setTheDayBeforeActions(actions.filter((a) => a.dueAt?.slice(0, 10) === theDayBeforeComputed));
    setTheDayAfterActions(actions.filter((a) => a.dueAt?.slice(0, 10) === theDayAfterComputed));
    setTheCurrentDayActions(actions.filter((a) => a.dueAt?.slice(0, 10) === theCurrentDayComputed));
  }, [actions, currentDate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('calendarDate', currentDate.toISOString().split('T')[0]);
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
      noData={`Pas d'action à faire le ${new Date(date).toLocaleDateString('fr', {
        day: 'numeric',
        weekday: 'long',
        month: 'long',
        year: 'numeric',
      })}`}
      data={actions}
      onRowClick={(action) => history.push(`/action/${action._id}`)}
      rowKey="_id"
      columns={[
        {
          title: 'Heure',
          dataKey: '_id',
          render: (action) => {
            if (!action.dueAt || !action.withTime) return null;
            return new Date(action.dueAt).toLocaleString('fr', {
              hour: '2-digit',
              minute: '2-digit',
            });
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
        { title: 'Créée le', dataKey: 'createdAt', render: (action) => toFrenchDate(action.createdAt || '') },
        { title: 'Status', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
      ].filter((column) => columns.includes(column.title))}
    />
  );

  const renderDate = (date) => {
    if (isOnSameDay(date, today())) return "Aujourd'hui";
    if (isOnSameDay(date, theDayBefore(today()))) return 'Hier';
    if (isOnSameDay(date, theDayAfter(today()))) return 'Demain';
    return new Date(date).toLocaleDateString('fr', { day: 'numeric', weekday: 'short', month: 'short' });
  };

  return (
    <>
      <Nav fill tabs style={{ marginBottom: 20 }}>
        {['<', theDayBefore(currentDate), currentDate, theDayAfter(currentDate), '>'].map((tabCaption, index) => (
          <NavItem key={index} style={{ cursor: 'pointer' }}>
            <NavLink
              key={index}
              className={`${activeTab === index && 'active'}`}
              onClick={() => {
                if (index === 0) return setCurrentDate(theDayBefore(currentDate));
                if (index === 4) return setCurrentDate(theDayAfter(currentDate));
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
        <TabPane tabId={1}>{renderActionsTable(theDayBeforeActions, theDayBefore(currentDate))}</TabPane>
        <TabPane tabId={2}>{renderActionsTable(theCurrentDayActions, currentDate)}</TabPane>
        <TabPane tabId={3}>{renderActionsTable(theDayAfterActions, theDayAfter(currentDate))}</TabPane>
      </TabContent>
    </>
  );
};

export default ActionsCalendar;
