import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import ResetIcon from '../icons/ResetIcon';
import PlusIcon from '../icons/PlusIcon';
import { MyText, MyTextInput } from './MyText';
import Button from './Button';

const Tags = ({ data = [], onAddRequest, disableAdd, renderTag, onChange, editable, listEmptyText = '', style }) => {
  const addItem = (item) => [...data, item];
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const onSubmit = () => {
    onChange(addItem(text));
    setText('');
  };

  const renderAddTag = () => {
    if (!editable) return null;
    if (disableAdd) return null;
    if (onAddRequest) return <Button caption="Ajouter" onPress={onAddRequest} />;
    return (
      <TagItemAdd>
        <TagInput
          onChangeText={setText}
          value={text}
          onSubmitEditing={onSubmit}
          clearButtonMode="never"
          returnKeyType="done"
          ref={inputRef}
          placeholder="Ajouter"
        />
        {text ? (
          <ResetContainer onPress={onSubmit}>
            <PlusIconStyled color="#888888" size={10} />
          </ResetContainer>
        ) : null}
      </TagItemAdd>
    );
  };

  return (
    <TagWrapper style={style}>
      {data.map((tag, i) => (
        <TagItem key={`${tag}${i}`}>
          {renderTag(tag)}
          {!!editable && (
            <ResetContainer onPress={() => onChange(data.filter((_, index) => index !== i))}>
              <ResetIcon />
            </ResetContainer>
          )}
        </TagItem>
      ))}
      {!data.length && !editable && !!listEmptyText && <MyText>{listEmptyText}</MyText>}
      {renderAddTag()}
    </TagWrapper>
  );
};

const ResetContainer = styled.TouchableOpacity`
  margin-left: 10px;
`;

const PlusIconStyled = styled(PlusIcon)`
  margin-left: 10px;
`;

const TagWrapper = styled.View`
  display: flex;
  flex-flow: row;
  flex-wrap: wrap;
  min-height: 50px;
  margin-bottom: 50px;
`;

const TagItem = styled.View`
  border-radius: 40px;
  background-color: #f4f5f8;
  padding-vertical: 15px;
  padding-horizontal: 25px;
  margin-right: 10px;
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
  align-items: center;
`;

const TagItemAdd = styled(TagItem)`
  border-style: dashed;
  border-radius: 1px;
`;

const TagInput = styled(MyTextInput)`
  padding: 0;
  margin: 0;
  font-size: 14px;
  min-width: 50px;
  height: 20px;
`;

export default Tags;
