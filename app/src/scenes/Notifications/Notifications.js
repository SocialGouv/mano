import { selector, useRecoilState, useRecoilValue } from 'recoil';
import * as Sentry from '@sentry/react-native';
import React, { useCallback, useMemo } from 'react';
import { actionsState, TODO } from '../../recoil/actions';
import { currentTeamState } from '../../recoil/auth';
import { commentsState } from '../../recoil/comments';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import { refreshTriggerState } from '../../components/Loader';
import { SectionListStyled } from '../../components/Lists';
import ActionRow from '../../components/ActionRow';
import CommentRow from '../Comments/CommentRow';
import styled from 'styled-components';
import { MyText } from '../../components/MyText';
import { ListEmptyUrgent, ListEmptyUrgentAction, ListEmptyUrgentComment } from '../../components/ListEmptyContainer';
import { actionsObjectSelector, personsObjectSelector } from '../../recoil/selectors';

export const urgentItemsSelector = selector({
  key: 'urgentItemsSelector',
  get: ({ get }) => {
    const currentTeam = get(currentTeamState);
    const persons = get(personsObjectSelector);
    const actions = get(actionsState);
    const actionsObject = get(actionsObjectSelector);
    const comments = get(commentsState);
    const actionsFiltered = actions
      .filter(
        (action) =>
          (Array.isArray(action.teams) ? action.teams.includes(currentTeam?._id) : action.team === currentTeam?._id) &&
          action.status === TODO &&
          action.urgent
      )
      .map((c) => ({
        ...c,
        isAction: true,
      }));

    const commentsFiltered = comments
      .filter((c) => c.urgent)
      .map((comment) => {
        const commentPopulated = { ...comment };
        if (comment.person) {
          const id = comment.person;
          commentPopulated.person = persons[id];
          commentPopulated.type = 'person';
        }
        if (comment.action) {
          const id = comment.action;
          const action = actionsObject[id];
          commentPopulated.action = action;
          if (action?.person) commentPopulated.person = persons[action?.person];
          commentPopulated.type = 'action';
        }
        return commentPopulated;
      })
      .filter((c) => c.action || c.person)
      .map((c) => ({
        ...c,
        isComment: true,
      }));

    return { actionsFiltered, commentsFiltered };
  },
});

const Notifications = ({ navigation }) => {
  const { actionsFiltered, commentsFiltered } = useRecoilValue(urgentItemsSelector);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const sections = useMemo(
    () => [
      {
        title: 'Actions urgentes',
        data: actionsFiltered,
      },
      {
        title: 'Commentaires urgents',
        data: commentsFiltered,
      },
    ],
    [actionsFiltered, commentsFiltered]
  );

  const onPseudoPress = useCallback(
    (person) => {
      Sentry.setContext('person', { _id: person._id });
      navigation.navigate('Persons', { screen: 'Person', params: { person, fromRoute: 'Notifications' } });
    },
    [navigation]
  );

  const onActionPress = useCallback(
    (action) => {
      Sentry.setContext('action', { _id: action._id });
      navigation.navigate('Agenda', {
        screen: 'Action',
        params: {
          action,
          fromRoute: 'ActionsList',
        },
      });
    },
    [navigation]
  );

  const renderItem = ({ item }) => {
    if (item.isAction) {
      const action = item;
      return <ActionRow action={{ ...action, urgent: false }} onPseudoPress={onPseudoPress} onActionPress={onActionPress} />;
    }
    if (item.isComment) {
      const comment = item;
      const commentedItem = comment.type === 'action' ? comment.action : comment.person;
      return (
        <CommentRow
          key={comment._id}
          comment={{ ...comment, urgent: false }}
          itemName={`${comment.type === 'action' ? 'Action' : 'Personne suivie'} : ${commentedItem?.name}`}
          onItemNamePress={() => (comment.type === 'action' ? onActionPress(comment.action) : onPseudoPress(comment.person))}
          onUpdate={
            comment.team
              ? () =>
                  navigation.push(comment.type === 'action' ? 'ActionComment' : 'PersonComment', {
                    ...comment,
                    commentTitle: commentedItem?.name,
                    fromRoute: 'Notifications',
                  })
              : null
          }
        />
      );
    }
    return null;
  };

  const renderEmptySection = ({ section }) => {
    if (!section.data.length) {
      if (section.title === 'Actions urgentes') return <ListEmptyUrgentAction />;
      return <ListEmptyUrgentComment />;
    }
    return null;
  };

  return (
    <SceneContainer>
      <ScreenTitle title="Priorités" />
      <SectionListStyled
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        sections={sections}
        initialNumToRender={5}
        renderItem={renderItem}
        renderSectionHeader={SectionHeader}
        keyExtractor={keyExtractor}
        ListEmptyComponent={ListEmptyUrgent}
        renderSectionFooter={renderEmptySection}
      />
    </SceneContainer>
  );
};

const keyExtractor = (item) => item._id;
const SectionHeader = ({ section: { title } }) => <SectionHeaderStyled heavy>{title}</SectionHeaderStyled>;
const SectionHeaderStyled = styled(MyText)`
  height: 40px;
  line-height: 40px;
  font-size: 25px;
  padding-left: 5%;
  background-color: #fff;
`;

export default Notifications;
