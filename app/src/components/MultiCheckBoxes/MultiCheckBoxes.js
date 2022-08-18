import React from 'react';
import styled from 'styled-components';
import CheckboxLabelled from '../CheckboxLabelled';
import InputLabelled from '../InputLabelled';
import Label from '../Label';

const MultiCheckBoxes = ({ label, source, values, onChange, editable, emptyValue }) => {
  if (!Array.isArray(values)) values = [];
  if (!editable) {
    return <InputLabelled label={label} value={values.length ? values.join(', ') : emptyValue} editable={false} />;
  }

  const onCheck = ({ _id: newValue }) => {
    const newValues = values.includes(newValue) ? values.filter((v) => v !== newValue) : [...values, newValue];
    onChange(newValues);
  };

  return (
    <Container>
      {label && <Label label={label} />}
      <RowsContainer>
        {source.map((value) => (
          <CheckBoxContainer key={value}>
            <CheckboxLabelled onPress={onCheck} label={value} value={values.includes(value)} _id={value} />
          </CheckBoxContainer>
        ))}
      </RowsContainer>
    </Container>
  );
};

const Container = styled.TouchableOpacity`
  margin-bottom: 15px;
`;

const RowsContainer = styled.View`
  margin-top: 10px;
  flex-wrap: wrap;
  /* flex-direction: row; */
  justify-content: flex-start;
`;

const CheckBoxContainer = styled.View`
  border: 1px solid rgba(30, 36, 55, 0.1);
  border-radius: 12px;
  flex-shrink: 0;
  flex-grow: 1;
  width: 100%;
  justify-content: center;
  margin-bottom: 12px;
`;

export default MultiCheckBoxes;

// export const computeMultiCheck = (multiCheckSource, multiCheckDB) =>
//   multiCheckSource.map((check) => ({ ...check, value: multiCheckDB[check._id] || false }));

// export const areChecksSame = (checks1, checks2) => {
//   for (let _id of Object.keys(checks1)) {
//     if (Boolean(checks1[_id]) !== Boolean(checks2[_id])) return false;
//   }
//   return true;
// };
