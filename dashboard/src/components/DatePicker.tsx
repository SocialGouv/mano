import { dateForInputDate, dateFromInputDate, LEFT_BOUNDARY_DATE, RIGHT_BOUNDARY_DATE } from "../services/date";

interface DatePickerProps {
  onChange: (e: { target: { name: string; value: Date | null } }) => void;
  defaultValue: Date | null;
  id: string;
  withTime?: boolean;
  name?: string;
}

export default function DatePicker({ onChange, defaultValue, id, withTime = false, name = "" }: DatePickerProps): JSX.Element {
  return (
    <input
      id={id}
      name={name || id}
      key={`${withTime}`}
      className="form-control"
      type={withTime ? "datetime-local" : "date"}
      defaultValue={dateForInputDate(defaultValue, withTime)}
      onChange={(e) => {
        onChange({ target: { name: e.target.name, value: dateFromInputDate(e.target.value) } });
      }}
      min={dateForInputDate(LEFT_BOUNDARY_DATE, withTime)}
      max={dateForInputDate(RIGHT_BOUNDARY_DATE, withTime)}
    />
  );
}
