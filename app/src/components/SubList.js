import React, { useEffect, useState } from 'react';
import styled from 'styled-components/native';
import ButtonExpand from './ButtonExpand';
import Spinner from './Spinner';
import { MyText } from './MyText';
import Button from './Button';

const initNumberToShow = 10;

const SubList = ({ label, onAdd, data, renderItem, ifEmpty, children, testID = 'list' }) => {
  const [expanded, setExpanded] = useState(false);
  const [numberToShow, setNumberToShow] = useState(initNumberToShow);

  useEffect(() => {
    setNumberToShow(initNumberToShow);
  }, [expanded]);

  const renderList = () => {
    if (!expanded) return null;
    if (!Array.isArray(data)) return null;
    if (!data.length) {
      return (
        <EmptyContainer>
          <Empty>{ifEmpty}</Empty>
        </EmptyContainer>
      );
    }
    const dataToShow = data.filter((_, i) => i < numberToShow);
    return (
      <>
        {dataToShow.map(renderItem)}
        {dataToShow.length < data.length && <Button caption="Voir plus" onPress={() => setNumberToShow((num) => num + initNumberToShow)} noBorder />}
      </>
    );
  };

  return (
    <>
      <ListLabel testID={`${testID}-label`}>
        <ButtonExpand onPress={() => setExpanded(!expanded)} expanded={expanded} testID={`${testID}-expand`} />
        <LabelStyled>{`${label}${data != null ? ` (${data.length})` : ''}`}</LabelStyled>
        {Boolean(onAdd) && <Button caption="Ajouter" onPress={onAdd} noBorder testID={`${testID}-add`} />}
      </ListLabel>
      {!!children && expanded && <ChildrenContainer>{children}</ChildrenContainer>}
      <List expanded={expanded}>{renderList()}</List>
    </>
  );
};

const ListLabel = styled.View`
  margin-horizontal: -30px; /* reset */
  /* margin-vertical: 20px; */
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #999;
  border-top-width: 1px;
  border-top-color: #ddd;
  padding-left: 10px;
`;

const LabelStyled = styled(MyText)`
  padding-vertical: 20px;
  font-weight: bold;
  margin-left: 10px;
  font-size: 16px;
  margin-right: auto;
`;

const EmptyContainer = styled.View`
  height: 50px;
  justify-content: center;
  align-items: center;
`;
const Empty = styled(MyText)`
  align-self: center;
  font-style: italic;
`;

const List = styled.View`
  flex-shrink: 0;
  margin-horizontal: -30px;
  margin-bottom: ${(props) => (props.expanded ? 30 : 0)}px;
  padding-top: ${(props) => (props.expanded ? 5 : 0)}px;
`;

const ChildrenContainer = styled.View`
  flex-shrink: 0;
  margin-vertical: 10px;
`;

export default SubList;
