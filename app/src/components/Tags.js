import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import ResetIcon from '../icons/ResetIcon';
import PlusIcon from '../icons/PlusIcon';
import { MyText, MyTextInput } from './MyText';

const Tags = ({ data = [], onChange = () => null, editable }) => {
  const removeItem = (index) => [...data.slice(0, index), ...data.slice(index + 1, data.length)];
  const addItem = (item) => [...data, item];
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const onSubmit = () => {
    onChange(addItem(text));
    setText('');
  };

  return (
    <TagWrapper>
      {data.map((name, i) => (
        <TagItem key={`${name}${i}`}>
          <MyText>{name}</MyText>
          {!!editable && (
            <ResetContainer onPress={() => onChange(removeItem(i))}>
              <ResetIcon />
            </ResetContainer>
          )}
        </TagItem>
      ))}

      {!!editable && (
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
      )}
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
