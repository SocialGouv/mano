import React from 'react';
import 'react-datepicker/dist/react-datepicker.css';

const showBoolean = (value) => {
  if (value === null) return '';
  if (value === undefined) return '';
  if (!value) return 'Non';
  return 'Oui';
};

const CustomFieldDisplay = ({ field, value }) => {
  return (
    <>
      {!!['text', 'number'].includes(field.type) && value}
      {!!['textarea'].includes(field.type) && (
        <p style={{ paddingLeft: 30 }}>
          {value?.split?.('\n')?.map((sentence, index) => (
            <React.Fragment key={sentence + index}>
              {sentence}
              <br />
            </React.Fragment>
          ))}
        </p>
      )}
      {!!['date-with-time'].includes(field.type) &&
        !!value &&
        new Date(value).toLocaleDateString('fr', {
          day: 'numeric',
          weekday: 'long',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      {!!['date'].includes(field.type) &&
        !!value &&
        new Date(value).toLocaleDateString('fr', { day: 'numeric', weekday: 'long', month: 'long', year: 'numeric' })}
      {!!['boolean'].includes(field.type) && showBoolean(value)}
      {!!['yes-no'].includes(field.type) && value}
      {!!['enum'].includes(field.type) && value}
      {!!['multi-choice'].includes(field.type) && value?.join(', ')}
    </>
  );
};

export default CustomFieldDisplay;
