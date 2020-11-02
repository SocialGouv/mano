import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import colors from '../utils/colors';
import styled from 'styled-components';
import API from '../api';
import ResetIcon from '../icons/ResetIcon';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const AutoComplete = ({
  onSelect = (item) => null,
  label,
  url,
  value,
  onClear = () => null,
  maxHeight = 100,
  onChange = () => null,
  hideSuggestion = false,
}) => {
  const [listOpen, setListOpen] = useState(false);
  const [options, setOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const listStateRef = useRef(new Animated.Value(1));
  const listState = listStateRef.current;

  const openList = Animated.timing(listState, { duration: 300, toValue: 1, useNativeDriver: false })
    .start;
  const closeList = Animated.timing(listState, {
    duration: 300,
    toValue: 0,
    useNativeDriver: false,
  }).start;
  const height = listState.interpolate({
    inputRange: [0, 1],
    outputRange: [hideSuggestion ? 0 : maxHeight, maxHeight],
  });

  useEffect(() => {
    if (listOpen) {
      openList();
    } else {
      closeList();
    }
  }, [listOpen]);

  const search = async (text) => {
    setLoading(true);
    const response = await API.get({ path: `${url}?query=${text}` });
    setOptions(response.data);
    if (response.data.length) {
      setListOpen(true);
    } else {
      setListOpen(false);
    }
    setLoading(false);
  };

  const onItemSelect = (item) => {
    setListOpen(false);
    onSelect(item);
    setOptions([]);
  };

  const onTextChange = (text) => {
    text ? openList() : closeList();
    onChange(text);
    search(text);
  };

  return (
    <ItemWrapper>
      <AnimatedInput value={value} onChange={onTextChange} label={label} onClear={onClear} />
      <Animated.View style={{ height }}>
        <AnimatedFlatList
          data={options}
          refreshing={loading}
          renderItem={(props) => <ListItem {...props} onPress={onItemSelect} />}
          keyExtractor={(item) => item.id}
        />
      </Animated.View>
    </ItemWrapper>
  );
};

const ListItem = ({ item, index, separator, onPress }) => (
  <TouchableOpacity onPress={() => onPress(item)}>
    <Text
      numberOfLines={1}
      style={{
        color: colors.app.color,
        fontSize: 20,
        paddingVertical: 5,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.app.color,
      }}>
      {item.name}
    </Text>
  </TouchableOpacity>
);

const AnimatedInput = ({ value, onChange, label = '', onClear }) => {
  let stateRef = useRef(new Animated.Value(0));
  let state = stateRef.current;

  let color = state.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ccc', colors.app.color],
  });

  let borderBottomWidth = state.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3],
  });

  let translateY = state.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  let translateX = state.interpolate({
    inputRange: [0, 1],
    outputRange: [90, 0],
  });

  let scale = state.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 1],
  });

  const empty = () => {
    if (state.__getValue() === 0) {
      return;
    }
    Animated.timing(state, {
      duration: 300,
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  const fill = () => {
    if (state.__getValue() === 1) {
      return;
    }
    Animated.timing(state, {
      duration: 300,
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    value ? fill() : empty();
  }, [value]);

  return (
    <View>
      <Animated.View style={{ transform: [{ translateX }, { translateY }, { scale }] }}>
        <Animated.Text style={{ color }}>{label}</Animated.Text>
      </Animated.View>
      <View style={{ display: 'flex', flexDirection: 'row' }}>
        <AnimatedTextInput
          value={value}
          onChangeText={onChange}
          onFocus={fill}
          onBlur={value ? () => null : empty}
          style={{
            borderBottomWidth,
            borderBottomColor: color,
            paddingVertical: 5,
            flex: 1,
          }}
        />
        <TouchableOpacity
          style={{ marginTop: 10 }}
          onPress={() => {
            onChange('');
            onClear();
          }}>
          <ResetIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AutoComplete;

const ItemWrapper = styled.View``;
