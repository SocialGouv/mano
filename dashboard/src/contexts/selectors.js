import React, { useContext } from 'react';
import { isOnSameDay, today } from '../services/date';
import ActionsContext, { CANCEL, DONE, TODO } from './actions';
import AuthContext from './auth';
import CommentsContext from './comments';
import PersonsContext from './persons';
import ReportsContext from './reports';
import TerritoryContext from './territory';
import TerritoryObservationsContext, { observationsKeyLabels } from './territoryObservations';

const SelectorsContext = React.createContext();

export const SelectorsProvider = ({ children }) => {
  const { currentTeam } = useContext(AuthContext);
  const { comments } = useContext(CommentsContext);
  const { persons } = useContext(PersonsContext);
  const { actions } = useContext(ActionsContext);
  const { territories } = useContext(TerritoryContext);
  const { reports } = useContext(ReportsContext);
  const { territoryObservations } = useContext(TerritoryObservationsContext);

  const todaysReport = reports.find((rep) => isOnSameDay(new Date(rep.date), today()));

  const actionsWithPersonName = actions.map((a) => ({
    ...a,
    personName: persons.find((p) => p._id === a.person)?.name || '',
  }));

  const currentTeamActions = actionsWithPersonName.filter((a) => a.team === currentTeam?._id);

  return (
    <SelectorsContext.Provider
      value={{
        /* reports */
        todaysReport,
        lastReport: reports.filter((rep) => rep._id !== todaysReport?._id)[0],
        /* actions for reception page */
        actionsByStatus: {
          [TODO]: currentTeamActions.filter((a) => a.status === TODO),
          [DONE]: currentTeamActions.filter((a) => a.status === DONE),
          [CANCEL]: currentTeamActions.filter((a) => a.status === CANCEL),
        },
        /* items full populated */
        actionsFullPopulated: actionsWithPersonName.map((a) => ({
          ...a,
          comments: comments.filter((c) => c.action === a._id),
        })),
        personsFullPopulated: persons.map((p) => ({
          ...p,
          comments: comments.filter((c) => c.person === p._id),
          actions: actions.filter((c) => c.person === p._id).map((a) => ({ ...a, comments: comments.filter((c) => c.action === a._id) })),
        })),
        territoriesFullPopulated: territories.map((t) => ({
          ...t,
          observations: territoryObservations
            .filter((obs) => obs.territory === t._id)
            .map((obs) => {
              const obsWithOnlyFilledFields = {};
              for (let key of Object.keys(obs)) {
                if (!!obs[key]) obsWithOnlyFilledFields[observationsKeyLabels[key]] = obs[key];
              }
              return obsWithOnlyFilledFields;
            }),
        })),
      }}>
      {children}
    </SelectorsContext.Provider>
  );
};

export default SelectorsContext;
