import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import InputLabelled from '../../components/InputLabelled';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import { currentTeamState } from '../../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import API from '../../services/api';
import { addOneDay, formatDateWithFullMonth } from '../../services/dateDayjs';

const getPeriodTitle = (date, nightSession) => {
  if (!nightSession) return `Journée du ${formatDateWithFullMonth(date)}`;
  const nextDay = addOneDay(date);
  return `Nuit du ${formatDateWithFullMonth(date)} au ${formatDateWithFullMonth(nextDay)}`;
};

const castToReport = (report = {}) => ({
  description: report.description?.trim() || '',
  collaborations: report.collaborations || [],
});

const Report = ({ navigation, route }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const [reports, setReports] = useRecoilState(reportsState);

  const reportDB = useMemo(() => reports.find((r) => r._id === route.params._id), [reports, route.params._id]);
  const [report, setReport] = useState(castToReport(route?.params));

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
    const newTerritory = { ...reportDB, ...castToReport(report) };
    if (JSON.stringify(castToReport(reportDB)) !== JSON.stringify(castToReport(newTerritory))) return false;
    return true;
  }, [reportDB, report]);

  const onEdit = () => setEditable((e) => !e);

  const onUpdateReport = async () => {
    setUpdating(true);
    const response = await API.put({
      path: `/report/${reportDB._id}`,
      body: prepareReportForEncryption(castToReport(report)),
    });
    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      setReports((territories) =>
        territories.map((a) => {
          if (a._id === reportDB._id) return response.decryptedData;
          return a;
        })
      );
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
    () => `Compte rendu de l'équipe ${currentTeam?.name || ''}\n${getPeriodTitle(reportDB.date, currentTeam?.nightSession)}`,
    [currentTeam?.name, currentTeam?.nightSession, reportDB.date]
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
      <ScrollContainer>
        <View>
          <InputLabelled
            label="Description"
            onChangeText={(description) => setReport((r) => ({ ...r, description }))}
            value={report.description}
            placeholder="Description"
            multiline
            editable={editable}
            // ref={descriptionRef}
            // onFocus={() => _scrollToInput(descriptionRef)}
          />
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Report;
