import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, InteractionManager, View } from 'react-native';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import InputLabelled from '../../components/InputLabelled';
import Label from '../../components/Label';
import { MyText } from '../../components/MyText';
import Row from '../../components/Row';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import Spacer from '../../components/Spacer';
import Tags from '../../components/Tags';
import { CANCEL, DONE } from '../../recoil/actions';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import API from '../../services/api';
import colors from '../../utils/colors';
import {
  actionsForReport,
  consultationsForReport,
  commentsForReport,
  currentTeamReportsSelector,
  observationsForReport,
  passagesForReport,
  rencontresForReport,
} from './selectors';
import { getPeriodTitle } from './utils';
import { refreshTriggerState } from '../../components/Loader';

const castToReport = (report = {}) => ({
  description: report.description?.trim() || '',
  collaborations: report.collaborations || [],
});

const ReportLoading = ({ navigation, route }) => {
  const currentTeam = useRecoilValue(currentTeamState);

  const day = route.params?.day;
  const [isLoading, setIsLoading] = useState(true);

  const title = useMemo(
    () => `Compte rendu de l'équipe ${currentTeam?.name || ''}\n${getPeriodTitle(day, currentTeam?.nightSession)}`,
    [currentTeam?.name, currentTeam?.nightSession, day]
  );

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <SceneContainer>
        <ScreenTitle title={title} onBack={navigation.goBack} testID="report" />
        <ScrollContainer noPadding>
          <ActivityIndicator size="large" color={colors.app.color} />
        </ScrollContainer>
      </SceneContainer>
    );
  }

  return <Report navigation={navigation} route={route} />;
};

