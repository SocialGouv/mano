import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated } from 'react-native';
import { useRecoilState } from 'recoil';
import API from '../../services/api';
import { PersonIcon } from '../../icons';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Row from '../../components/Row';
import Spinner from '../../components/Spinner';
import { ListEmptyStructures } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import { FlashListStyled } from '../../components/Lists';
import { structuresState } from '../../recoil/structures';
import colors from '../../utils/colors';

const Structures = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const offset = useRef(new Animated.Value(0));
  const [structures, setStructures] = useRecoilState(structuresState);

  const getStructures = async (refresh = true) => {
    if (refresh) setRefreshing(true);
    const response = await API.get({ path: '/structure' });
    setRefreshing(false);
    setLoading(false);
    if (response.error) Alert.alert(response.error);
    if (response.ok) setStructures(response.data);
  };

  useEffect(() => {
    getStructures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateStructureRequest = () => navigation.navigate('NewStructureForm');

  const keyExtractor = (structure) => structure._id;
  const renderRow = ({ item: structure }) => {
    const { name } = structure;
    return <Row withNextButton onPress={() => navigation.push('Structure', { structure })} Icon={PersonIcon} caption={name} />;
  };
  return (
    <SceneContainer>
      <ScreenTitle
        title="Structures"
        onBack={navigation.goBack}
        backgroundColor={colors.structure.backgroundColor}
        color={colors.structure.color}
        offset={offset.current}
      />
      <FlashListStyled
        refreshing={refreshing}
        onRefresh={getStructures}
        estimatedItemSize={80}
        key={JSON.stringify(structures)}
        data={structures}
        renderItem={renderRow}
        keyExtractor={keyExtractor}
        ListEmptyComponent={loading ? Spinner : ListEmptyStructures}
        defaultTop={0}
        onScroll={Animated.event(
          [
            {
              nativeEvent: { contentOffset: { y: offset.current } },
            },
          ],
          { useNativeDriver: false /* top not supporter */ }
        )}
      />
      <FloatAddButton onPress={onCreateStructureRequest} />
    </SceneContainer>
  );
};

export default Structures;
