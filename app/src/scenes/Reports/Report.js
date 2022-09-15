import { useIsFocused } from '@react-navigation/native';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { selector, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';
import InputLabelled from '../../components/InputLabelled';
import Label from '../../components/Label';
import Loader from '../../components/Loader';
import { MyText } from '../../components/MyText';
import Row from '../../components/Row';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import Spacer from '../../components/Spacer';
import Tags from '../../components/Tags';
import { CANCEL, DONE } from '../../recoil/actions';
import { currentTeamState } from '../../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import API from '../../services/api';
import colors from '../../utils/colors';
import { actionsCompletedOrCanceledForReport, actionsCreatedForReport, commentsForReport, observationsForReport } from './selectors';
import { getPeriodTitle } from './utils';

const castToReport = (report = {}) => ({
  description: report.description?.trim() || '',
  collaborations: report.collaborations || [],
  date: report.date,
});

const currentTeamReportsSelector = selector({
  key: 'currentTeamReportsSelector',
  get: ({ get }) => {
    const reports = get(reportsState);
    const currentTeam = get(currentTeamState);
    return reports.filter((r) => r.team === currentTeam._id);
  },
});

const Report = ({ navigation, route }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const setReports = useSetRecoilState(reportsState);
  const teamsReports = useRecoilValue(currentTeamReportsSelector);

  const [day] = useState(() => route.params?.day);
  const [reportDB, setReportDB] = useState(null);
  const [report, setReport] = useState(null);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      if (!reportDB?._id) {
        (async () => {
          const report = teamsReports.find((r) => r.date === day);
          if (report) {
            setReportDB(report);
            setReport(castToReport(report));
          } else {
            const res = await API.post({ path: '/report', body: prepareReportForEncryption({ team: currentTeam._id, date: day }) });
            const newReport = res.decryptedData;
            setReports((reports) => [newReport, ...reports].sort((r1, r2) => (dayjs(r1.date).isBefore(dayjs(r2.date), 'day') ? 1 : -1)));
            setReportDB(newReport);
            setReport(castToReport(newReport));
          }
        })();
      } else {
        // to update collaborations
        const freshReport = teamsReports.find((r) => r._id === reportDB?._id);
        setReportDB(freshReport);
        setReport(castToReport(freshReport));
      }
    }
  }, [isFocused, reportDB]);

  const actionsCreated = useRecoilValue(actionsCreatedForReport({ date: reportDB?.date }));
  const actionsCompleted = useRecoilValue(actionsCompletedOrCanceledForReport({ date: reportDB?.date, status: DONE }));
  const actionsCanceled = useRecoilValue(actionsCompletedOrCanceledForReport({ date: reportDB?.date, status: CANCEL }));
  const comments = useRecoilValue(commentsForReport({ date: reportDB?.date }));
  const observations = useRecoilValue(observationsForReport({ date: reportDB?.date }));

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
    if (!reportDB) return true;
    const newReport = { ...reportDB, ...castToReport(report) };
    if (JSON.stringify(castToReport(reportDB)) !== JSON.stringify(castToReport(newReport))) return false;
    return true;
  }, [reportDB, report]);

  const onEdit = () => setEditable((e) => !e);

  const onUpdateReport = async () => {
    setUpdating(true);
    const response = await API.put({
      path: `/report/${reportDB?._id}`,
      body: prepareReportForEncryption({ ...reportDB, ...castToReport(report) }),
    });
    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      setReports((reports) =>
        reports.map((a) => {
          if (a._id === reportDB?._id) return response.decryptedData;
          return a;
        })
      );
      setReportDB(response.decryptedData);
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

  if (!report) {
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
          <Loader />
        </ScrollContainer>
      </SceneContainer>
    );
  }

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
        <Summary>
          <InputLabelled
            label="Description"
            onChangeText={(description) => setReport((r) => ({ ...r, description }))}
            value={report.description}
            placeholder="Que s'est-il passé aujourd'hui ?"
            multiline
            editable={editable}
          />
          {editable ? <Label label="Collaboration(s)" /> : <InlineLabel>Collaboration(s) :</InlineLabel>}
          <Tags
            data={report.collaborations}
            onChange={(collaborations) => setReport((r) => ({ ...r, collaborations }))}
            editable={editable}
            onAddRequest={() => navigation.navigate('Collaborations', { report: reportDB })}
            renderTag={(collaboration) => <MyText>{collaboration}</MyText>}
          />
        </Summary>
        <Row
          withNextButton
          caption={`Actions complétées (${actionsCompleted.length})`}
          onPress={() => navigation.navigate('Actions', { date: reportDB?.date, status: DONE })}
          disabled={!actionsCompleted.length}
        />
        <Row
          withNextButton
          caption={`Actions créées (${actionsCreated.length})`}
          onPress={() => navigation.navigate('Actions', { date: reportDB?.date, status: null })}
          disabled={!actionsCreated.length}
        />
        <Row
          withNextButton
          caption={`Actions annulées (${actionsCanceled.length})`}
          onPress={() => navigation.navigate('Actions', { date: reportDB?.date, status: CANCEL })}
          disabled={!actionsCanceled.length}
        />
        <Spacer height={30} />
        <Row
          withNextButton
          caption={`Commentaires (${comments.length})`}
          onPress={() => navigation.navigate('Comments', { date: reportDB?.date })}
          disabled={!comments.length}
        />
        <Spacer height={30} />
        <Row
          withNextButton
          caption={`Observations (${observations.length})`}
          onPress={() => navigation.navigate('Observations', { date: reportDB?.date })}
          disabled={!observations.length}
        />
      </ScrollContainer>
    </SceneContainer>
  );
};

const Summary = styled.View`
  padding: 30px 30px 0;
`;

const InlineLabel = styled(MyText)`
  font-size: 15px;
  color: ${colors.app.color};
  margin-bottom: 15px;
`;

export default Report;
