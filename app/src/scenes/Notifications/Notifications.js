import { selector, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import * as Sentry from '@sentry/react-native';
import React, { useCallback, useMemo } from 'react';
import { actionsState, TODO } from '../../recoil/actions';
import { currentTeamState } from '../../recoil/auth';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import { refreshTriggerState } from '../../components/Loader';
import { SectionListStyled } from '../../components/Lists';
import ActionRow from '../../components/ActionRow';
import CommentRow from '../Comments/CommentRow';
import styled from 'styled-components/native';
import { MyText } from '../../components/MyText';
import { ListEmptyUrgent, ListEmptyUrgentAction, ListEmptyUrgentComment } from '../../components/ListEmptyContainer';
import { actionsObjectSelector, itemsGroupedByPersonSelector } from '../../recoil/selectors';
import API from '../../services/api';
import { Alert } from 'react-native';

export const urgentItemsSelector = selector({
  key: 'urgentItemsSelector',
  get: ({ get }) => {
    const currentTeam = get(currentTeamState);
    const persons = get(itemsGroupedByPersonSelector);
    const actions = get(actionsState);
    const actionsObject = get(actionsObjectSelector);
    const comments = get(commentsState);
    const actionsFiltered = [];
    for (const action of actions) {
      if (Array.isArray(action.teams) ? action.teams.includes(currentTeam?._id) : action.team === currentTeam?._id) {
        if (action.status === TODO && action.urgent) {
          actionsFiltered.push({ ...action, isAction: true });
        }
      }
    }
    const commentsFiltered = [];
    for (const comment of comments) {
      if (!comment.urgent) continue;
      if (comment.team !== currentTeam?._id) continue;
      if (!comment.action && !comment.person) continue;
      const commentPopulated = { ...comment, isComment: true };
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
      commentsFiltered.push(commentPopulated);
    }

    return { actionsFiltered, commentsFiltered };
  },
});

const Notifications = ({ navigation }) => {
  const { actionsFiltered, commentsFiltered } = useRecoilValue(urgentItemsSelector);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const setComments = useSetRecoilState(commentsState);

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
          comment={comment}
          itemName={`${comment.type === 'action' ? 'Action' : 'Personne suivie'} : ${commentedItem?.name}`}
          onItemNamePress={() => (comment.type === 'action' ? onActionPress(comment.action) : onPseudoPress(comment.person))}
          canToggleUrgentCheck
          onDelete={async () => {
            const response = await API.delete({ path: `/comment/${comment._id}` });
            if (response.error) {
              Alert.alert(response.error);
              return false;
            }
            setComments((comments) => comments.filter((p) => p._id !== comment._id));
            return true;
          }}
          onUpdate={
            comment.team
              ? async (commentUpdated) => {
                  if (comment.type === 'action') commentUpdated.action = comment.action._id;
                  if (comment.type === 'person') commentUpdated.person = comment.person._id;
                  const response = await API.put({
                    path: `/comment/${comment._id}`,
                    body: prepareCommentForEncryption(commentUpdated),
                  });
                  if (response.error) {
                    Alert.alert(response.error);
                    return false;
                  }
                  if (response.ok) {
                    setComments((comments) =>
                      comments.map((c) => {
                        if (c._id === comment._id) return response.decryptedData;
                        return c;
                      })
                    );
                    return true;
                  }
                }
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
