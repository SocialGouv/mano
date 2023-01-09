import React from 'react';
import { formatDateTimeWithNameOfDay, formatDateWithNameOfDay } from '../services/date';

const showBoolean = (value) => {
  if (value === null) return '';
  if (value === undefined) return '';
  if (!value) return 'Non';
  return 'Oui';
};

const CustomFieldDisplay = ({ type, value }) => {
  return (
    <>
      {!!['text', 'number'].includes(type) && <span>{value}</span>}
      {!!['textarea'].includes(type) && (
        <p className="tw-mb-0">
          {value?.split?.('\n')?.map((sentence, index) => (
            <React.Fragment key={sentence + index}>
              {sentence}
              <br />
            </React.Fragment>
          ))}
        </p>
      )}
      {!!['date-with-time'].includes(type) && !!value && <span>{formatDateTimeWithNameOfDay(value)}</span>}
      {!!['date'].includes(type) && !!value && <span>{formatDateWithNameOfDay(value)}</span>}
      {!!['boolean'].includes(type) && <span>{showBoolean(value)}</span>}
      {!!['yes-no'].includes(type) && <span>{value}</span>}
      {!!['enum'].includes(type) && <span>{value}</span>}
      {!!['multi-choice'].includes(type) &&
        (Array.isArray(value) ? (
          <ul className="tw-list-disc tw-pl-4">
            {value.map((v) => (
              <li key={v}>
                <span className="tw-overflow-ellipsis tw-break-words">{v || '-'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tw-overflow-ellipsis tw-break-words">{String(value || '-')}</p>
        ))}
    </>
  );
};

export default CustomFieldDisplay;
