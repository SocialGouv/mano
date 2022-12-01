import React, { useEffect, useState } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { addOneDay, dayjsInstance, formatCalendarDate, formatDateTimeWithNameOfDay, formatTime, isOnSameDay, subtractOneDay } from '../services/date';
import Table from './table';
import ActionStatus from './ActionStatus';
import ActionOrConsultationName from './ActionOrConsultationName';
import PersonName from './PersonName';
import ExclamationMarkButton from './ExclamationMarkButton';
import ConsultationButton from './ConsultationButton';
import { userState } from '../recoil/auth';
import { disableConsultationRow } from '../recoil/consultations';
import { CANCEL, DONE } from '../recoil/actions';

const ActionsCalendar = ({ actions, columns = ['Heure', 'Nom', 'Personne suivie', 'Créée le', 'Statut'] }) => {
  const history = useHistory();
  const location = useLocation();
  const user = useRecoilValue(userState);
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
    if (!currentDate) return;
    const filteredActions = actions.filter((a) => a.completedAt || a.dueAt);
    setTheDayBeforeActions(
      filteredActions.filter((a) => isOnSameDay([DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt, subtractOneDay(currentDate)))
    );
    setTheDayAfterActions(
      filteredActions.filter((a) => isOnSameDay([DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt, addOneDay(currentDate)))
    );
    setTheCurrentDayActions(filteredActions.filter((a) => isOnSameDay([DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt, currentDate)));
  }, [actions, currentDate]);

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
        if (a.urgent) return { ...a, style: { backgroundColor: '#fecaca' } };
        if (a.isConsultation) return { ...a, style: { backgroundColor: '#DDF4FF' } };
        return a;
      })}
      onRowClick={(actionOrConsultation) => {
        if (actionOrConsultation.isConsultation) {
          history.push(`/person/${actionOrConsultation.person}?tab=dossier+médical&consultationId=${actionOrConsultation._id}`);
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
          dataKey: 'urgent',
          small: true,
          render: (actionOrConsult) => {
            if (actionOrConsult.urgent) return <ExclamationMarkButton />;
            if (actionOrConsult.isConsultation) return <ConsultationButton />;
            return null;
          },
        },
        {
          title: 'Heure',
          dataKey: 'dueAt',
          small: true,
          render: (action) => {
            if (!action.dueAt || !action.withTime) return null;
            return formatTime(action.dueAt);
          },
        },
        {
          title: ['restricted-access'].includes(user.role) ? null : 'Nom',
          dataKey: 'name',
          render: (action) => <ActionOrConsultationName item={action} />,
        },
        {
          title: 'Personne suivie',
          dataKey: 'person',
          render: (action) => <PersonName item={action} />,
        },
        { title: 'Statut', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
      ].filter((column) => columns.includes(column.title) || column.dataKey === 'urgent')}
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
