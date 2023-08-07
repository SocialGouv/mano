import React, { useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import * as Sentry from '@sentry/react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import ActionRow from './ActionRow';
import Spinner from '../../components/Spinner';
import { ListEmptyActions, ListNoMoreActions } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import { MyText } from '../../components/MyText';
import { FlashListStyled } from '../../components/Lists';
import { TODO } from '../../recoil/actions';
import { actionsByStatusSelector, totalActionsByStatusSelector } from '../../recoil/selectors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { refreshTriggerState, loadingState } from '../../components/Loader';
import Button from '../../components/Button';
import ConsultationRow from '../../components/ConsultationRow';
import { userState } from '../../recoil/auth';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import colors from '../../utils/colors';

const keyExtractor = (action) => action._id;

const limitSteps = 100;

const ActionsList = ({ showActionSheetWithOptions }) => {
  const navigation = useNavigation();
  const loading = useRecoilValue(loadingState);
  const user = useRecoilValue(userState);
  const offset = useRef(new Animated.Value(0));

  const status = useRoute().params.status;
  const [limit, setLimit] = useState(limitSteps);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);

  const actionsByStatus = useRecoilValue(actionsByStatusSelector({ status, limit }));
  const total = useRecoilValue(totalActionsByStatusSelector({ status }));

  const hasMore = useMemo(() => limit < total, [limit, total]);

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const onPressFloatingButton = async () => {
    if (!user.healthcareProfessional) {
      navigation.navigate('NewActionForm', { fromRoute: 'ActionsList' });
      return;
    }
    const options = ['Ajouter une action', 'Ajouter une consultation'];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Ajouter une action') {
          navigation.push('NewActionForm', { fromRoute: 'ActionsList' });
        }
        if (user.healthcareProfessional && options[buttonIndex] === 'Ajouter une consultation') {
          navigation.push('Consultation', { fromRoute: 'ActionsList' });
        }
      }
    );
  };

  const FlatListFooterComponent = useMemo(() => {
    if ([TODO].includes(status)) return !actionsByStatus.length ? null : ListNoMoreActions;
    if (hasMore) return <Button caption="Montrer plus d'actions" onPress={() => setLimit((l) => l + limitSteps)} testID="show-more-actions" />;
    return ListNoMoreActions;
  }, [hasMore, status, actionsByStatus.length]);

  const ListEmptyComponent = useMemo(() => (loading ? Spinner : ListEmptyActions), [loading]);

  const onPseudoPress = useCallback(
    (person) => {
      Sentry.setContext('person', { _id: person._id });
      navigation.push('Person', { person, fromRoute: 'ActionsList' });
    },
    [navigation]
  );

  const onActionPress = useCallback(
    (action) => {
      Sentry.setContext('action', { _id: action._id });
      navigation.push('Action', {
        action,
        fromRoute: 'ActionsList',
      });
    },
    [navigation]
  );

  const onConsultationPress = useCallback(
    (consultationDB, personDB) => {
      navigation.navigate('Consultation', { personDB, consultationDB, fromRoute: 'ActionsList' });
    },
    [navigation]
  );

  const renderItem = ({ item }) => {
    if (item.type === 'title') return <SectionHeaderStyled heavy>{item.title}</SectionHeaderStyled>;
    if (item.isConsultation) {
      return <ConsultationRow consultation={item} onConsultationPress={onConsultationPress} onPseudoPress={onPseudoPress} withBadge showPseudo />;
    }
    const { _id, name, person, status, completedAt, dueAt, placeId } = item;
    const { navigate } = navigation;

    return (
      <ActionRow
        pseudo={person ? person.name : null}
        name={name}
        completedAt={completedAt}
        dueAt={dueAt}
        status={status}
        onPseudoPress={onPseudoPress}
        onActionPress={onActionPress}
      />
    );
  };

  const getItemType = (item) => item.type || 'action';

  return (
    <SceneContainer>
      <ScreenTitle title="AGENDA" backgroundColor={colors.action.backgroundColor} color={colors.action.color} offset={offset.current} />
      <Animated.FlatList
        contentContainerStyle={styles.contentContainerStyle}
        style={styles.flatList}
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        data={actionsByStatus}
        estimatedItemSize={126}
        getItemType={getItemType}
        initialNumToRender={5}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={ListEmptyComponent}
        onEndReachedThreshold={0.3}
        ListFooterComponent={FlatListFooterComponent}
        onScroll={Animated.event(
          [
            {
              nativeEvent: { contentOffset: { y: offset.current } },
            },
          ],
          { useNativeDriver: false /* top not supporter */ }
        )}
      />
      <FloatAddButton onPress={onPressFloatingButton} color={colors.action.backgroundColor} />
    </SceneContainer>
  );
};

const SectionHeaderStyled = styled(MyText)`
  height: 40px;
  line-height: 40px;
  font-size: 25px;
  padding-left: 5%;
  background-color: #fff;
`;

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

export default connectActionSheet(ActionsList);
