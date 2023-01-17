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
        <Block
          data={personsForStats}
          title="Nombre de personnes créées"
          help={`Nombre de personnes dont la date 'Suivi(e) depuis' se situe dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
        />
        <Block
          data={personsUpdatedForStats}
          title="Nombre de personnes suivies"
          help={`Nombre de personnes pour lesquelles il s'est passé quelque chose durant la période sélectionnée:\n\ncréation, modification, commentaire, action, rencontre, passage, lieu fréquenté, consultation, traitement.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
        />
        <Block
          data={rencontres.length}
          title="Nombre de rencontres"
          help={`Nombre de rencontres enregistrées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des rencontres.`}
        />
        <Block
          data={actions}
          title="Nombre d'actions"
          help={`Nombre d'actions enregistrées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des actions.`}
        />
        <Block
          data={numberOfActionsPerPerson}
          title="Nombre d'actions par personne"
          help={`Moyenne d'actions créées par "personne suivies" dans la période définie.\n\nSi aucune période n'est définie, on considère la totalité des actions par rapport à la totalité des personnes.\n\n<small>On entend par "personnes suivies" les personnes pour lesquelles il s'est passé quelque chose durant la période sélectionnée: création, modification, commentaire, action, rencontre, passage, lieu fréquenté, consultation, traitement.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.</small>`}
        />
        <Block
          data={numberOfActionsPerPersonConcernedByActions}
          title="Nombre d'actions par personne concernée par au moins une action"
          help={`Moyenne d'actions créées par "personne suivies" <b>pour lesquelles au moins une action a été créée</b> dans la période définie.\n\nSi aucune période n'est définie, on considère la totalité des actions par rapport à la totalité des personnes.`}
        />
      </div>
    </>
  );
};

export default GeneralStats;
