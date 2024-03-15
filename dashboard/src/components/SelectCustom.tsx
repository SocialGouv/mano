import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { theme } from "../config";
import type { GroupBase, Props } from "react-select";

interface CustomProps<Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>
  extends Props<Option, IsMulti, Group> {
  creatable?: boolean;
}

function SelectCustom<Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
  allProps: CustomProps<Option, IsMulti, Group>
) {
  const { creatable, ...props } = allProps;
  const Component = creatable ? CreatableSelect : Select;

  return (
    <Component
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
