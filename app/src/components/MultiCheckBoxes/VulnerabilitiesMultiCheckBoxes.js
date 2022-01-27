import React from 'react';
import { vulnerabilitiesOptions } from '../../recoil/persons';
import MultiCheckBoxes from './MultiCheckBoxes';

const VulnerabilitiesMultiCheckBoxes = ({ values = [], onChange, editable }) => {
  return (
    <MultiCheckBoxes
      label="Vulnérabilités"
      source={vulnerabilitiesOptions}
      values={values}
      onChange={onChange}
      editable={editable}
      emptyValue="-- Ne sait pas --"
    />
  );
};

export default VulnerabilitiesMultiCheckBoxes;
