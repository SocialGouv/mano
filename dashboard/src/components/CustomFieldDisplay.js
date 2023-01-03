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
      {!!['text', 'number'].includes(type) && <p>{value}</p>}
      {!!['textarea'].includes(type) && (
        <p className="tw-pl-8">
          {value?.split?.('\n')?.map((sentence, index) => (
            <React.Fragment key={sentence + index}>
              {sentence}
              <br />
            </React.Fragment>
          ))}
        </p>
      )}
      {!!['date-with-time'].includes(type) && !!value && <p>{formatDateTimeWithNameOfDay(value)}</p>}
      {!!['date'].includes(type) && !!value && <p>{formatDateWithNameOfDay(value)}</p>}
      {!!['boolean'].includes(type) && <p>{showBoolean(value)}</p>}
      {!!['yes-no'].includes(type) && <p>{value}</p>}
      {!!['enum'].includes(type) && <p>{value}</p>}
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
