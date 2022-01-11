import React from 'react';
import styled from 'styled-components';
import * as Sentry from '@sentry/react-native';
import SceneContainer from '../../components/SceneContainer';
import ActionRow from './ActionRow';
import Spinner from '../../components/Spinner';
import { ListEmptyActions, ListNoMoreActions } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import { MyText } from '../../components/MyText';
import FlatListStyled, { SectionListStyled } from '../../components/FlatListStyled';
import { isComingInDays, isPassed, isToday, isTomorrow } from '../../services/date';
import { compose } from 'recompose';
import withContext from '../../contexts/withContext';
import { DONE, TODO, CANCEL } from '../../contexts/actions';
import PersonsContext from '../../contexts/persons';
import RefreshContext from '../../contexts/refresh';
import API from '../../services/api';
import { ActionsByStatusContext } from '../../contexts/selectors';

const PASSED = 'Passées';
const TODAY = "Aujourd'hui";
const TOMORROW = 'Demain';
const INCOMINGDAYS = 'À venir';
const sections = [
  {
    title: PASSED,
    data: [],
  },
  {
    title: TODAY,
    data: [],
  },
  {
    title: TOMORROW,
    data: [],
  },
  {
    title: INCOMINGDAYS,
    data: [],
  },
];

const formatData = (data, status) => {
  if (!data.length) return null;
  if (status === DONE) return data;
  const dataInSections = data.reduce((actions, action) => {
    let inSection = null;
    if (isPassed(action.dueAt)) inSection = PASSED;
    if (isToday(action.dueAt)) inSection = TODAY;
    if (isTomorrow(action.dueAt)) inSection = TOMORROW;
    if (isComingInDays(action.dueAt, 2)) inSection = INCOMINGDAYS;
    return actions.map((section) => {
      if (section.title !== inSection) return section;
      return { ...section, data: [...section.data, action] };
    });
  }, sections);
  return dataInSections;
};

class ActionsList extends React.Component {
  state = {
    refreshing: false,
  };

  componentDidMount() {
    API.navigation = this.props.navigation;
  }

  onMomentumScrollEnd = ({ nativeEvent }) => {
    this.currentScroll = nativeEvent.contentOffset.y;
  };

  onRefresh = () => {
    this.setState({ refreshing: true }, this.refreshData);
  };

  refreshData = async () => {
    await this.props.context.refreshActions();
    this.setState({ refreshing: false });
  };

  onCreateAction = () => this.props.navigation.navigate('NewActionForm', { fromRoute: 'ActionsList' });

  renderSectionHeader = ({ section: { title } }) => <SectionHeader heavy>{title}</SectionHeader>;

  keyExtractor = (action) => action._id;
  ListFooterComponent = () => {
    const { status, context } = this.props;
    const { actionsByStatus } = context;
    if (!actionsByStatus[status].length) return null;
    return <ListNoMoreActions />;
  };
  onActionPress = (action) => {
    const { navigation } = this.props;
    Sentry.setContext('action', { _id: action._id });
    navigation.push('Action', {
      ...action,
      fromRoute: 'ActionsList',
    });
  };
  renderActionRow = ({ item: action }) => {
    const { navigation, context } = this.props;
    return (
      <ActionRow
        action={action}
        onPseudoPress={() => {
          const person = context.persons.find((p) => action.person === p._id);
          Sentry.setContext('person', { _id: person._id });
          navigation.push('Persons', {
            screen: 'Person',
            params: { ...person, fromRoute: 'ActionsList' },
          });
        }}
        onActionPress={() => this.onActionPress(action)}
      />
    );
  };

  renderSectionsList = () => {
    const { refreshing } = this.state;
    const { status, context, onScroll, parentScroll } = this.props;
    const { actionsByStatus, loading, actionKey } = context;

    const actionsInSections = formatData(actionsByStatus[status], status);

    return (
      <SectionListStyled
        ref={(r) => (this.flatList = r)}
        onScroll={onScroll}
        refreshing={refreshing}
        onRefresh={this.onRefresh}
        sections={actionsInSections || []}
        extraData={actionKey}
        initialNumToRender={20}
        renderItem={this.renderActionRow}
        renderSectionHeader={this.renderSectionHeader}
        keyExtractor={this.keyExtractor}
        ListEmptyComponent={loading ? Spinner : ListEmptyActions}
        ListFooterComponent={this.ListFooterComponent}
        parentScroll={parentScroll}
        onMomentumScrollEnd={this.onMomentumScrollEnd}
        onScrollEndDrag={this.onMomentumScrollEnd}
      />
    );
  };

  renderFlatList = () => {
    const { refreshing, loading } = this.state;
    const { status, context, onScroll, parentScroll } = this.props;
    const { actionsByStatus, actionKey } = context;

    return (
      <FlatListStyled
        ref={(r) => (this.flatList = r)}
        refreshing={refreshing}
        onScroll={onScroll}
        onRefresh={this.onRefresh}
        data={actionsByStatus[status]}
        extraData={actionKey}
        initialNumToRender={20}
        renderItem={this.renderActionRow}
        keyExtractor={this.keyExtractor}
        ListEmptyComponent={loading ? Spinner : ListEmptyActions}
        onEndReachedThreshold={0.3}
        onEndReached={this.getActions}
        ListFooterComponent={this.ListFooterComponent}
        parentScroll={parentScroll}
        onMomentumScrollEnd={this.onMomentumScrollEnd}
        onScrollEndDrag={this.onMomentumScrollEnd}
      />
    );
  };

  render() {
    const { status } = this.props;

    return (
      <SceneContainer>
        {status === TODO && this.renderSectionsList()}
        {status === DONE && this.renderFlatList()}
        {status === CANCEL && this.renderFlatList()}
        <FloatAddButton onPress={this.onCreateAction} />
      </SceneContainer>
    );
  }
}

const SectionHeader = styled(MyText)`
  height: 40px;
  line-height: 40px;
  font-size: 25px;
  padding-left: 5%;
  background-color: #fff;
`;

export default compose(withContext(PersonsContext), withContext(ActionsByStatusContext), withContext(RefreshContext))(ActionsList);
