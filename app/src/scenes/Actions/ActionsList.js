import React from 'react';
import { Alert, StyleSheet, Animated, Text } from 'react-native';
import API from '../../api';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ActionRow from './ActionRow';
import Spinner from '../../components/Spinner';
import {
  ListEmptyActions,
  ListEmptyStructureWithName,
  ListNoMoreActions,
} from '../../components/ListEmptyContainer';
import colors from '../../utils/colors';
import needRefresh from '../../utils/needRefresh';
import FloatAddButton from '../../components/FloatAddButton';
import StickOnTitleContainer from '../../components/StickOnTitleContainer';
import Filter from '../../components/Filter/Filter';

const initFilterTitle = 'Filtrer par le lieu des usagers ';

class ActionsList extends React.Component {
  state = {
    actions: [],
    key: 0,
    refreshing: false,
    loading: false,
    page: 0,
    hasMore: true,
    offset: new Animated.Value(0),
    titleHeight: 0,
    filter: {},
    filterTitle: initFilterTitle,
  };

  componentDidMount() {
    this.getActions();
    this.props.navigation.addListener('focus', this.handleFocus);
  }

  componentWillUnmount() {
    this.props.navigation.removeListener('focus', this.handleFocus);
  }

  handleFocus = () => {
    if (needRefresh.ActionsList) {
      delete needRefresh.ActionsList;
      this.onRefresh('forced');
    }
  };

  onRefresh = () => {
    this.setState({ refreshing: true, page: 0, hasMore: true }, this.getActions);
  };

  getActions = async () => {
    const { hasMore, page, loading, filter } = this.state;
    if (!hasMore || loading) return;
    this.setState({ loading: true });
    const response = await API.get({ path: '/action', query: { page, ...filter } });
    if (response.error) {
      Alert.alert(response.error);
      this.setState({ refreshing: false, loading: false });
    }
    if (response.ok) {
      this.setState(({ key, page, actions }) => {
        return {
          actions: page === 0 ? response.data : [...actions, ...response.data],
          key: key + 1,
          refreshing: false,
          loading: false,
          hasMore: response.hasMore,
          page: page + 1,
        };
      });
    }
  };

  onCreateAction = () =>
    this.props.navigation.navigate('NewActionForm', { fromRoute: 'ActionsList' });

  keyExtractor = (action) => action._id;
  ListFooterComponent = () => {
    const { hasMore, actions } = this.state;
    if (hasMore && actions.length > 0) return <Spinner />;
    if (!actions.length) return null;
    return <ListNoMoreActions />;
  };
  renderActionRow = ({ item: action }) => {
    const { _id, name, person, status, completedAt, dueAt, placeId } = action;
    const { navigate } = this.props.navigation;
    return (
      <ActionRow
        pseudo={person ? person.name : null}
        name={name}
        completedAt={completedAt}
        dueAt={dueAt}
        status={status}
        onPseudoPress={() => navigate('Person', { _id: person._id, fromRoute: 'ActionsList' })}
        onActionPress={() =>
          navigate('Action', {
            _id,
            name: person?.name ? `${name} - ${person.name}` : name,
            fromRoute: 'ActionsList',
          })
        }
      />
    );
  };

  onTitleLayout = (e) => this.setState({ titleHeight: e.nativeEvent.layout.height });

  render() {
    const {
      actions,
      key,
      refreshing,
      loading,
      offset,
      titleHeight,
      filter,
      filterTitle,
    } = this.state;

    return (
      <SceneContainer>
        <ScreenTitle
          title="AGENDA"
          backgroundColor={colors.action.backgroundColor}
          color={colors.action.color}
          offset={offset}
          onLayout={this.onTitleLayout}
        />
        <StickOnTitleContainer
          offsetAnimationValue={offset}
          backgroundColor={colors.person.backgroundColor}
          titleHeight={titleHeight}
          style={styles.stickOnTitleContainer}>
          <Text style={styles.filterText}>{filterTitle}</Text>
          <Filter
            title={initFilterTitle}
            placeholder="Tapez le nom d'un lieu"
            path="/place/autoComplete"
            ListEmptyComponent={ListEmptyStructureWithName}
            filterIsOn={Object.keys(filter).length}
            onChange={({ id, name }) => {
              this.setState(
                {
                  filter: { place: id },
                  filterTitle: `Actions des usagers situés à : ${name}`,
                  hasMore: true,
                  page: 0,
                  actions: [],
                },
                this.getActions
              );
            }}
            onReset={() =>
              this.setState(
                { hasMore: true, page: 0, actions: [], filter: {}, filterTitle: initFilterTitle },
                this.getActions
              )
            }
          />
        </StickOnTitleContainer>
        <Animated.FlatList
          contentContainerStyle={styles.contentContainerStyle}
          style={styles.flatList}
          refreshing={refreshing}
          onRefresh={this.onRefresh}
          data={actions}
          extraData={key}
          renderItem={this.renderActionRow}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={loading ? Spinner : ListEmptyActions}
          onEndReachedThreshold={0.3}
          onEndReached={this.getActions}
          ListFooterComponent={this.ListFooterComponent}
          onScroll={Animated.event(
            [
              {
                nativeEvent: { contentOffset: { y: this.state.offset } },
              },
            ],
            { useNativeDriver: false /* top not supporter */ }
          )}
        />
        <FloatAddButton onPress={this.onCreateAction} color={colors.action.backgroundColor} />
      </SceneContainer>
    );
  }
}

const styles = StyleSheet.create({
  contentContainerStyle: { flexGrow: 1, paddingTop: 120 },
  stickOnTitleContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 10,
    height: 50,
    alignItems: 'center',
  },
  filterText: { marginRight: 10 },
});

export default ActionsList;
