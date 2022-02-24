import styled from 'styled-components';

const MyText = styled.Text.attrs(({ testID = '' }) => ({ selectable: true, testID }))`
  font-family: NexaRegular;
  ${(props) => props.bold && 'font-family: Nexa-Bold;'}
  ${(props) => props.heavy && 'font-family: NexaHeavy;'}
  ${(props) => props.color && `color: ${props.color};`}
`;

const MyTextInput = styled.TextInput.attrs(({ testID = '' }) => ({ testID }))`
  font-family: NexaRegular;
`;

export { MyText, MyTextInput };
