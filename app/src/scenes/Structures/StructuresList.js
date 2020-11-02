import React from 'react';
import styled from 'styled-components';
import { Alert, Animated } from 'react-native';
import API from '../../api';
import { PersonIcon } from '../../icons';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Row from '../../components/Row';
import Spinner from '../../components/Spinner';
import { ListEmptyStructures } from '../../components/ListEmptyContainer';
import Search from '../../components/Search';
import colors from '../../utils/colors';
import needRefresh from '../../utils/needRefresh';
import StickOnTitleContainer from '../../components/StickOnTitleContainer';
import FloatAddButton from '../../components/FloatAddButton';

class Orientation extends React.Component {
  state = {
    structures: [],
    key: 0,
    refreshing: false,
    loading: true,
    search: '',
    offset: new Animated.Value(0),
    titleHeight: 0,
  };

  componentDidMount() {
    this.getStructures(false);
    this.props.navigation.addListener('focus', this.handleFocus);
  }

  componentWillUnmount() {
    clearTimeout(this.searchTimeout);
    this.props.navigation.removeListener('focus', this.handleFocus);
  }

  handleFocus = () => {
    if (needRefresh.StructuresList) {
      delete needRefresh.StructuresList;
      this.getStructures();
    }
  };

  getStructures = async (refresh = true) => {
    if (refresh) this.setState({ refreshing: true });
    const response = await API.execute({ path: '/structure' });
    if (response.error) {
      Alert.alert(response.error);
      this.setState({ refreshing: false });
    }
    if (response.ok) {
      this.setState(({ key }) => ({
        structures: response.data,
        key: key + 1,
        refreshing: false,
        loading: false,
      }));
    }
  };

  onSearchStart = () => this.setState({ loading: true, structures: [] });
  onSearchComplete = (structures) => {
    this.setState(({ key }) => ({
      structures,
      key: key + 1,
      refreshing: false,
      loading: false,
    }));
  };

  onCreateStructureRequest = () =>
    this.props.navigation.navigate('NewStructureForm', { fromRoute: 'StructuresList' });

  keyExtractor = (structure) => structure._id;
  renderUserRow = ({ item: structure }) => {
    const { name, _id } = structure;
    const { navigate } = this.props.navigation;
    return (
      <Row
        withNextButton
        onPress={() => navigate('Structure', { _id, name, fromRoute: 'StructuresList' })}
        Icon={PersonIcon}
        caption={name}
      />
    );
  };

  onTitleLayout = (e) => this.setState({ titleHeight: e.nativeEvent.layout.height });

  render() {
    const { structures, key, refreshing, loading, offset, titleHeight } = this.state;
    return (
      <SceneContainer>
        <ScreenTitle
          title="STRUCTURES"
          backgroundColor={colors.structure.backgroundColor}
          color={colors.structure.color}
          offset={offset}
          onLayout={this.onTitleLayout}
        />

        <StickOnTitleContainer
          offsetAnimationValue={offset}
          backgroundColor={colors.structure.backgroundColor}
          titleHeight={titleHeight}>
          <Search
            results={structures}
            path="/structure"
            placeholder="Rechercher une structure..."
            onSearchComplete={this.onSearchComplete}
            onSearchStart={this.onSearchStart}
          />
        </StickOnTitleContainer>

        <FlatListStyled
          refreshing={refreshing}
          onRefresh={this.getStructures}
          data={loading ? [] : structures}
          extraData={key}
          renderItem={this.renderUserRow}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={loading ? Spinner : ListEmptyStructures}
          onScroll={Animated.event(
            [
              {
                nativeEvent: { contentOffset: { y: this.state.offset } },
              },
            ],
            { useNativeDriver: false /* top not supporter */ }
          )}
        />
        <FloatAddButton
          onPress={this.onCreateStructureRequest}
          color={colors.structure.backgroundColor}
        />
      </SceneContainer>
    );
  }
}

const FlatListStyled = styled.FlatList.attrs({
  contentContainerStyle: { flexGrow: 1, paddingTop: 100 },
})`
  flex: 1;
`;

export default Orientation;
