import { dateForInputDate, LEFT_BOUNDARY_DATE, RIGHT_BOUNDARY_DATE } from '../services/date';

/**
 * @typedef {Object} DatePickerProps
 * @property {function} onChange
 * @property {string} defaultValue
 * @property {string} id
 * @property {boolean} withTime
 */
/**
 * @param {DatePickerProps} props
 * @returns {JSX.Element}
 */
export default function DatePicker({ onChange, defaultValue, id, withTime = false }) {
  return (
    <input
      id={id}
      key={withTime}
      className="form-control"
      type={withTime ? 'datetime-local' : 'date'}
      defaultValue={dateForInputDate(defaultValue, withTime)}
      onChange={onChange}
      min={dateForInputDate(LEFT_BOUNDARY_DATE, withTime)}
      max={dateForInputDate(RIGHT_BOUNDARY_DATE, withTime)}
    />
  );
}
