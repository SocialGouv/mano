import dayjs from 'dayjs';
import React, { useCallback, useState } from 'react';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { selector, selectorFamily, useRecoilState, useRecoilValue } from 'recoil';
import { InteractionManager, RefreshControl } from 'react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import { currentTeamState } from '../../recoil/auth';
import { reportsState } from '../../recoil/reports';
import colors from '../../utils/colors';
import { refreshTriggerState } from '../../components/Loader';
import { actionsState } from '../../recoil/actions';
import { commentsState } from '../../recoil/comments';
import { consultationsState } from '../../recoil/consultations';
import { onlyFilledObservationsTerritories } from '../../recoil/selectors';
import { useEffect } from 'react';
import { useLayoutEffect } from 'react';
import { getIsDayWithinHoursOffsetOfDay } from '../../services/dateDayjs';
import { MyText } from '../../components/MyText';
import styled from 'styled-components';

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

const currentTeamActionsSelector = selector({
  key: 'currentTeamActionsSelector',
  get: ({ get }) => {
    const actions = get(actionsState);
    const currentTeam = get(currentTeamState);
    return actions.filter((a) => a.team === currentTeam._id);
  },
});

const currentTeamCommentsSelector = selector({
  key: 'currentTeamCommentsSelector',
  get: ({ get }) => {
    const comments = get(commentsState);
    const currentTeam = get(currentTeamState);
    return comments.filter((c) => c.team === currentTeam._id);
  },
});

const currentTeamConsultationsSelector = selector({
  key: 'currentTeamConsultationsSelector',
  get: ({ get }) => {
    const consultations = get(consultationsState);
    const currentTeam = get(currentTeamState);
    return consultations.filter((c) => c.team === currentTeam._id);
  },
});

const currentTeamObservationsSelector = selector({
  key: 'currentTeamObservationsSelector',
  get: ({ get }) => {
    const obs = get(onlyFilledObservationsTerritories);
    const currentTeam = get(currentTeamState);
    return obs.filter((c) => c.team === currentTeam._id);
  },
});

const dottedDatesFromMonthSelector = selectorFamily({
  key: 'dottedDatesFromMonthSelector',
  get:
    ({ monthToLoad }) =>
    ({ get }) => {
      if (!monthToLoad) return [{}, null];
      const now = Date.now();
      console.log('dottedDatesFromMonthSelector start');
      const currentTeam = get(currentTeamState);
      const reports = get(currentTeamReportsSelector);
      const actions = get(currentTeamActionsSelector);
      const comments = get(currentTeamCommentsSelector);
      // const consultations = get(currentTeamConsultationsSelector);
      const observations = get(currentTeamObservationsSelector);

      const firstDayOfMonth = dayjs(monthToLoad).startOf('month');
      const firstDayToShow = firstDayOfMonth.startOf('week');
      const endOfMonth = dayjs(monthToLoad).endOf('month');
      const lastDayToShow = endOfMonth.endOf('week');

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

      for (let i = 0; i <= lastDayToShow.diff(firstDayToShow, 'days'); i++) {
        const day = firstDayToShow.add(i, 'days');
        console.log(day.format('YYYY-MM-DD'));
        const reportFromDay = reports.find((report) => dayjs(report.date).isSame(day, 'day'));
        const reportIsFilled = !!reportFromDay?.description || !!reportFromDay?.collaborations?.length;
        const actionsCreatedAtFromDay = actions
          .filter((a) => getIsDayWithinHoursOffsetOfDay(a.createdAt, day, currentTeam?.nightSession ? 12 : 0))
          .filter((a) => !getIsDayWithinHoursOffsetOfDay(a.completedAt, day, currentTeam?.nightSession ? 12 : 0));
        const actionsCompletedAtFromDay = actions.filter((a) =>
          getIsDayWithinHoursOffsetOfDay(a.completedAt, day, currentTeam?.nightSession ? 12 : 0)
        );
        const commentsFromDay = comments.filter((c) =>
          getIsDayWithinHoursOffsetOfDay(c.date || c.createdAt, day, currentTeam?.nightSession ? 12 : 0)
        );
        const observationsFromDay = observations.filter((o) =>
          getIsDayWithinHoursOffsetOfDay(o.observedAt || o.createdAt, day, currentTeam?.nightSession ? 12 : 0)
        );
        // const consultationsCreatedAtFromDay = consultations.filter((consultation) => dayjs(consultation.createdAt).isSame(day, 'day'));
        // const consultationsDueAtFromDay = consultations.filter((consultation) => dayjs(consultation.dueAt).isSame(day, 'day'));
        // const consultationsCompletedAtFromDay = consultations.filter((consultation) => dayjs(consultation.completedAt).isSame(day, 'day'));
        const dotted =
          !!reportIsFilled ||
          actionsCreatedAtFromDay.length ||
          actionsCompletedAtFromDay.length ||
          commentsFromDay.length ||
          observationsFromDay.length;
        // consultationsCreatedAtFromDay.length ||
        // consultationsDueAtFromDay.length ||
        // consultationsCompletedAtFromDay.length;

        if (dayjs(today).isSame(day, 'day')) {
          dates[today].marked = !!dotted;
        } else {
          dates[day.format('YYYY-MM-DD')] = {
            marked: !!dotted,
            dotColor: '#000000',
          };
        }
      }
      console.log('dottedDatesFromMonthSelector end', Date.now() - now);
      return [dates, monthToLoad];
    },
});

const ReportsCalendar = ({ navigation }) => {
  const [startOfMonth, setStartOfMonth] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'));
  const [monthToLoad, setMonthToLoad] = useState(null);
  const [dates, monthLoaded] = useRecoilValue(dottedDatesFromMonthSelector({ monthToLoad }));
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
    navigation.navigate('Report', { day });
    setSubmiting(false);
  };

  useEffect(() => {
    console.log('in effect', startOfMonth);
    InteractionManager.runAfterInteractions(() => {
      // ...long-running synchronous task...
      console.log('start');
      setMonthToLoad(startOfMonth);
    });
  }, [startOfMonth]);

  const isLoading = monthLoaded !== startOfMonth;

  return (
    <SceneContainer>
      <ScreenTitle title={`Comptes-rendus de l'équipe ${currentTeam?.name}`} onBack={navigation.goBack} />
      <ScrollContainer refreshControl={<RefreshControl refreshing={refreshTrigger.status} onRefresh={onRefresh} />}>
        <LoadingPhrase isLoading={isLoading}>Chargement des informations du mois...</LoadingPhrase>
        <Calendar
          onDayPress={onDayPress}
          onMonthChange={(month) => setStartOfMonth(dayjs(month.dateString).startOf('month').format('YYYY-MM-DD'))}
          pastScrollRange={50}
          futureScrollRange={50}
          scrollEnabled={true}
          showScrollIndicator={true}
          hideExtraDays={false}
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

const LoadingPhrase = styled(MyText)`
  align-self: center;
  opacity: 0.5;
  ${(p) => !p.isLoading && 'opacity: 0;'}
`;

export default ReportsCalendar;