const Report = ({ navigation, route }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const setReports = useSetRecoilState(reportsState);
  const teamsReports = useRecoilValue(currentTeamReportsSelector);
  const user = useRecoilValue(userState);

  const day = route.params?.day;
  const reportDB = useMemo(() => teamsReports.find((r) => r.date === day), [teamsReports, day]);
  const [report, setReport] = useState(() => castToReport(reportDB));

  const { actionsCreated, actionsCompleted, actionsCanceled } = useRecoilValue(actionsForReport({ date: day }));
  const { consultationsCreated, consultationsCompleted, consultationsCanceled } = useRecoilValue(consultationsForReport({ date: day }));
  const comments = useRecoilValue(commentsForReport({ date: day }));
  const rencontres = useRecoilValue(rencontresForReport({ date: day }));
  const passages = useRecoilValue(passagesForReport({ date: day }));
  const observations = useRecoilValue(observationsForReport({ date: day }));
  const organisation = useRecoilValue(organisationState);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);

  const isFocused = useIsFocused();

  // to update collaborations
  useEffect(() => {
    if (!isFocused) return;
    setReport(castToReport(reportDB));
  }, [isFocused, reportDB]);

  const [updating, setUpdating] = useState(false);
  const [editable, setEditable] = useState(route?.params?.editable || false);

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.goBack();
  };

  const backRequestHandledRef = useRef(null);
  const handleBeforeRemove = (e) => {
    if (backRequestHandledRef.current === true) return;
    e.preventDefault();
    onGoBackRequested();
  };

  const isUpdateDisabled = useMemo(() => {
    const newReport = { ...(reportDB || {}), ...castToReport(report) };
    if (JSON.stringify(castToReport(reportDB)) !== JSON.stringify(castToReport(newReport))) return false;
    return true;
  }, [reportDB, report]);

  const onEdit = () => setEditable((e) => !e);

  const onUpdateReport = async () => {
    setUpdating(true);
    const response = reportDB?._id
      ? await API.put({
          path: `/report/${reportDB?._id}`,
          body: prepareReportForEncryption({ ...reportDB, ...report }),
        })
      : await API.post({
          path: '/report',
          body: prepareReportForEncryption({ ...report, team: currentTeam._id, date: day }),
        });
    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
      setReport(castToReport(response.decryptedData));
      Alert.alert('Compte-rendu mis à jour !');
      setUpdating(false);
      setEditable(false);
      return true;
    }
  };

  const onGoBackRequested = () => {
    if (isUpdateDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer ce compte-rendu ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const ok = await onUpdateReport();
          if (ok) onBack();
        },
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
  };

  useEffect(() => {
    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      beforeRemoveListenerUnsbscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = useMemo(
    () => `Compte rendu de l'équipe ${currentTeam?.name || ''}\n${getPeriodTitle(day, currentTeam?.nightSession)}`,
    [currentTeam?.name, currentTeam?.nightSession, day]
  );

  return (
    <SceneContainer>
      <ScreenTitle
        title={title}
        onBack={onGoBackRequested}
        onEdit={!editable ? onEdit : null}
        onSave={!editable || isUpdateDisabled ? null : onUpdateReport}
        saving={updating}
        testID="report"
      />
      <ScrollContainer noPadding>
        <View className="px-8 pt-8 pb-0">
          <InputLabelled
            label="Description"
            onChangeText={(description) => setReport((r) => ({ ...r, description }))}
            value={report.description}
            placeholder="Que s'est-il passé aujourd'hui ?"
            multiline
            editable={editable}
          />
          {editable ? <Label label="Collaboration(s)" /> : <MyText className="text-main mb-4 text-base">Collaboration(s) :</MyText>}
          <Tags
            data={report.collaborations}
            key={report.collaborations}
            onChange={(collaborations) => setReport((r) => ({ ...r, collaborations }))}
            editable={editable}
            onAddRequest={() => navigation.navigate('Collaborations', { report: reportDB, day })}
            renderTag={(collaboration) => <MyText>{collaboration}</MyText>}
          />
        </View>
        <Row
          withNextButton
          caption={`Actions complétées (${actionsCompleted.length})`}
          onPress={() => navigation.navigate('Actions', { date: day, status: DONE })}
          disabled={!actionsCompleted.length}
        />
        <Row
          withNextButton
          caption={`Actions créées (${actionsCreated.length})`}
          onPress={() => navigation.navigate('Actions', { date: day, status: null })}
          disabled={!actionsCreated.length}
        />
        <Row
          withNextButton
          caption={`Actions annulées (${actionsCanceled.length})`}
          onPress={() => navigation.navigate('Actions', { date: day, status: CANCEL })}
          disabled={!actionsCanceled.length}
        />
        <Spacer height={30} />
        {user.healthcareProfessional && (
          <>
            <Row
              withNextButton
              caption={`Consultations complétées (${consultationsCompleted.length})`}
              onPress={() => navigation.navigate('Consultations', { date: day, status: DONE })}
              disabled={!consultationsCompleted.length}
            />
            <Row
              withNextButton
              caption={`Consultations créées (${consultationsCreated.length})`}
              onPress={() => navigation.navigate('Consultations', { date: day, status: null })}
              disabled={!consultationsCreated.length}
            />
            <Row
              withNextButton
              caption={`Consultations annulées (${consultationsCanceled.length})`}
              onPress={() => navigation.navigate('Consultations', { date: day, status: CANCEL })}
              disabled={!consultationsCanceled.length}
            />
            <Spacer height={30} />
          </>
        )}
        <Row
          withNextButton
          caption={`Commentaires (${comments.length})`}
          onPress={() => navigation.navigate('CommentsForReport', { date: day })}
          disabled={!comments.length}
        />
        <Spacer height={30} />
        <Row
          withNextButton
          caption={`Rencontres (${rencontres.length})`}
          onPress={() => navigation.navigate('RencontresForReport', { date: day })}
          disabled={!rencontres.length}
        />
        <Row
          withNextButton
          caption={`Passages (${passages.length})`}
          onPress={() => navigation.navigate('PassagesForReport', { date: day })}
          disabled={!passages.length}
        />
        {!!organisation.territoriesEnabled && (
          <>
            <Spacer height={30} />
            <Row
              withNextButton
              caption={`Observations (${observations.length})`}
              onPress={() => navigation.navigate('Observations', { date: day })}
              disabled={!observations.length}
            />
          </>
        )}
        <Spacer height={30} />
      </ScrollContainer>
    </SceneContainer>
  );
};

export default ReportLoading;
