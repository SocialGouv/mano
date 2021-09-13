import React from 'react';
import AuthContext from '../../contexts/auth';
import withContext from '../../contexts/withContext';
import MultiCheckBoxes from './MultiCheckBoxes';

const TeamsMultiCheckBoxes = ({ values = [], onChange, editable, context }) => {
  return (
    <MultiCheckBoxes
      label="Assigner à une équipe"
      source={context.teams.map((t) => t.name)}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default withContext(AuthContext)(TeamsMultiCheckBoxes);
