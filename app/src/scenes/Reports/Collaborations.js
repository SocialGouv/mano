import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import API from '../../services/api';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Button from '../../components/Button';
import Search from '../../components/Search';
import { FlashListStyled } from '../../components/Lists';
import { ListEmptyCollaboration } from '../../components/ListEmptyContainer';
import Row from '../../components/Row';
import Spacer from '../../components/Spacer';
import { currentTeamState, organisationState } from '../../recoil/auth';
import { getPeriodTitle } from './utils';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import useCreateReportAtDateIfNotExist from '../../utils/useCreateReportAtDateIfNotExist';

const Collaborations = ({ route, navigation }) => {
  const [collaboration, setCollaboration] = useState('');
  const [posting, setPosting] = useState(false);
  const currentTeam = useRecoilValue(currentTeamState);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const setReports = useSetRecoilState(reportsState);
  const collaborations = useMemo(() => organisation.collaborations, [organisation]);
  const data = useMemo(() => {
    if (!collaboration) return collaborations;
    return collaborations.filter((c) => c.toLocaleLowerCase().includes(collaboration.toLocaleLowerCase()));
  }, [collaboration, collaborations]);

  const { day } = route.params;

  const backRequestHandledRef = useRef(null);
  const handleBeforeRemove = (e) => {
    if (backRequestHandledRef.current === true) return;
    e.preventDefault();
    onGoBackRequested();
  };

  useEffect(() => {
    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      beforeRemoveListenerUnsbscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateCollaboration = useCallback(async () => {
    setPosting(true);
    const newCollaborations = [...new Set([...collaborations, collaboration])];
    const response = await API.put({ path: `/organisation/${organisation._id}`, body: { collaborations: newCollaborations } });
    if (response.error) {
      setPosting(false);
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      setOrganisation(response.data);
      onSubmit(collaboration);
    }
  }, [collaboration, collaborations, organisation._id, setOrganisation]);

  const onSubmit = async (newCollaboration) => {
    const reportToUpdate = await createReportAtDateIfNotExist(day); // to make sure we have the last one
    setPosting(true);
    const reportUpdate = {
      ...reportToUpdate,
      collaborations: [...new Set([...(reportToUpdate.collaborations || []), newCollaboration])],
    };
    const res = await API.put({ path: `/report/${reportToUpdate._id}`, body: prepareReportForEncryption(reportUpdate) });
    if (res.error) return Alert.alert(res.error);
    if (res.ok) {
      setReports((reports) =>
        reports.map((a) => {
          if (a._id === reportToUpdate._id) return res.decryptedData;
          return a;
        })
      );
      onBack();
    }
  };

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.goBack();
    setTimeout(() => setPosting(false), 250);
  };

  const isReadyToSave = useMemo(() => {
    if (!collaboration || !collaboration.length || !collaboration.trim().length) return false;
    return true;
  }, [collaboration]);

  const onGoBackRequested = () => {
    if (!isReadyToSave) return onBack();

    if (isReadyToSave) {
      Alert.alert('Voulez-vous enregistrer cette collaboration ?', null, [
        {
          text: 'Enregistrer',
          onPress: onCreateCollaboration,
        },
        {
          text: 'Ne pas enregistrer',
          onPress: onBack,
          style: 'destructive',
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]);
      return;
    }
    Alert.alert('Voulez-vous abandonner la création de cette collaboration ?', null, [
      {
        text: 'Continuer la création',
      },
      {
        text: 'Abandonner',
        onPress: onBack,
        style: 'destructive',
      },
    ]);
  };
  const keyExtractor = (c) => c;
  const renderRow = ({ item: collaboration }) => <Row onPress={() => onSubmit(collaboration)} caption={collaboration} />;
  const ListHeaderComponent = useMemo(
    () => (
      <>
        <Button caption="Créer" disabled={!isReadyToSave} onPress={onCreateCollaboration} loading={posting} />
        <Spacer height={15} />
      </>
    ),
    [isReadyToSave, onCreateCollaboration, posting]
  );

  return (
    <SceneContainer>
      <ScreenTitle title={`Collaboration - ${getPeriodTitle(day, currentTeam?.nightSession)}`} onBack={onGoBackRequested} />
      <Search results={data} placeholder="Rechercher une collaboration..." onChange={setCollaboration} />
      <FlashListStyled
        data={data}
        estimatedItemSize={77}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={renderRow}
        keyExtractor={keyExtractor}
        ListEmptyComponent={collaboration.length ? ListEmptyCollaboration(collaboration) : null}
      />
    </SceneContainer>
  );
};

export default Collaborations;
