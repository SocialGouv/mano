import { useState } from "react";
import SelectCustom from "./SelectCustom";
import { components } from "react-select";
import { dayjsInstance, isOnSameDay } from "../services/date";
import DatePicker from "./DatePicker";
import type { FilterableField, Filter } from "../types/field";

export const filterItem =
  (filters: Array<Filter>, debug = false) =>
  (item: { [x: string]: any }) => {
    // for now an item needs to fulfill ALL items to be displayed
    if (!filters?.filter((f) => Boolean(f?.value)).length) return item;
    for (const filter of filters) {
      if (debug) console.log("filter", filter);
      if (!filter.field || !filter.value) continue;
      const itemValue = item[filter.field];
      if (["number"].includes(filter.type)) {
        const itemNumber = Number(itemValue);
        const { number, number2, comparator } = filter.value;
        if (comparator === "unfilled") {
          if (typeof itemNumber === "number") return false;
          continue;
        }
        // be careful:
        // now we want to exclude everything that is not a number
        // BUT we can't use `isNaN` here because if itemValue is `null`, isNaN(null) === false, because `Number(null) === 0`
        if (typeof itemNumber !== "number") return false;
        if (comparator === "between") {
          if (Number(number) < Number(number2)) {
            if (Number(itemNumber) >= Number(number) && Number(itemNumber) <= Number(number2)) continue;
            return false;
          } else {
            if (Number(itemNumber) >= Number(number2) && Number(itemNumber) <= Number(number)) continue;
            return false;
          }
        }
        if (comparator === "equals") {
          if (Number(itemNumber) === Number(number)) continue;
          return false;
        }
        if (comparator === "lower") {
          if (Number(itemNumber) < Number(number)) continue;
          return false;
        }
        if (comparator === "greater") {
          if (Number(itemNumber) > Number(number)) continue;
          return false;
        }
      }
      if (["boolean"].includes(filter.type)) {
        if (filter.value === "Oui" && !!itemValue) continue;
        if (filter.value === "Non" && !itemValue) continue;
        return false;
      }
      if (["date-with-time", "date", "duration"].includes(filter.type)) {
        const { date, comparator } = filter.value;
        if (comparator === "unfilled") {
          if (!itemValue) continue;
          return false;
        }
        if (!itemValue) return false;
        if (comparator === "before") {
          if (dayjsInstance(itemValue).isBefore(date)) continue;
          return false;
        }
        if (comparator === "after") {
          if (dayjsInstance(itemValue).isAfter(date)) continue;
          return false;
        }
        if (comparator === "equals") {
          if (isOnSameDay(itemValue, date)) continue;
          return false;
        }
      }

      if (typeof itemValue === "boolean") {
        if (!itemValue) {
          if (filter.value === "Non renseigné") continue;
          return false;
        }
        if (itemValue === (filter.value === "Oui")) continue;
        return false;
      }

      const arrayFilterValue = Array.isArray(filter.value) ? filter.value : [filter.value];
      if (!arrayFilterValue.length) continue;
      // here the item needs to fulfill at least one filter value
      let isSelected = false;
      for (const filterValue of arrayFilterValue) {
        if (!itemValue?.length && filterValue === "Non renseigné") {
          isSelected = true;
          break;
        }
        if (typeof itemValue === "string") {
          // For type text we trim and lower case the value.
          if (filter.type === "text") {
            const trimmedItemValue = (itemValue || "").trim().toLowerCase();
            const trimmedFilterValue = (filterValue || "").trim().toLowerCase();
            if (trimmedItemValue.includes(trimmedFilterValue)) {
              isSelected = true;
              break;
            }
          }
          if (itemValue === filterValue) {
            isSelected = true;
            break;
          }
        } else {
          if (itemValue?.includes?.(filterValue)) {
            isSelected = true;
          }
        }
      }
      if (!isSelected) return false;
    }
    return item;
  };

export const filterData = (data: any[], filters: Array<Filter>) => {
  data = data.map(filterItem(filters)).filter(Boolean);
  return data;
};

