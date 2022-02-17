import React from 'react';
import styled from 'styled-components';
import { CANCEL, CHOOSE, DONE, mappedIdsToLabels, TODO } from '../../recoil/actions';
import colors from '../../utils/colors';
import Button from '../Button';
import SelectLabelled from './SelectLabelled';

// prettier-ignore
const statuses = [
  TODO,
  DONE,
  CANCEL,
];

const ActionStatusSelect = ({ value = CHOOSE, onSelect, onSelectAndSave, editable }) => {
  if (!editable) {
    return (
      <Container>
        <SelectLabelled
          label="Status"
          values={statuses}
          mappedIdsToLabels={mappedIdsToLabels}
          value={value}
          onSelect={onSelect}
          onSelectAndSave={onSelectAndSave}
          editable={editable}
        />
        <ButtonsContainer>
          {value !== CANCEL && (
            <>
              <Button
                buttonSize={20}
                borderColor="#00F"
                color="#fff"
                backgroundColor="#00F"
                onPress={() => onSelectAndSave(CANCEL)}
                caption={CANCEL}
              />
              <Spacer />
            </>
          )}
          <Button
            borderColor={value === TODO ? colors.app.color : null}
            color={value === TODO ? '#fff' : colors.app.color}
            buttonSize={20}
            backgroundColor={value === TODO ? colors.app.color : null}
            onPress={() => onSelectAndSave(value === TODO ? DONE : null)}
            caption={value === TODO ? DONE : TODO}
          />
        </ButtonsContainer>
      </Container>
    );
  }
  return (
    <SelectLabelled
      label="Status"
      values={statuses}
      mappedIdsToLabels={mappedIdsToLabels}
      value={value}
      onSelect={onSelect}
      onSelectAndSave={onSelectAndSave}
      editable={editable}
    />
  );
};

const Container = styled.View`
  flex-direction: row;
`;

const ButtonsContainer = styled.View`
  margin-top: 20px;
  flex-direction: row;
`;

const Spacer = styled.View`
  width: 10px;
`;

export default ActionStatusSelect;
