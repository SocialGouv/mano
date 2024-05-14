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
import { currentTeamReportsSelector } from './selectors';
import { refreshTriggerState } from '../../components/Loader';

const Collaborations = ({ route, navigation }) => {
  const [collaboration, setCollaboration] = useState('');
  const [posting, setPosting] = useState(false);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const currentTeam = useRecoilValue(currentTeamState);
  const teamsReports = useRecoilValue(currentTeamReportsSelector);

  const day = route.params?.day;
  const reportDB = useMemo(() => teamsReports.find((r) => r.date === day), [teamsReports, day]);

  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const collaborations = useMemo(() => organisation.collaborations, [organisation]);
  const data = useMemo(() => {
    if (!collaboration) return collaborations;
    return collaborations.filter((c) => c.toLocaleLowerCase().includes(collaboration.toLocaleLowerCase()));
  }, [collaboration, collaborations]);

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
    setPosting(true);
    const collaborations = [...new Set([...(reportDB?.collaborations || []), newCollaboration])];
    const response = reportDB?._id
      ? await API.put({
          path: `/report/${reportDB?._id}`,
          body: prepareReportForEncryption({ ...reportDB, collaborations }),
        })
      : await API.post({
          path: '/report',
          body: prepareReportForEncryption({ team: currentTeam._id, date: day, collaborations }),
        });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
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
