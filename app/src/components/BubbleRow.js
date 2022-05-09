import React from 'react';
import styled from 'styled-components';
import { TouchableOpacity } from 'react-native';
import colors from '../utils/colors';
import { MyText } from './MyText';
import UserName from './UserName';
const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

const BubbleRow = ({ onMorePress, caption, date, user, metaCaption, urgent, itemName, onItemNamePress }) => (
  <Container urgent={urgent}>
    <CaptionsContainer>
      {itemName ? (
        <TouchableOpacity onPress={onItemNamePress}>
          <ItemNameStyled>{itemName}</ItemNameStyled>
        </TouchableOpacity>
      ) : null}
      {urgent ? <Urgent>❗ Prioritaire </Urgent> : null}
      <CommentStyled>{caption?.split('\\n')?.join('\u000A')}</CommentStyled>
      <CreationDate>
        {!!user && <UserName caption={metaCaption} id={user?._id || user} />}
        {'\u000A'}
        {new Date(date).getLocaleDateAndTime('fr')}
      </CreationDate>
    </CaptionsContainer>
    <OnMoreContainer hitSlop={hitSlop} onPress={onMorePress}>
      <Dot />
      <Dot />
      <Dot />
    </OnMoreContainer>
  </Container>
);

const Container = styled.View`
  background-color: ${(props) => (props.urgent ? '#fecaca' : '#f4f5f8')};
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  margin-horizontal: 30px;
  margin-vertical: 8px;
`;

const CaptionsContainer = styled.View`
  padding-top: 25px;
  padding-bottom: 5px;
  padding-horizontal: 15px;
  flex-grow: 1;
  /* flex-basis: 100%; */
  align-items: flex-start;
`;

const CommentStyled = styled(MyText)`
  font-size: 17px;
  margin-bottom: 5px;
  flex-grow: 1;
  color: rgba(30, 36, 55, 0.75);
  text-align: justify;
`;

const CreationDate = styled(MyText)`
  font-style: italic;
  margin-left: auto;
  margin-top: 10px;
  margin-bottom: 10px;
  margin-right: 25px;
  text-align: right;
  color: ${colors.app.color};
`;

const OnMoreContainer = styled.TouchableOpacity`
  flex-direction: row;
  position: absolute;
  top: 16px;
  right: 8px;
`;

const Dot = styled.View`
  width: 3px;
  height: 3px;
  border-radius: 3px;
  background-color: rgba(30, 36, 55, 0.5);
  margin-right: 3px;
`;

const Urgent = styled(MyText)`
  margin-left: -10px;
  margin-top: -15px;
  margin-bottom: 15px;
  padding: 2px 5px;
  color: red;
`;

const ItemNameStyled = styled(MyText)`
  font-weight: bold;
  margin-left: -10px;
  margin-top: -15px;
  margin-bottom: 15px;
  padding: 2px 5px;
`;

export default BubbleRow;
