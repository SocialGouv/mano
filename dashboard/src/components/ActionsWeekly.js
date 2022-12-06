import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useLocalStorage } from 'react-use';
import { Button } from 'reactstrap';
import styled from 'styled-components';
import { CANCEL, DONE } from '../recoil/actions';
import { dayjsInstance, formatTime, isOnSameDay } from '../services/date';
import ActionOrConsultationName from './ActionOrConsultationName';
import ActionStatus from './ActionStatus';
import ExclamationMarkButton from './ExclamationMarkButton';
import PersonName from './PersonName';

// TODO: remove inline style when UI is stabilized.

export default function ActionsWeekly({ actions, onCreateAction }) {
  const [startOfWeek, setStartOfWeek] = useLocalStorage('startOfWeek', dayjsInstance().startOf('week'), {
    raw: false,
    deserializer: (v) => dayjsInstance(v),
    serializer: (v) => v.toISOString(),
  });

  const actionsInWeek = useMemo(() => {
    return actions.filter((action) =>
      dayjsInstance([DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt).isBetween(
        startOfWeek,
        startOfWeek.add(7, 'day').endOf('day')
      )
    );
  }, [actions, startOfWeek]);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', marginBottom: '1rem', alignItems: 'center' }}>
        <Button color="secondary" outline={true} onClick={() => setStartOfWeek(dayjsInstance().startOf('week'))}>
          Aujourd'hui
        </Button>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.2rem' }}>
          <Button size="sm" color="secondary" outline={true} onClick={() => setStartOfWeek(startOfWeek.subtract(1, 'week').startOf('week'))}>
            &lt;
          </Button>
          <Button size="sm" color="secondary" outline={true} onClick={() => setStartOfWeek(startOfWeek.add(1, 'week').startOf('week'))}>
            &gt;
          </Button>
        </div>
        <div style={{ textTransform: 'capitalize' }}>{startOfWeek.format('MMMM YYYY')}</div>
      </div>
      <WeekContainer>
        {[...Array(7)].map((_, index) => {
          const day = startOfWeek.add(index, 'day');
          const isToday = day.isSame(dayjsInstance(), 'day');
          return (
            <div key={day.format('YYYY-MM-DD')}>
              <div style={{ textAlign: 'center', marginTop: '5px', marginBottom: '5px' }}>
                <div style={{ fontSize: '11px', ...(isToday ? { color: '#1a73e8' } : {}) }}>{day.format('ddd')}</div>
                <div
                  style={{
                    fontSize: '20px',
                    marginTop: '5px',
                    ...(isToday
                      ? {
                          backgroundColor: '#1a73e8',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          margin: '2px auto auto',
                          color: 'white',
                          lineHeight: '36px',
                        }
                      : {}),
                  }}>
                  {day.format('D')}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <ActionsOfDay
                  actions={actionsInWeek.filter((action) =>
                    isOnSameDay([DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt, day)
                  )}
                />
                <ButtonAddAction onClick={() => onCreateAction(day.toDate())}>+ ajouter une action</ButtonAddAction>
              </div>
            </div>
          );
        })}
      </WeekContainer>
    </div>
  );
}

function ActionsOfDay({ actions }) {
  const history = useHistory();

  const sortedActions = [
    // Urgent actions first
    ...actions.filter((action) => action.urgent),
    // Then actions with time ordered by dueAt
    ...actions
      .filter((action) => !action.urgent)
      .filter((action) => Boolean(action.withTime))
      .sort((a, b) => dayjsInstance(a.completedAt || a.dueAt).diff(dayjsInstance(b.completedAt || b.dueAt))),
    // Then actions without time.
    ...actions.filter((action) => !action.urgent).filter((action) => !action.withTime),
  ];

  return (
    <>
      {sortedActions.map((action) => (
        <div
          key={action._id}
          onClick={() => {
            if (action.isConsultation) {
              history.push(`/person/${action.person}?tab=Dossier+Médical&consultationId=${action._id}`);
            } else {
              history.push(`/action/${action._id}`);
            }
          }}
          style={{
            border: '1px solid #ccc',
            backgroundColor: Boolean(action.isConsultation) ? '#DDF4FF' : Boolean(action.urgent) ? '#fecaca' : '#fafafa',
            borderRadius: '3px',
            padding: '3px',
            fontSize: '12px',
            gap: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
          }}>
          {(Boolean(action.isConsultation) || Boolean(action.urgent)) && (
            <div>
              {Boolean(action.urgent) && (
                <div style={{ display: 'flex', flexDirection: 'row', fontWeight: 'bold', color: '#dc2626', alignItems: 'center', gap: '10px' }}>
                  <ExclamationMarkButton />
                  Urgent
                </div>
              )}
              {Boolean(action.isConsultation) && (
                <div style={{ display: 'flex', flexDirection: 'row', fontWeight: 'bold', color: '#43738b' }}>
                  <i>🩺 Consultation</i>
                </div>
              )}
            </div>
          )}
          <div>
            <ActionOrConsultationName item={action} />
          </div>
          {Boolean(action.withTime) && <div>🕑 {formatTime(action.dueAt)}</div>}
          <div>
            🧑 <PersonName item={action} />
          </div>
          <ActionStatus status={action.status} />
        </div>
      ))}
    </>
  );
}

const ButtonAddAction = styled.button`
  all: unset;
  margin: 0 auto;
  cursor: pointer;
  color: #aaa;
  font-size: 11px;
  &:hover {
    color: #888;
    text-decoration: underline;
  }
`;

const WeekContainer = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: 1fr;
  grid-column-gap: 7px;
  grid-row-gap: 0px;
`;
