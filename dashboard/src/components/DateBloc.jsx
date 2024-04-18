import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { formatTime } from "../services/date";

dayjs.extend(utc);
dayjs.locale("fr");

const DateBloc = ({ date }) => {
  if (!date) return <div />;
  date = dayjs(date);
  return (
    <div className="tw-m-0 tw-flex tw-flex-col tw-items-center tw-p-0">
      <div className="tw-block tw-w-20 tw-text-center tw-text-xs tw-capitalize">{date && date.format("dddd")}</div>
      <div className="tw-block tw-w-20 tw-text-center tw-text-xl tw-font-bold tw-capitalize tw-text-mano-sombre tw-leading-6">
        {date && date.format("D")}
      </div>
      <div className="tw-block tw-w-20 tw-text-center tw-text-xs tw-capitalize">
        {date && date.format("MMMM")}
        {date && date.format("YYYY") !== dayjs.utc().format("YYYY") && (
          <>
            <br />
            {date.format("YYYY")}
          </>
        )}
      </div>
    </div>
  );
};

export const TimeBlock = ({ time }) => {
  return <span className="tw-block tw-w-full tw-text-center tw-text-black50 tw-text-xs">{formatTime(time)}</span>;
};

export default DateBloc;
