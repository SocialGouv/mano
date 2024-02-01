import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import * as Sentry from '@sentry/react-native';
import React, { useCallback } from 'react';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import { refreshTriggerState } from '../../components/Loader';
import { FlashListStyled } from '../../components/Lists';
import CommentRow from '../Comments/CommentRow';
import { ListEmptyComments, ListNoMoreComments } from '../../components/ListEmptyContainer';
import { commentsForReport } from './selectors';
import { getPeriodTitle } from './utils';
import { currentTeamState, organisationState } from '../../recoil/auth';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import { Alert } from 'react-native';
import API from '../../services/api';
import { groupsState } from '../../recoil/groups';
const keyExtractor = (item) => item._id;

const CommentsForReport = ({ navigation, route }) => {
  const date = route?.params?.date;
  const comments = useRecoilValue(commentsForReport({ date }));
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);
  const groups = useRecoilValue(groupsState);
  const setComments = useSetRecoilState(commentsState);

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const onPseudoPress = useCallback(
    (person) => {
      Sentry.setContext('person', { _id: person._id });
      navigation.navigate('Person', { person, fromRoute: 'CommentsForReport' });
    },
    [navigation]
  );

  const onActionPress = useCallback(
    (action) => {
      Sentry.setContext('action', { _id: action._id });
      navigation.navigate('Action', {
        action,
        fromRoute: 'CommentsForReport',
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
        canToggleUrgentCheck
        canToggleGroupCheck={
          !!organisation.groupsEnabled && comment.person?._id && groups.find((group) => group.persons.includes(comment.person._id))
        }
        itemName={
          comment.type === 'action'
            ? `Action : ${commentedItem?.name} (pour ${comment.personPopulated?.name})`
            : `Personne suivie : ${commentedItem?.name}`
        }
        onItemNamePress={() => (comment.type === 'action' ? onActionPress(comment.action) : onPseudoPress(comment.person))}
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
  };

  return (
    <SceneContainer backgroundColor="#fff">
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
        ListEmptyComponent={ListEmptyComments}
        ListFooterComponent={comments.length ? ListNoMoreComments : null}
      />
    </SceneContainer>
  );
};

export default CommentsForReport;
