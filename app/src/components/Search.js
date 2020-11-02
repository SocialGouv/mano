import React from 'react';
import styled from 'styled-components';
import { Alert, Keyboard } from 'react-native';
import API from '../api';
import ButtonReset from './ButtonReset';
import { Search as SearchIcon } from '../icons';

class Search extends React.Component {
  state = {
    search: '',
  };

  onSearchComplete = (results) => {
    this.props.onSearchComplete(results);
  };

  onSearch = (search) => {
    const { path, onSearchStart, onSearchClear } = this.props;
    onSearchStart();
    this.setState({ search });
    clearTimeout(this.searchTimeout);
    clearTimeout(this.keyboardDimissTimeout);
    if (!search.length && onSearchClear) {
      onSearchClear();
      this.keyboardDimissTimeout = setTimeout(() => {
        Keyboard.dismiss();
      }, 1500);
    }
    this.searchTimeout = setTimeout(async () => {
      const response = await API.execute({ path, query: { search } });
      if (response.error) {
        Alert.alert(response.error);
        this.onSearchComplete([]);
      }
      if (response.ok) {
        this.onSearchComplete(response.data);
      }
    }, 300);
  };

  showSearch = () => {
    const { results, search } = this.state;
    if (this.searchInput && this.searchInput.isFocused()) return true;
    if (search.length) return true;
    if (results.length) return true;
    return false;
  };

  render() {
    const { placeholder, style = {} } = this.props;
    const { search } = this.state;
    return (
      <InputContainer style={style}>
        <InputSubContainer>
          <SearchIcon size={16} color={'#888'} />
          <Input
            placeholder={placeholder}
            onChangeText={this.onSearch}
            clearButtonMode="always"
            value={search}
          />
          {Boolean(search.length) && <ButtonReset onPress={() => this.onSearch('')} />}
        </InputSubContainer>
      </InputContainer>
    );
  }
}

const InputContainer = styled.View`
  padding-vertical: 5px;
  padding-horizontal: 15px;
  background-color: transparent;
  flex-direction: row;
  align-items: center;
`;

const InputSubContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding-horizontal: 15px;
  flex-grow: 1;
  background: white;
  border-radius: 100px;
  border: #888 1px solid;
  height: 35px;
  font-weight: bold;
`;

const Input = styled.TextInput`
  flex-grow: 1;
  flex-shrink: 0;
  background: transparent;
  padding: 0;
  padding-left: 15px;
  font-weight: bold;
`;

export default Search;
