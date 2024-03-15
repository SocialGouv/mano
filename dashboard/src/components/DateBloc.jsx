import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/fr';

dayjs.extend(utc);
dayjs.locale('fr');

const DateBloc = ({ date }) => {
  if (!date) return <div />;
  date = dayjs(date);
  return (
    <div className="tw-m-0 tw-flex tw-flex-col tw-items-center tw-p-0">
      <span className="tw-block tw-w-20 tw-text-center tw-text-xs tw-capitalize">{date && date.format('dddd')}</span>
      <span className="tw-block tw-w-20 tw-text-center tw-text-2xl tw-font-bold tw-capitalize">{date && date.format('D')}</span>
      <span className="tw-block tw-w-20 tw-text-center tw-text-xs tw-capitalize">
        {date && date.format('MMMM')}
        {date && date.format('YYYY') !== dayjs.utc().format('YYYY') && (
          <>
            <br />
            {date.format('YYYY')}
          </>
        )}
      </span>
    </div>
  );
};
export default DateBloc;
