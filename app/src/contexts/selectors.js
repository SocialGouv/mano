/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import { isOnSameDay, today } from '../services/date';
import ActionsContext, { CANCEL, DONE, TODO } from './actions';
import AuthContext from './auth';
import CommentsContext from './comments';
import PersonsContext from './persons';
import ReportsContext from './reports';
import TerritoryContext from './territory';
import TerritoryObservationsContext, { observationsKeyLabels } from './territoryObservations';

// we split those "selectors" to help poor machines with heavy calculation

export const ReportsSelectorsContext = React.createContext();

export const ReportsSelectorsProvider = ({ children }) => {
  const { currentTeam } = useContext(AuthContext);
  const { reports } = useContext(ReportsContext);

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
  const { comments, commentKey } = useContext(CommentsContext);
  const { persons, personKey } = useContext(PersonsContext);
  const { actions, actionKey } = useContext(ActionsContext);

  const [personsFullPopulated, setPersonsFullPopulated] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setPersonsFullPopulated(
        persons.map((p) => ({
          ...p,
          comments: comments.filter((c) => c.person === p._id),
          actions: actions.filter((c) => c.person === p._id).map((a) => ({ ...a, comments: comments.filter((c) => c.action === a._id) })),
        }))
      );
    }, 500);
  }, [commentKey, personKey, actionKey]);

  return <PersonsSelectorsContext.Provider value={{ personsFullPopulated }}>{children}</PersonsSelectorsContext.Provider>;
};

export const ActionsSelectorsContext = React.createContext();

export const ActionsSelectorsProvider = ({ children }) => {
  const { currentTeam } = useContext(AuthContext);
  const { comments, commentKey } = useContext(CommentsContext);
  const { persons, personKey } = useContext(PersonsContext);
  const { actions, actionKey } = useContext(ActionsContext);

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
  }, [commentKey, personKey, actionKey, currentTeam?._id]);

  return (
    <ActionsSelectorsContext.Provider value={{ actionsFullPopulated, actionsFullPopulatedForCurrentTeam }}>
      {children}
    </ActionsSelectorsContext.Provider>
  );
};

export const TerritoriesSelectorsContext = React.createContext();

export const TerritoriesSelectorsProvider = ({ children }) => {
  const { territories, territoryKey } = useContext(TerritoryContext);
  const { territoryObservations, obsKey } = useContext(TerritoryObservationsContext);

  const [territoriesFullPopulated, setTerritoriesFullPopulated] = useState([]);

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
  }, [territoryKey, obsKey]);

  return <TerritoriesSelectorsContext.Provider value={{ territoriesFullPopulated }}>{children}</TerritoriesSelectorsContext.Provider>;
};

export const ActionsByStatusContext = React.createContext();

export const ActionsByStatusProvider = ({ children }) => {
  const { currentTeam } = useContext(AuthContext);
  const { persons, personKey } = useContext(PersonsContext);
  const { actions, actionKey } = useContext(ActionsContext);

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
  }, [currentTeam?._id, personKey, actionKey]);

  return <ActionsByStatusContext.Provider value={{ actionsByStatus }}>{children}</ActionsByStatusContext.Provider>;
};
