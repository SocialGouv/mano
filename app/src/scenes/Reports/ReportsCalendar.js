import dayjs from 'dayjs';
import React, { useCallback, useState } from 'react';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { selector, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { RefreshControl } from 'react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import { currentTeamState } from '../../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import API from '../../services/api';
import colors from '../../utils/colors';
import { refreshTriggerState } from '../../components/Loader';

LocaleConfig.locales.fr = {
  monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

const currentTeamReportsSelector = selector({
  key: 'currentTeamReportsSelector',
  get: ({ get }) => {
    const reports = get(reportsState);
    const currentTeam = get(currentTeamState);
    return reports.filter((r) => r.team === currentTeam._id);
  },
});

export const mappedReportsToCalendarDaysSelector = selector({
  key: 'mappedReportsToCalendarDaysSelector',
  get: ({ get }) => {
    const reports = get(currentTeamReportsSelector);
    const today = dayjs().format('YYYY-MM-DD');
    const dates = {
      [today]: {
        selected: true,
        startingDay: true,
        endingDay: true,
        color: colors.app.color,
        dotColor: '#000000',
      },
    };
    for (const report of reports) {
      if (report.date === today) {
        dates[report.date].marked = true;
      } else {
        dates[report.date] = {
          marked: true,
          dotColor: '#000000',
        };
      }
    }
    return dates;
  },
});

const ReportsCalendar = ({ navigation }) => {
  const dates = useRecoilValue(mappedReportsToCalendarDaysSelector);
  const reports = useRecoilValue(currentTeamReportsSelector);
  const setReports = useSetRecoilState(reportsState);
  const currentTeam = useRecoilValue(currentTeamState);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const onRefresh = useCallback(() => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const [submiting, setSubmiting] = useState(false);

  const onDayPress = async ({ dateString }) => {
    if (submiting) return;
    setSubmiting(true);
    const day = dayjs(dateString).startOf('day').format('YYYY-MM-DD');
    const report = reports.find((rep) => rep.date === day);
    if (report) {
      navigation.navigate('Report', { ...report });
      setSubmiting(false);
      return;
    }
    const res = await API.post({ path: '/report', body: prepareReportForEncryption({ team: currentTeam._id, date: day }) });
    const newReport = res.decryptedData;
    setReports((reports) => [newReport, ...reports].sort((r1, r2) => (dayjs(r1.date).isBefore(dayjs(r2.date), 'day') ? 1 : -1)));
    setSubmiting(false);
    navigation.navigate('Report', { ...newReport });
  };

  return (
    <SceneContainer>
      <ScreenTitle title={`Comptes-rendus de l'équipe ${currentTeam.name}`} onBack={navigation.goBack} />
      <ScrollContainer refreshControl={<RefreshControl refreshing={refreshTrigger.status} onRefresh={onRefresh} />}>
        <Calendar
          onDayPress={onDayPress}
          pastScrollRange={50}
          futureScrollRange={50}
          scrollEnabled={true}
          showScrollIndicator={true}
          hideExtraDays={true}
          showWeekNumbers
          showSixWeeks
          enableSwipeMonths
          theme={theme}
          firstDay={1}
          markedDates={JSON.parse(JSON.stringify(dates))}
          markingType="custom"
        />
      </ScrollContainer>
    </SceneContainer>
  );
};

const theme = {
  selectedDayBackgroundColor: colors.app.color,
  selectedDayTextColor: '#000',
  todayDotColor: '#000000',
};

export default ReportsCalendar;
