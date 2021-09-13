import React from 'react';
import { Alert, Keyboard, StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import API from '../services/api';
import ButtonReset from './ButtonReset';
import { Search as SearchIcon } from '../icons';
import { MyTextInput } from './MyText';
import withContext from '../contexts/withContext';
import AuthContext from '../contexts/auth';

class Search extends React.Component {
  state = {
    search: '',
  };

  onSearchComplete = (results) => {
    this.props.onSearchComplete(results);
  };

  onSearch = async (search) => {
    const { path, onSearchStart, onSearchClear, onChange, withOrg, context } = this.props;
    if (onChange) {
      this.setState({ search });
      return onChange(search);
    }
    onSearchStart(search);
    this.setState({ search });
    clearTimeout(this.searchTimeout);
    clearTimeout(this.keyboardDimissTimeout);
    if (!search.length && onSearchClear) {
      onSearchClear();
      this.keyboardDimissTimeout = setTimeout(() => {
        Keyboard.dismiss();
      }, 1500);
    }
    const query = { search };
    if (withOrg) query.organisation = context.organisation._id;
    this.searchTimeout = setTimeout(async () => {
      const response = await API.execute({ path, query });
      if (response.error) {
        Alert.alert(response.error);
        this.onSearchComplete([]);
      }
      if (response.ok) {
        this.onSearchComplete(response.data);
      }
    }, 300);
  };

  render() {
    const { placeholder, style, onFocus, parentScroll } = this.props;
    const { search } = this.state;
    return (
      <Animated.View style={[styles.inputContainer(parentScroll), style]}>
        <TouchableOpacity style={styles.inputSubContainer}>
          <SearchIcon size={16} color="#888" />
          <MyTextInput onFocus={onFocus} placeholder={placeholder} onChangeText={this.onSearch} value={search} style={styles.input} />
          {Boolean(search.length) && <ButtonReset onPress={() => this.onSearch('')} />}
        </TouchableOpacity>
      </Animated.View>
    );
  }
}

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

export default withContext(AuthContext)(Search);
