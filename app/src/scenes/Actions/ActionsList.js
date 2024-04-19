import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components/native';
import * as Sentry from '@sentry/react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import ActionRow from '../../components/ActionRow';
import Spinner from '../../components/Spinner';
import { ListEmptyActions, ListNoMoreActions } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import { MyText } from '../../components/MyText';
import { FlashListStyled } from '../../components/Lists';
import { TODO } from '../../recoil/actions';
import { actionsByStatusSelector, totalActionsByStatusSelector } from '../../recoil/selectors';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { refreshTriggerState, loadingState } from '../../components/Loader';
import Button from '../../components/Button';
import ConsultationRow from '../../components/ConsultationRow';
import { userState } from '../../recoil/auth';
import { Dimensions } from 'react-native';

const keyExtractor = (action) => action._id;

const limitSteps = 100;

const ActionsList = ({ showActionSheetWithOptions }) => {
  const navigation = useNavigation();
  const loading = useRecoilValue(loadingState);
  const user = useRecoilValue(userState);

  const status = useRoute().params.status;
  const [limit, setLimit] = useState(limitSteps);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);

  const actionsByStatus = useRecoilValue(actionsByStatusSelector({ status, limit }));
  const total = useRecoilValue(totalActionsByStatusSelector({ status }));

  const hasMore = useMemo(() => limit < total, [limit, total]);

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused && refreshTrigger.status !== true) onRefresh();
  }, [isFocused]);

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
    return <ActionRow action={item} onPseudoPress={onPseudoPress} onActionPress={onActionPress} />;
  };

  const getItemType = (item) => item.type || 'action';

  return (
    <Container>
      <FlashListStyled
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
      />
      <FloatAddButton onPress={onPressFloatingButton} />
    </Container>
  );
};

const SectionHeaderStyled = styled(MyText)`
  height: 40px;
  line-height: 40px;
  font-size: 25px;
  padding-left: 5%;
  background-color: #fff;
`;

const Container = styled.View`
  flex: 1;
  height: 100%;
  min-height: ${Dimensions.get('window').height - 230}px;
`;

export default connectActionSheet(ActionsList);
