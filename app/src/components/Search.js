import React, { useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import API from '../services/api';
import ButtonReset from './ButtonReset';
import { Search as SearchIcon } from '../icons';
import { MyTextInput } from './MyText';
import { useRecoilValue } from 'recoil';
import { organisationState } from '../recoil/auth';

const Search = ({ path, onSearchStart, onSearchClear, onChange, withOrg, onSearchComplete, placeholder, style, onFocus, parentScroll }) => {
  const [search, setSearch] = useState('');
  const searchTimeout = useRef(null);
  const keyboardDimissTimeout = useRef(null);

  const organisation = useRecoilValue(organisationState);

  const onSearch = async (search) => {
    if (onChange) {
      setSearch(search);
      return onChange(search);
    }
    onSearchStart(search);
    this.setState({ search });
    clearTimeout(searchTimeout.current);
    clearTimeout(keyboardDimissTimeout.current);
    if (!search.length && onSearchClear) {
      onSearchClear();
      keyboardDimissTimeout.current = setTimeout(() => {
        Keyboard.dismiss();
      }, 1500);
    }
    const query = { search };
    if (withOrg) query.organisation = organisation._id;
    searchTimeout.current = setTimeout(async () => {
      const response = await API.execute({ path, query });
      if (response.error) {
        Alert.alert(response.error);
        onSearchComplete([]);
      }
      if (response.ok) {
        onSearchComplete(response.data);
      }
    }, 300);
  };
  return (
    <Animated.View style={[styles.inputContainer(parentScroll), style]}>
      <TouchableOpacity style={styles.inputSubContainer}>
        <SearchIcon size={16} color="#888" />
        <MyTextInput onFocus={onFocus} placeholder={placeholder} onChangeText={onSearch} value={search} style={styles.input} />
        {Boolean(search.length) && <ButtonReset onPress={() => onSearch('')} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

Search.defaultProps = {
  style: {},
  onFocus: () => null,
};

const styles = StyleSheet.create({
  inputContainer: (parentScroll) => ({
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    transform: [
      {
        translateY: parentScroll?.interpolate
          ? parentScroll.interpolate({
              inputRange: [0, 100],
              outputRange: [90, 0],
              extrapolate: 'clamp',
            })
          : 0,
      },
    ],
  }),
  inputSubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    flexGrow: 1,
    backgroundColor: 'white',
    borderRadius: 100,
    borderColor: '#888',
    borderWidth: 1,
  },
  input: {
    flexGrow: 1,
    flexShrink: 0,
    backgroundColor: 'transparent',
    padding: 0,
    paddingLeft: 15,
    fontSize: 16,
    lineHeight: 16,
  },
});

export default Search;
