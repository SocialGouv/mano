import React, { useMemo } from 'react';
import { reportsState } from '../../../recoil/reports';
import { useRecoilValue } from 'recoil';
import dayjs from 'dayjs';

export default function Transmissions({ period, selectedTeamsObject, reports }) {
  const days = useMemo(() => {
    const days = [];
    const endDate = dayjs(period.endDate).startOf('day').add(1, 'day').toISOString();
    let i = 0;
    while (true) {
      const day = dayjs(period.startDate).add(i, 'day').format('YYYY-MM-DD');
      if (day < endDate) {
        days.push(day);
        i++;
      } else {
        break;
      }
    }
    return days;
  }, [period]);

  console.log('days', days);

  return (
    <div>
      <h3 className="tw-w-full tw-px-3 tw-py-2 tw-text-center tw-text-2xl tw-font-medium tw-text-black">
        👋&nbsp;Comment s'est passée la&nbsp;journée&nbsp;?
      </h3>
      {days.map((day) => {
        return (
          <details open>
            {days.length > 1 && <h4>{dayjs(day).format('dddd DD/MM')}</h4>}
            {Object.keys(selectedTeamsObject).map((teamId) => {
              const report = reports.find((report) => report.team === teamId && report.date === day);

              return (
                <>
                  {!report?.description ? (
                    <button className="tw-border-main tw-px-3 tw-py-1">Ajouter une transmission</button>
                  ) : (
                    <p>
                      {report?.description?.split('\n').map((sentence, index) => (
                        <React.Fragment key={index}>
                          {sentence}
                          <br />
                        </React.Fragment>
                      ))}
                    </p>
                  )}
                </>
              );
            })}
          </details>
        );
      })}
    </div>
  );
}
