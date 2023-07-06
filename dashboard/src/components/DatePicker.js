import { dateForInputDate, dateFromInputDate, LEFT_BOUNDARY_DATE, RIGHT_BOUNDARY_DATE } from '../services/date';

/**
 * @typedef {Object} DatePickerProps
 * @property {function} onChange
 * @property {string} defaultValue
 * @property {string} id
 * @property {boolean} withTime
 * @property {string} name
 */
/**
 * @param {DatePickerProps} props
 * @returns {JSX.Element}
 */
export default function DatePicker({ onChange, defaultValue, id, withTime = false, name = null }) {
  return (
    <input
      id={id}
      name={name || id}
      key={withTime}
      className="form-control"
      type={withTime ? 'datetime-local' : 'date'}
      defaultValue={dateForInputDate(defaultValue, withTime)}
      onChange={(e) => {
        console.log('CHANGING', e.target.name, e.target.value, dateFromInputDate(e.target.value));
        onChange({ target: { name: e.target.name, value: dateFromInputDate(e.target.value) } });
      }}
      min={dateForInputDate(LEFT_BOUNDARY_DATE, withTime)}
      max={dateForInputDate(RIGHT_BOUNDARY_DATE, withTime)}
    />
  );
}
