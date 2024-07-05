import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { theme } from "../config";
import type { GroupBase, Props } from "react-select";

export interface SelectCustomProps<Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>
  extends Props<Option, IsMulti, Group> {
  creatable?: boolean;
}

function SelectCustom<Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
  allProps: SelectCustomProps<Option, IsMulti, Group>
) {
  const { creatable, ...props } = allProps;
  const Component = creatable ? CreatableSelect : Select;

  return (
    <Component
      // These two options seems magical, they make the dropdown appear on top of everything
      // https://stackoverflow.com/a/64973481/978690
      menuPosition="fixed"
      menuPortalTarget={document.body}
      styles={filterStyles}
      placeholder="Choisir..."
      noOptionsMessage={() => "Aucun résultat"}
      formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
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
      instanceId={props.name}
      inputId={props.inputId}
      classNamePrefix={props.classNamePrefix}
      {...props}
    />
  );
}

const filterStyles = {
  // control: (styles) => ({ ...styles, borderWidth: 0 }),
  indicatorSeparator: (styles: any) => ({ ...styles, borderWidth: 0, backgroundColor: "transparent" }),
  menuPortal: (provided: any) => ({ ...provided, zIndex: 10000 }),
  menu: (provided: any) => ({ ...provided, zIndex: 10000 }),
};

export default SelectCustom;
