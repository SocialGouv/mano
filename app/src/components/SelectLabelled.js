import React from 'react';
import styled, { css } from 'styled-components';
import { Picker } from '@react-native-community/picker';
import { Platform, TouchableOpacity, Modal } from 'react-native';

const SelectLabelled = (props) => {
  if (Platform.OS === 'android') return <SelectAndroid {...props} />;
  if (Platform.OS === 'ios') return <SelectIos {...props} />;
  return null;
};

const SelectAndroid = ({ label, value, values, onSelect, row }) => (
  <InputContainer row={row}>
    {Boolean(label) && <Label row={row}>{label}</Label>}
    <PickerContainer row={row}>
      <Picker
        selectedValue={value._id}
        onValueChange={(_id) => onSelect(values.find((v) => v._id === _id))}>
        {values.map((value) => (
          <Picker.Item key={value._id} label={value.name} value={value._id} />
        ))}
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
  /* 15px like the input + 18px for the input error height, in ordre to have harmony between input and select */
  margin-bottom: 33px;
  ${(props) => props.row && inputRow}
`;

const labelRow = css`
  margin-bottom: 0px;
  margin-right: 40%;
`;
const Label = styled.Text`
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
  border: 1px solid #666;
  border-radius: 8px;
  padding-horizontal: 5px;
  ${(props) => props.forModal && forModalCss}
  ${(props) => props.row && pickerRow}
`;

const SelectIos = ({ label, value, values, onSelect, row }) => {
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
        {Boolean(label) && <Label row={row}>{label}</Label>}
        <Input row={row}>{value.name}</Input>
      </InputContainer>
      <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancelRequest}>
        <ModalContent>
          <PickerContainer forModal>
            <Picker
              selectedValue={value._id}
              onValueChange={(_id) => onSelect(values.find((v) => v._id === _id))}>
              {values.map((v) => (
                <Picker.Item key={v._id} label={v.name} value={v._id} />
              ))}
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

const ButtonText = styled.Text`
  color: #057dff;
  font-size: 18px;
  ${(props) => props.bold && 'font-weight: bold;'}
`;

const Input = styled.Text`
  border: 1px solid #666;
  border-radius: 8px;
  padding-horizontal: 15px;
  padding-vertical: 10px;
  ${(props) => props.row && pickerRow}
`;

const ModalContent = styled.View`
  justify-content: center;
  height: 100%;
  background-color: #00000044;
`;

export default SelectLabelled;
