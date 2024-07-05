import { useHistory } from "react-router-dom";
import { Label } from "reactstrap";
import { selector, useRecoilValue } from "recoil";
import { personsState, sortPersons } from "../recoil/persons";
import ButtonCustom from "./ButtonCustom";
import SelectCustom from "./SelectCustom";

const sortedPersonsByNameSelector = selector({
  key: "sortedPersonsByNameSelector",
  get: ({ get }) => {
    const persons = get(personsState);
    return [...persons].sort(sortPersons("name", "ASC"));
  },
});

const SelectPerson = ({
  value = "",
  defaultValue = null,
  onChange,
  isMulti = false,
  noLabel = false,
  isClearable = false,
  disableAccessToPerson = false,
  inputId = "person",
  name = "person",
  ...props
}) => {
  const sortedPersonsByName = useRecoilValue(sortedPersonsByNameSelector);
  const history = useHistory();

  return (
    <>
      {!noLabel && <Label htmlFor={inputId}>{isMulti ? "Personnes(s) suivie(s)" : "Personne suivie"}</Label>}
      <SelectCustom
        options={sortedPersonsByName}
        name={name}
        inputId={inputId}
        classNamePrefix={inputId}
        isMulti={isMulti}
        isClearable={isClearable}
        isSearchable
        onChange={(person) => onChange?.({ currentTarget: { value: isMulti ? person.map((p) => p._id) : person?._id, name } })}
        value={
          value != null && isMulti ? sortedPersonsByName.filter((i) => value?.includes(i._id)) : sortedPersonsByName.find((i) => i._id === value)
        }
        defaultValue={
          defaultValue != null && isMulti
            ? sortedPersonsByName.filter((i) => defaultValue?.includes(i._id))
            : sortedPersonsByName.find((i) => i._id === defaultValue)
        }
        getOptionValue={(i) => i._id}
        getOptionLabel={(i) => (i?.otherNames ? `${i?.name} ${i?.otherNames}` : i?.name)}
        formatOptionLabel={(i, options) => {
          return (
            <div style={{ display: "flex", alignItems: "center" }}>
              {i?.name}
              {Boolean(i?.otherNames) && <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", opacity: 0.5 }}>{i?.otherNames}</span>}
              {!disableAccessToPerson && options.context !== "menu" && (
                <ButtonCustom
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    history.push(`/person/${i._id}`);
                  }}
                  color="link"
                  title="Accéder au dossier"
                  padding="0"
                  style={{ marginLeft: "0.5rem" }}
                />
              )}
            </div>
          );
        }}
        {...props}
      />
    </>
  );
};

export default SelectPerson;
