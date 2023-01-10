import React from 'react';
import { Block } from './Blocks';

const GeneralStats = ({
  personsForStats,
  personsUpdatedForStats,
  rencontres,
  actions,
  numberOfActionsPerPerson,
  numberOfActionsPerPersonConcernedByActions,
}) => {
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques générales</h3>
      <div className="-tw-mx-4 tw-flex tw-flex-wrap">
        <Block data={personsForStats} title="Nombre de personnes créées" />
        <Block data={personsUpdatedForStats} title="Nombre de personnes suivies" />
        <Block data={rencontres.length} title="Nombre de rencontres" />
        <Block data={actions} title="Nombre d'actions" />
        <Block data={numberOfActionsPerPerson} title="Nombre d'actions par personne" />
        <Block data={numberOfActionsPerPersonConcernedByActions} title="Nombre d'actions par personne concernée par au moins une action" />
      </div>
    </>
  );
};

export default GeneralStats;
