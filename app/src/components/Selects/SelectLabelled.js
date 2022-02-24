import React from 'react';
import styled, { css } from 'styled-components';
import { Picker } from '@react-native-picker/picker';
import { Platform, TouchableOpacity, Modal } from 'react-native';
import InputLabelled from '../InputLabelled';
import { MyText } from '../MyText';

const SelectLabelled = ({ editable = true, buttonCaption, buttonValue, buttonColor, buttonBg, onSelectAndSave, ...props }) => {
  if (!editable) {
    return (
      <InputLabelled
        label={props.label}
        value={props.mappedIdsToLabels?.find(({ _id }) => _id === props.value)?.name || props.value}
        editable={false}
        onButtonPress={onSelectAndSave}
        buttonCaption={buttonCaption}
        buttonValue={buttonValue}
        buttonColor={buttonColor}
        buttonBg={buttonBg}
      />
    );
  }
  if (Platform.OS === 'android') return <SelectAndroid {...props} />;
  if (Platform.OS === 'ios') return <SelectIos {...props} />;
  return null;
};

// values has to be array of unique strings
//  -> ['yes', 'no', 'maybe']
//  -> ['55613213efd351de513f', '54321321fe21d2q3a32152', '54321321fe21d2dfbc23d4']
// an array of mapped ids to labels can be provided if necessary
/*
-> [
  { _id: '55613213efd351de513f', name: 'Hospital' },
  { _id: '54321321fe21d2q3a32152', name: 'Home' },
  { _id: '54321321fe21d2dfbc23d4', name: 'Playground' },
]
*/

const SelectAndroid = ({ label, value, values, onSelect, row, mappedIdsToLabels = null, testID }) => (
  <InputContainer row={row} testID={testID}>
    {Boolean(label) && (
      <Label bold row={row}>
        {label}
      </Label>
    )}
    <PickerContainer row={row}>
      <Picker selectedValue={value} onValueChange={(newValue) => onSelect(newValue)}>
        {mappedIdsToLabels
          ? mappedIdsToLabels.map((value, i) => <Picker.Item key={value._id + i} label={value.name} value={value._id} testID={value.name} />)
          : values.map((value, i) => <Picker.Item key={value} label={value} value={value} testID={value} />)}
      </Picker>
    </PickerContainer>
  </InputContainer>
);

const inputRow = css`
  flex-direction: row;
  flex-grow: 1;
  justify-content: space-between;
  align-items: center;
`;
const InputContainer = styled.View`
  margin-bottom: 30px;
  ${(props) => props.row && inputRow}
`;

const labelRow = css`
  margin-bottom: 0px;
  margin-right: 40%;
`;
const Label = styled(MyText)`
  margin-bottom: 10px;
  font-weight: bold;
  ${(props) => props.debug && 'border: 1px solid #00f;'}
  ${(props) => props.noMargin && 'margin-bottom: 0px;'}
  ${(props) => props.row && labelRow}
`;

const forModalCss = css`
  background-color: white;
  align-self: center;
  width: 75%;
  border-width: 0px;
`;
const pickerRow = css`
  flex-grow: 1;
  text-align: center;
`;
const PickerContainer = styled.View`
  border: 1px solid rgba(30, 36, 55, 0.1);
  border-radius: 12px;
  padding-horizontal: ${Platform.select({ ios: 12, android: 0 })}px;
  ${(props) => props.forModal && forModalCss}
  ${(props) => props.row && pickerRow}
`;

const SelectIos = ({ label, value, values, onSelect, row, mappedIdsToLabels }) => {
  const [visible, setVisible] = React.useState(false);
  const initValue = React.useRef(value);

  const onSelectRequest = () => {
    setVisible(false);
    initValue.current = value;
  };

  const onCancelRequest = () => {
    setVisible(false);
    onSelect(initValue.current);
  };

  return (
    <>
      <InputContainer row={row} as={TouchableOpacity} onPress={() => setVisible(true)}>
        {Boolean(label) && (
          <Label bold row={row}>
            {label}
          </Label>
        )}
        <Input row={row}>{mappedIdsToLabels?.find(({ _id }) => _id === value)?.name || value}</Input>
      </InputContainer>
      <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancelRequest}>
        <ModalContent>
          <PickerContainer forModal>
            <Picker selectedValue={value} onValueChange={onSelect}>
              {mappedIdsToLabels
                ? mappedIdsToLabels.map((value, i) => <Picker.Item key={value._id + i} label={value.name} value={value._id} />)
                : values.map((value, i) => <Picker.Item key={value} label={value} value={value} />)}
            </Picker>
            <ButtonsContainer>
              <Button withBorder onPress={onCancelRequest}>
                <ButtonText>Annuler</ButtonText>
              </Button>
              <Button onPress={onSelectRequest}>
                <ButtonText bold>OK</ButtonText>
              </Button>
            </ButtonsContainer>
          </PickerContainer>
        </ModalContent>
      </Modal>
    </>
  );
};

const ButtonsContainer = styled.View`
  width: 100%;
  height: 40px;
  border-top-color: #ddd;
  border-top-width: 1px;
  flex-direction: row;
`;

const Button = styled.TouchableOpacity`
  border-right-color: #ddd;
  flex-grow: 1;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  width: 50%;
  ${(props) => props.withBorder && 'border-right-width: 1px;'}
`;

const ButtonText = styled(MyText)`
  color: #057dff;
  font-size: 18px;
  ${(props) => props.bold && 'font-weight: bold;'}
`;

const Input = styled(MyText)`
  border: 1px solid rgba(30, 36, 55, 0.1);
  border-radius: 12px;
  padding-horizontal: 12px;
  padding-vertical: 16px;
  ${(props) => props.row && pickerRow}
`;

const ModalContent = styled.View`
  justify-content: center;
  height: 100%;
  background-color: #00000044;
`;

export default SelectLabelled;
