import React, { useState, useRef } from 'react';
import { Modal, Text, TouchableOpacity, View, Dimensions, FlatList, Keyboard } from 'react-native';
import styled from 'styled-components';
import { FilterIcon } from '../../icons';
import colors from '../../utils/colors';
import SearchIcon from '../../icons/SearchIcon';
import ButtonReset from '../ButtonReset';
import API from '../../api';
import Spinner from '../Spinner';

const initFilter = { name: '', id: '' };
const AutoCompleteFilter = ({
  title,
  path,
  placeholder,
  ListEmptyComponent,
  onChange = () => null,
  onReset = () => null,
  filterIsOn,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(initFilter);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchTimeout = useRef(null);

  const restFilterInput = (searchAfter = true) => {
    setFilter('');
    setSelectedFilter(initFilter);
    setList([]);
    if (searchAfter) {
      setLoading(true);
      search('');
    }
  };

  const resetFilter = () => {
    restFilterInput(false);
    onReset();
    setModalVisible(false);
  };

  const back = () => {
    setModalVisible(false);
  };

  const onSelectFilter = (item) => {
    Keyboard.dismiss();
    setSelectedFilter(item);
    setFilter(item.name);
    onChange(item);
    setModalVisible(false);
  };

  const onOpenFilters = () => {
    setModalVisible(true);
    search(filter);
  };

  const setFilterRequest = (filter) => {
    setLoading(filter.length);
    setFilter(filter);
    if (!filter.length) setList([]);
    search(filter);
  };

  const search = (toSearch) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      const response = await API.get({ path, query: { query: toSearch } });
      setList(response.data);
      setLoading(false);
    }, 250);
  };

  const Item = ({ item }) => (
    <ListItem onPress={() => onSelectFilter(item)}>
      <ListText numberOfLines={1} ellipsisMode="tail">
        {item.name}
      </ListText>
    </ListItem>
  );

  const showResetFilterButton = Boolean(selectedFilter.id.length) || Boolean(filterIsOn);

  return (
    <View>
      <TouchableOpacity onPress={onOpenFilters}>
        <FilterIcon size={30} color={'#000000'} style={{ marginRight: 10 }} />
      </TouchableOpacity>
      <Modal
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType={'fade'}>
        <Background>
          <Wrapper>
            <Title>{title}</Title>
            <InputContainer>
              <InputSubContainer>
                <SearchIcon size={16} color={'#888'} />
                <Input
                  placeholder={placeholder}
                  onChangeText={setFilterRequest}
                  clearButtonMode="always"
                  value={filter}
                />
                {Boolean(filter.length) && <ButtonReset onPress={restFilterInput} />}
              </InputSubContainer>
            </InputContainer>
            <ItemsWrapper>
              {loading ? (
                <Spinner />
              ) : (
                <FlatList
                  data={list}
                  extraData={loading}
                  renderItem={Item}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={filter.length ? ListEmptyComponent(filter) : null}
                />
              )}
            </ItemsWrapper>
            <ButtonsWrapper>
              <Button onPress={back} first>
                <ButtonText>Retour</ButtonText>
              </Button>
              {showResetFilterButton && (
                <Button onPress={resetFilter} first>
                  <ButtonText>Effacer le filtre</ButtonText>
                </Button>
              )}
            </ButtonsWrapper>
          </Wrapper>
        </Background>
      </Modal>
    </View>
  );
};

const Background = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(1, 1, 1, 0.3);
`;

const Wrapper = styled.View`
  background-color: #ffffff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  padding: 15px;
  width: ${Dimensions.get('window').width * 0.8}px;
  height: ${Dimensions.get('window').height * 0.5}px;
  align-items: stretch;
`;

const ItemsWrapper = styled.View`
  flex: 1;
`;

const Title = styled.Text`
  font-weight: bold;
  font-size: 20px;
  text-align: center;
`;

const ButtonsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  margin-horizontal: -15px;
  border-top-width: 1px;
  border-top-color: lightgray;
  margin-top: 20px;
  margin-bottom: -15px;
`;

const Button = styled.TouchableOpacity`
  padding-vertical: 10px;
  padding-bottom: 15px;
  flex: 1;
  ${(props) => props.disabled && 'opacity: 0.5;'}
  ${(props) => props.first && 'border-right-width: 1px;'}
  ${(props) => props.first && `border-right-color: ${colors.app.color};`}
`;

const ButtonText = styled(Text)`
  color: ${colors.app.color};
  font-size: 20px;
  text-align: center;
`;
const ApplyButtonText = styled(ButtonText)`
  font-weight: bold;
`;

const InputContainer = styled.View`
  padding-vertical: 5px;
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
  border: #ddd 1px solid;
  height: 45px;
  font-weight: bold;
`;

const Input = styled.TextInput`
  font-size: 16px;
  flex-grow: 1;
  flex-shrink: 0;
  background: transparent;
  padding: 0;
  padding-left: 15px;
`;

const ListItem = styled.TouchableOpacity`
  border-bottom-width: 1px;
  border-bottom-color: ${colors.app.color}66;
  height: 40px;
  justify-content: center;
  padding-horizontal: 10px;
`;

const ListText = styled.Text`
  color: ${colors.app.color};
  text-align-vertical: center;
  height: 100%;
  justify-content: center;
  align-items: center;
`;

export default AutoCompleteFilter;