const Filters = ({
  onChange,
  base,
  filters,
  title = "Filtres :",
  saveInURLParams = false,
}: {
  onChange: (filters: Array<Filter>, saveInURLParams: boolean) => void;
  base: Array<FilterableField>;
  filters: Array<Filter>;
  title?: string;
  saveInURLParams?: boolean;
}) => {
  filters = filters.length ? filters : [{ field: null, type: null, value: null }];
  const onAddFilter = () => onChange([...filters, {}], saveInURLParams);
  const filterFields = base.filter((_filter) => _filter.field !== "alertness").map((f) => ({ label: f.label, field: f.field, type: f.type }));

  function getFilterOptionsByField(fieldName: FilterableField["field"], base: Array<FilterableField>, index: number): Array<string> {
    if (!fieldName) return [];
    const current = base.find((filter) => filter.field === fieldName);
    if (!current) {
      onChange(
        filters.filter((_f, i) => i !== index),
        saveInURLParams
      );
      return [];
    }
    if (["yes-no"].includes(current.type)) return ["Oui", "Non", "Non renseigné"];
    if (["boolean"].includes(current.type)) return ["Oui", "Non"];
    if (current?.field === "outOfActiveList") return current.options;
    if (current?.options?.length) return [...(current?.options || []), "Non renseigné"];
    return ["Non renseigné"];
  }

  function getFilterValue(filterValue: Filter["value"]) {
    if (typeof filterValue === "object") {
      if (filterValue?.date != null) {
        if (filterValue.comparator === "unfilled") return "Non renseigné";
        if (filterValue.comparator === "before") return `Avant le ${dayjsInstance(filterValue.date).format("DD/MM/YYYY")}`;
        if (filterValue.comparator === "after") return `Après le ${dayjsInstance(filterValue.date).format("DD/MM/YYYY")}`;
        if (filterValue.comparator === "equals") return `Le ${dayjsInstance(filterValue.date).format("DD/MM/YYYY")}`;
        return "";
      }
      if (filterValue?.number != null) {
        if (filterValue.comparator === "unfilled") return "Non renseigné";
        if (filterValue.comparator === "between") return `Entre ${filterValue.number} et ${filterValue.number2}`;
        if (filterValue.comparator === "equals") return `Égal à ${filterValue.number}`;
        if (filterValue.comparator === "lower") return `Inférieur à ${filterValue.number}`;
        if (filterValue.comparator === "greater") return `Supérieur à ${filterValue.number}`;
      }
      return "";
    }
    return filterValue;
  }

  return (
    <>
      <div className="printonly tw-flex tw-gap-2">
        {title ? <p>{title}</p> : null}
        <ul>
          {filters.map((filter: Filter, index: number) => {
            if (!filter?.field) return null;
            const current = base.find((filterableField) => filterableField.field === filter.field);
            if (!current) return null;
            const filterValue = getFilterValue(filter.value);
            if (!filterValue) return null;
            return (
              <li key={index} className="tw-list-disc">
                {current.label}: {filterValue}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="border-b noprint tw-z-10 tw-mb-4 tw-flex tw-w-full tw-flex-col tw-justify-center tw-gap-2 tw-self-center tw-border-gray-300">
        <div className="tw-flex tw-flex-wrap">
          <p className="tw-m-0">{title}</p>
        </div>
        <div className="tw-w-full">
          {filters.map((filter: Filter, index: number) => {
            // filter: field, value, type
            const filterValues = getFilterOptionsByField(filter.field, base, index);
            const onChangeField = (newField: FilterableField) => {
              onChange(
                filters.map((_filter, i) => (i === index ? { field: newField?.field, value: null, type: newField?.type } : _filter)),
                saveInURLParams
              );
            };
            const onChangeValue = (newValue: Filter["value"]) => {
              onChange(
                filters.map((f: Filter, i: number) => (i === index ? { field: filter.field, value: newValue, type: filter.type } : f)),
                saveInURLParams
              );
            };
            const onRemoveFilter = () => {
              onChange(
                filters.filter((_f: Filter, i: number) => i !== index),
                saveInURLParams
              );
            };

            return (
              <div
                data-test-id={`filter-${index}`}
                className="tw-mx-auto tw-mb-2.5 tw-flex tw-items-center tw-gap-2"
                key={`${filter.field || "empty"}${index}`}
              >
                <div className="tw-min-w-[85px] tw-shrink-0">
                  <p className="tw-m-0 tw-w-full tw-pr-4 tw-text-right">{index === 0 ? "Filtrer par" : "ET"}</p>
                </div>
                <div className="tw-w-96 tw-min-w-[384px]">
                  <SelectCustom
                    options={filterFields}
                    value={filter.field ? filter : null}
                    onChange={onChangeField}
                    getOptionLabel={(_option) => filterFields.find((_filter) => _filter.field === _option.field)?.label}
                    getOptionValue={(_option) => _option.field}
                    isClearable={true}
                    isMulti={false}
                    inputId={`filter-field-${index}`}
                    classNamePrefix={`filter-field-${index}`}
                  />
                </div>
                <div className="tw-grow">
                  <ValueSelector
                    index={index}
                    field={filter.field}
                    filterValues={filterValues}
                    value={filter.value}
                    base={base}
                    onChangeValue={onChangeValue}
                  />
                </div>
                <div className="tw-shrink-0">
                  {!!filters.filter((_filter: Filter) => Boolean(_filter.field)).length && (
                    <button
                      type="button"
                      className="tw-h-full tw-w-full tw-rounded tw-border tw-border-gray-300 tw-bg-white tw-px-2.5 tw-py-2 tw-text-sm tw-text-red-500 hover:tw-bg-red-100"
                      onClick={onRemoveFilter}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="tw-flex tw-w-full">
          <div className="tw-basis-1/12" />
          <button
            type="button"
            className="tw-h-full tw-rounded tw-text-main disabled:tw-opacity-20 hover:tw-underline tw-text-sm"
            onClick={onAddFilter}
            disabled={!!filters.find((f) => !f.field)}
          >
            + Ajouter un filtre
          </button>
        </div>
      </div>
    </>
  );
};

const dateOptions = [
  {
    label: "Avant",
    value: "before",
  },
  {
    label: "Après",
    value: "after",
  },
  {
    label: "Date exacte",
    value: "equals",
  },
  {
    label: "Non renseigné",
    value: "unfilled",
  },
];

const numberOptions = [
  {
    label: "Inférieur à",
    value: "lower",
  },
  {
    label: "Supérieur à",
    value: "greater",
  },
  {
    label: "Égal à",
    value: "equals",
  },
  {
    label: "Entre",
    value: "between",
  },
  {
    label: "Non renseigné",
    value: "unfilled",
  },
];

const ValueSelector = ({ index, field, filterValues, value, onChangeValue, base }) => {
  const [comparator, setComparator] = useState(null);
  const [unfilledChecked, setUnfilledChecked] = useState(value === "Non renseigné");
  if (!field) return <></>;
  const current = base.find((filter) => filter.field === field);
  if (!current) return <></>;
  const { type, field: name } = current;

  if (["text", "textarea"].includes(type)) {
    return (
      <div className="tw-flex">
        <input
          name={name}
          className={`tailwindui !tw-mt-0 tw-grow ${unfilledChecked ? "!tw-text-gray-400" : ""}`}
          disabled={unfilledChecked}
          type="text"
          value={value || ""}
          onChange={(e) => {
            e.preventDefault();
            onChangeValue(e.target.value);
          }}
        />
        <div className="tw-ml-2 tw-flex tw-shrink-0 tw-items-center tw-gap-1">
          <input
            type="checkbox"
            id="unfilled"
            className={`tw-h-4 tw-w-4`}
            checked={unfilledChecked}
            onChange={() => {
              setUnfilledChecked(!unfilledChecked);
              onChangeValue(unfilledChecked ? "" : "Non renseigné");
            }}
          />
          <label htmlFor="unfilled" className="tw-pt-2 tw-text-xs">
            Non renseigné
          </label>
        </div>
      </div>
    );
  }

  if (["date-with-time", "date", "duration"].includes(type)) {
    return (
      <div className="-tw-mx-4 tw-flex tw-flex-wrap">
        <div className={["tw-pl-4", value?.comparator !== "unfilled" ? "tw-basis-1/2 tw-pr-2" : "tw-basis-full tw-pr-4"].join(" ")}>
          <SelectCustom
            options={dateOptions}
            value={dateOptions.find((opt) => opt.value === value?.comparator)}
            isClearable={!value}
            onChange={(e) => {
              if (!e) return setComparator(null);
              setComparator(e.value);
              onChangeValue({ date: value?.date, comparator: e.value });
            }}
          />
        </div>
        {value?.comparator !== "unfilled" && (
          <div className="tw-basis-1/2 tw-pr-4">
            <DatePicker
              id={name}
              defaultValue={value?.date ? new Date(value?.date) : null}
              onChange={(date) => onChangeValue({ date: date.target.value, comparator })}
            />
          </div>
        )}
      </div>
    );
  }

  if (["number"].includes(type)) {
    return (
      <div className="-tw-mx-4 tw-flex tw-flex-wrap tw-items-center">
        <div
          className={[
            "tw-pl-4 tw-pr-2",
            value?.comparator === "unfilled" ? "tw-basis-full" : "",
            value?.comparator === "between" ? "tw-basis-5/12" : "",
            !["unfilled", "between"].includes(value?.comparator) ? "tw-basis-1/2" : "",
          ].join(" ")}
        >
          <SelectCustom
            options={numberOptions}
            value={numberOptions.find((opt) => opt.value === value?.comparator)}
            isClearable={!value}
            onChange={(e) => {
              if (!e) return setComparator(null);
              setComparator(e.value);
              onChangeValue({ number: value?.number, comparator: e.value });
            }}
          />
        </div>
        {value?.comparator !== "unfilled" && (
          <div className={["tw-pr-4", value?.comparator === "between" ? "tw-basis-3/12" : "tw-basis-1/2"].join(" ")}>
            <input
              name={name}
              className="tailwindui !tw-mt-0"
              type="number"
              min="0"
              value={value?.number || ""}
              onChange={(e) => {
                onChangeValue({ number: e.target.value, number2: value?.number2, comparator });
              }}
            />
          </div>
        )}
        {value?.comparator === "between" && (
          <>
            <div>et</div>
            <div className="tw-basis-3/12 tw-px-4">
              <input
                name={name}
                className="tailwindui !tw-mt-0"
                type="number"
                min="0"
                value={value?.number2 || ""}
                onChange={(e) => {
                  onChangeValue({ number2: e.target.value, number: value?.number, comparator });
                }}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  if (["enum", "multi-choice"].includes(type) && name !== "outOfActiveList") {
    try {
      return (
        <SelectCustom
          options={filterValues.map((_value: any) => ({ label: _value, value: _value }))}
          value={value?.map((_value: any) => ({ label: _value, value: _value })) || []}
          getOptionLabel={(f) => f.label}
          getOptionValue={(f) => f.value}
          onChange={(newValue) => onChangeValue(newValue?.map((option) => option.value))}
          isClearable={!value?.length}
          isMulti
          inputId={`filter-value-${index}`}
          classNamePrefix={`filter-value-${index}`}
          components={{
            MultiValueContainer: (props) => {
              if (props.selectProps?.value?.length <= 1) {
                return <components.MultiValueContainer {...props} />;
              }
              const lastValue = props.selectProps?.value?.[props.selectProps?.value?.length - 1]?.value;
              const isLastValue = props?.data?.value === lastValue;
              return (
                <>
                  <components.MultiValueLabel {...props} />
                  {!isLastValue && <span className="tw-ml-1 tw-mr-2 tw-inline-block">OU</span>}
                </>
              );
            },
          }}
        />
      );
      // eslint-disable-next-line no-empty
    } catch (_e) {}
    return null;
  }

  return (
    <SelectCustom
      options={filterValues.map((_value) => ({ label: _value, value: _value }))}
      value={value ? { label: value, value } : null}
      getOptionLabel={(f) => f.label}
      getOptionValue={(f) => f.value}
      onChange={(f) => onChangeValue(f.value)}
      isClearable={!value}
      inputId={`filter-value-${index}`}
      classNamePrefix={`filter-value-${index}`}
    />
  );
};

export default Filters;
