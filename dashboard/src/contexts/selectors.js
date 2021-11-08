/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useActions, CANCEL, DONE, TODO } from '../recoil/actions';
import useAuth from '../recoil/auth';
import { useComments } from '../recoil/comments';
import { usePersons } from '../recoil/persons';
import { usePlaces } from '../recoil/places';
import { useRelsPerson } from '../recoil/relPersonPlace';
import { useReports } from '../recoil/reports';
import { useTerritories } from '../recoil/territory';
import { isOnSameDay, today } from '../services/date';
import { useTerritoryObservations } from '../recoil/territoryObservations';

// we split those "selectors" to help poor machines with heavy calculation

export const ReportsSelectorsContext = React.createContext();

export const ReportsSelectorsProvider = ({ children }) => {
  const { currentTeam } = useAuth();
  const { reports } = useReports();

  const todaysReport = reports.filter((a) => a.team === currentTeam?._id).find((rep) => isOnSameDay(new Date(rep.date), today()));

  return (
    <ReportsSelectorsContext.Provider
      value={{
        /* reports */
        todaysReport,
        lastReport: reports.filter((a) => a.team === currentTeam?._id).filter((rep) => rep._id !== todaysReport?._id)[0],
        /* actions for reception page */
      }}>
      {children}
    </ReportsSelectorsContext.Provider>
  );
};

export const PersonsSelectorsContext = React.createContext();

export const PersonsSelectorsProvider = ({ children }) => {
  const { comments } = useComments();
  const { persons } = usePersons();
  const { actions } = useActions();
  const { relsPersonPlace } = useRelsPerson();
  const { places } = usePlaces();

  const [personsFullPopulated, setPersonsFullPopulated] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setPersonsFullPopulated(
        persons.map((p) => ({
          ...p,
          comments: comments.filter((c) => c.person === p._id),
          actions: actions.filter((c) => c.person === p._id).map((a) => ({ ...a, comments: comments.filter((c) => c.action === a._id) })),
          places: [
            ...new Set(
              relsPersonPlace
                .filter((c) => c.person === p._id)
                .map((rel) => places.find((place) => place._id === rel.place)?.name)
                .filter(Boolean) // just to remove empty names in case it happens (it happened in dev)
            ),
          ],
        }))
      );
    }, 500);
  }, [comments, persons, actions, relsPersonPlace]);

  return <PersonsSelectorsContext.Provider value={{ personsFullPopulated }}>{children}</PersonsSelectorsContext.Provider>;
};

export const ActionsSelectorsContext = React.createContext();

export const ActionsSelectorsProvider = ({ children }) => {
  const { currentTeam } = useAuth();
  const { comments } = useComments();
  const { persons } = usePersons();
  const { actions } = useActions();

  const [actionsFullPopulated, setActionsFullPopulated] = useState([]);
  const [actionsFullPopulatedForCurrentTeam, setActionsFullPopulatedForCurrentTeam] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      const newActionsFullPopulated = actions.map((a) => ({
        ...a,
        personName: persons.find((p) => p._id === a.person)?.name || '',
        comments: comments.filter((c) => c.action === a._id),
      }));
      setActionsFullPopulated(newActionsFullPopulated);
      setActionsFullPopulatedForCurrentTeam(newActionsFullPopulated.filter((a) => a.team === currentTeam?._id));
    }, 1000);
  }, [comments, persons, actions, currentTeam?._id]);

  return (
    <ActionsSelectorsContext.Provider value={{ actionsFullPopulated, actionsFullPopulatedForCurrentTeam }}>
      {children}
    </ActionsSelectorsContext.Provider>
  );
};

export const TerritoriesSelectorsContext = React.createContext();

export const TerritoriesSelectorsProvider = ({ children }) => {
  const { territories } = useTerritories();
  const { territoryObservations, customFieldsObs } = useTerritoryObservations();

  const [territoriesFullPopulated, setTerritoriesFullPopulated] = useState([]);

  const observationsKeyLabels = {};
  for (const field of customFieldsObs) {
    observationsKeyLabels[field.name] = field.label;
  }

  // the idea is to be able to look for a territory
  // with the keywords "matériel ramassé" for example
  // which is the label for the key 'material'
  //so we replace all the keys by the label associated

  useEffect(() => {
    setTerritoriesFullPopulated(
      territories.map((t) => ({
        ...t,
        observations: territoryObservations
          .filter((obs) => obs.territory === t._id)
          .map((obs) => {
            const obsWithOnlyFilledFields = {};
            for (let key of Object.keys(obs)) {
              if (obs[key]) obsWithOnlyFilledFields[observationsKeyLabels[key]] = obs[key];
            }
            return obsWithOnlyFilledFields;
          }),
      }))
    );
  }, [territories, territoryObservations]);

  return <TerritoriesSelectorsContext.Provider value={{ territoriesFullPopulated }}>{children}</TerritoriesSelectorsContext.Provider>;
};

export const ActionsByStatusContext = React.createContext();

export const ActionsByStatusProvider = ({ children }) => {
  const { currentTeam } = useAuth();
  const { persons } = usePersons();
  const { actions } = useActions();

  const [actionsByStatus, setActionsByStatus] = useState({
    [TODO]: [],
    [DONE]: [],
    [CANCEL]: [],
  });

  useEffect(() => {
    const actionsWithPersonName = actions.map((a) => ({
      ...a,
      personName: persons.find((p) => p._id === a.person)?.name || '',
    }));
    const currentTeamActions = actionsWithPersonName.filter((a) => a.team === currentTeam?._id);
    setActionsByStatus({
      [TODO]: currentTeamActions.filter((a) => a.status === TODO),
      [DONE]: currentTeamActions.filter((a) => a.status === DONE),
      [CANCEL]: currentTeamActions.filter((a) => a.status === CANCEL),
    });
  }, [currentTeam?._id, persons, actions]);

  return <ActionsByStatusContext.Provider value={{ actionsByStatus }}>{children}</ActionsByStatusContext.Provider>;
};
