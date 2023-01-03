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
      {!!['text', 'number'].includes(type) && value}
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
      {!!['date-with-time'].includes(type) && !!value && formatDateTimeWithNameOfDay(value)}
      {!!['date'].includes(type) && !!value && formatDateWithNameOfDay(value)}
      {!!['boolean'].includes(type) && showBoolean(value)}
      {!!['yes-no'].includes(type) && value}
      {!!['enum'].includes(type) && value}
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
