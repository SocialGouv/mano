import { useRecoilState, useRecoilValue } from 'recoil';
import * as Sentry from '@sentry/react-native';
import React, { useCallback } from 'react';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import { refreshTriggerState } from '../../components/Loader';
import { FlashListStyled } from '../../components/Lists';
import CommentRow from '../Comments/CommentRow';
import { ListNoMoreComments } from '../../components/ListEmptyContainer';
import { commentsForReport } from './selectors';
import { getPeriodTitle } from './utils';
import { currentTeamState } from '../../recoil/auth';
const keyExtractor = (item) => item._id;

const Comments = ({ navigation, route }) => {
  const date = route?.params?.date;
  const comments = useRecoilValue(commentsForReport({ date }));
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const currentTeam = useRecoilValue(currentTeamState);

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const onPseudoPress = useCallback(
    (person) => {
      Sentry.setContext('person', { _id: person._id });
      navigation.navigate('Person', { person, fromRoute: 'Comments' });
    },
    [navigation]
  );

  const onActionPress = useCallback(
    (action) => {
      Sentry.setContext('action', { _id: action._id });
      navigation.navigate('Action', {
        action,
        fromRoute: 'Comments',
      });
    },
    [navigation]
  );

  const renderItem = ({ item }) => {
    const comment = item;
    const commentedItem = comment.type === 'action' ? comment.action : comment.person;
    return (
      <CommentRow
        key={comment._id}
        comment={comment}
        itemName={`${comment.type === 'action' ? 'Action' : 'Personne suivie'} : ${commentedItem?.name}`}
        onItemNamePress={() => (comment.type === 'action' ? onActionPress(comment.action) : onPseudoPress(comment.person))}
        onUpdate={
          comment.team
            ? () =>
                navigation.push(comment.type === 'action' ? 'ActionComment' : 'PersonComment', {
                  ...comment,
                  commentTitle: commentedItem?.name,
                  fromRoute: 'Comments',
                })
            : null
        }
      />
    );
  };

  return (
    <SceneContainer>
      <ScreenTitle title={`Commentaires \n${getPeriodTitle(date, currentTeam?.nightSession)}`} onBack={navigation.goBack} />
      <FlashListStyled
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        data={comments}
        initialNumToRender={5}
        estimatedItemSize={545}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={0.3}
        ListFooterComponent={ListNoMoreComments}
      />
    </SceneContainer>
  );
};

export default Comments;
