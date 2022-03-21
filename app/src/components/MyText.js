import styled from 'styled-components';

const MyText = styled.Text.attrs({ selectable: true })`
  font-family: NexaRegular;
  ${(props) => props.bold && 'font-family: Nexa-Bold;'}
  ${(props) => props.heavy && 'font-family: NexaHeavy;'}
  color: #000000;
  ${(props) => props.color && `color: ${props.color};`}
`;

const MyTextInput = styled.TextInput.attrs({ placeholderTextColor: '#ccc' })`
  font-family: NexaRegular;
  color: #000000;
`;

export { MyText, MyTextInput };
