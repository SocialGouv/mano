import React from 'react';
import { Animated } from 'react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Spinner from '../../components/Spinner';
import { ListEmptyTerritories, ListNoMoreTerritories } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import FlatListStyled from '../../components/FlatListStyled';
import Search from '../../components/Search';
import Row from '../../components/Row';
import { TerritoryIcon } from '../../icons';
import { compose } from 'recompose';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import TerritoryContext from '../../contexts/territory';
import RefreshContext from '../../contexts/refresh';

class TerritoriesList extends React.Component {
  state = {
    refreshing: false,
    fromSearch: false,
    search: '',
  };

  onRefresh = () => {
    this.setState({ refreshing: true }, this.refreshData);
  };

  refreshData = async () => {
    await this.props.context.refreshTerritories();
    this.setState({ refreshing: false });
  };

  onCreateTerritoryRequest = () =>
    this.props.navigation.navigate('NewTerritoryForm', {
      fromRoute: 'TerritoriesList',
      toRoute: 'Territory',
    });

  keyExtractor = (territory) => territory._id;
  ListFooterComponent = () => {
    const { territories } = this.props.context;
    if (!territories.length) return null;
    return <ListNoMoreTerritories />;
  };
  renderRow = ({ item: territory }) => {
    const { name } = territory;
    const { push } = this.props.navigation;
    return (
      <Row withNextButton onPress={() => push('Territory', { ...territory, fromRoute: 'TerritoriesList' })} Icon={TerritoryIcon} caption={name} />
    );
  };

  scrollY = new Animated.Value(0);
  onScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            y: this.scrollY,
          },
        },
      },
    ],
    { useNativeDriver: true }
  );
  render() {
    const { refreshing, search } = this.state;
    const { territories, loading, key } = this.props.context;
    const data = territories.filter((p) => p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    return (
      <SceneContainer>
        <ScreenTitle title="Territoires" parentScroll={this.scrollY} />
        <Search
          placeholder="Rechercher un territoire..."
          onChange={(search) => this.setState({ search })}
          onFocus={() => this.listRef.scrollToOffset({ offset: 100 })}
          parentScroll={this.scrollY}
        />
        <FlatListStyled
          ref={(r) => (this.listRef = r)}
          refreshing={refreshing}
          onRefresh={this.onRefresh}
          onScroll={this.onScroll}
          parentScroll={this.scrollY}
          data={data}
          extraData={key}
          renderItem={this.renderRow}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={loading ? Spinner : ListEmptyTerritories}
          initialNumToRender={10}
          ListFooterComponent={this.ListFooterComponent}
          defaultTop={0}
        />
        <FloatAddButton onPress={this.onCreateTerritoryRequest} />
      </SceneContainer>
    );
  }
}

export default compose(withContext(AuthContext), withContext(TerritoryContext), withContext(RefreshContext))(TerritoriesList);
