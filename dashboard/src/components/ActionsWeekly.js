import React, { useState } from 'react';
import { Button } from 'reactstrap';
import styled from 'styled-components';
import { dayjsInstance, isOnSameDay } from '../services/date';

export default function ActionsWeekly({ actions }) {
  const [startOfWeek, setStartOfWeek] = useState(dayjsInstance().startOf('week'));
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
              <div style={{ textAlign: 'center', marginTop: '5px' }}>
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
              <div>{(actions || []).filter((a) => isOnSameDay(a.dueAt, day)).length}</div>
            </div>
          );
        })}
      </WeekContainer>
    </div>
  );
}

const WeekContainer = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: 1fr;
  grid-column-gap: 7px;
  grid-row-gap: 0px;
`;
