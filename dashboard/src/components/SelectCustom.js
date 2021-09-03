/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { theme } from '../config';

const SelectCustom = ({ creatable, ...props }) => {
  const Component = creatable ? CreatableSelect : Select;
  return (
    <Component
      styles={filterStyles}
      theme={(defaultTheme) => ({
        ...defaultTheme,
        colors: {
          ...defaultTheme.colors,
          primary: theme.main,
          primary25: theme.main25,
          primary50: theme.main50,
          primary75: theme.main75,
        },
      })}
      {...props}
    />
  );
};
const filterStyles = {
  // control: (styles) => ({ ...styles, borderWidth: 0 }),
  indicatorSeparator: (styles) => ({ ...styles, borderWidth: 0, backgroundColor: 'transparent' }),
};

export default SelectCustom;
