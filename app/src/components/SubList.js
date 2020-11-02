import React from 'react';
import styled from 'styled-components';
import ButtonRight from './ButtonRight';
import ButtonExpand from './ButtonExpand';

const SubList = ({ label, onAdd, data = [], renderItem, ifEmpty }) => {
  const [expanded, setExpanded] = React.useState(data.length < 3);

  return (
    <>
      <ListLabel>
        <ButtonExpand onPress={() => setExpanded(!expanded)} expanded={expanded} />
        <LabelStyled>{`${label}  (${data.length})`}</LabelStyled>
        <ButtonRight caption="+" onPress={onAdd} />
      </ListLabel>
      <List expanded={expanded}>
        {expanded ? data.length ? data.map(renderItem) : <Empty>{ifEmpty}</Empty> : null}
      </List>
    </>
  );
};

const ListLabel = styled.View`
  margin-horizontal: -30px; /* reset */
  margin-vertical: 20px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #999;
  border-top-width: 1px;
  border-top-color: #ddd;
  padding-right: 15px;
  padding-left: 10px;
`;

const LabelStyled = styled.Text`
  font-weight: bold;
  margin-left: 10px;
`;

const Empty = styled.Text`
  align-self: center;
  font-style: italic;
`;

const List = styled.View`
  flex-shrink: 0;
  margin-horizontal: -30px;
  margin-bottom: ${(props) => (props.expanded ? 50 : 0)}px;
`;

export default SubList;
