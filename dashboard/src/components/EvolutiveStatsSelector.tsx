import React, { useState } from "react";
import SelectCustom from "./SelectCustom";
import { dayjsInstance } from "../services/date";
import type { FilterableField } from "../types/field";
import type { IndicatorValue, IndicatorsSelection, IndicatorsBase } from "../types/evolutivesStats";
import { useRecoilValue } from "recoil";
import { evolutiveStatsIndicatorsBaseSelector } from "../recoil/evolutiveStats";

interface EvolutiveStatsSelectorProps {
  onChange: (selection: IndicatorsSelection, saveInURLParams: boolean) => void;
  selection: IndicatorsSelection;
  title?: string;
  saveInURLParams?: boolean;
}

const emptySelection = { fieldName: null, type: null, fromValue: null, toValue: null };
const EvolutiveStatsSelector = ({ onChange, selection, title = "", saveInURLParams = false }: EvolutiveStatsSelectorProps) => {
  const indicatorsBase = useRecoilValue(evolutiveStatsIndicatorsBaseSelector);

  selection = selection.length ? selection : [emptySelection];
  const onAddIndicator = () => onChange([...selection, emptySelection], saveInURLParams);
  const selectCustomOptions = indicatorsBase.map((_indicator) => ({ label: _indicator.label, value: _indicator.name })) || [];

  function getFilterOptionsByField(fieldName: FilterableField["name"] | null, base: IndicatorsBase, index: number) {
    if (!fieldName) return [];
    const current = base.find((field) => field.name === fieldName);
    if (!current) {
      onChange(
        selection.filter((_f, i) => i !== index),
        saveInURLParams
      );
      return [];
    }
    if (["yes-no"].includes(current.type)) return ["Oui", "Non", "Non renseigné"];
    if (["boolean"].includes(current.type)) return ["Oui", "Non"];
    if (current?.name === "outOfActiveList") return current.options || [];
    if (current?.options?.length) {
      // eslint-disable-next-line no-unsafe-optional-chaining
      return [...current?.options, "Non renseigné"].filter((option) => {
        if (!option) return false;
        if (option.includes("Choisissez un genre")) return false;
        return true;
      });
    }
    return ["Non renseigné"];
  }

  function getIndicatorValue(filterValue: IndicatorValue) {
    if (typeof filterValue === "object") {
      // we have a date or a number
      if (filterValue?.date != null) {
        // we have a date
        if (filterValue.comparator === "unfilled") return "Non renseigné";
        if (filterValue.comparator === "before") return `Avant le ${dayjsInstance(filterValue.date).format("DD/MM/YYYY")}`;
        if (filterValue.comparator === "after") return `Après le ${dayjsInstance(filterValue.date).format("DD/MM/YYYY")}`;
        if (filterValue.comparator === "equals") return `Le ${dayjsInstance(filterValue.date).format("DD/MM/YYYY")}`;
        return "";
      }
      if (filterValue?.number != null) {
        // we have a number
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
        {title}
        <ul>
          {selection.map((indicator, index) => {
            if (!indicator?.fieldName) return null;
            const current = indicatorsBase.find((field) => field.name === indicator.fieldName);
            if (!current) return null;
            const indicatorFromValue = getIndicatorValue(indicator.fromValue);
            if (!indicatorFromValue) return null;
            const indicatorToValue = getIndicatorValue(indicator.toValue);
            if (!indicatorToValue) return null;
            return (
              <li key={index} className="tw-list-disc">
                {current.label}: de {indicatorFromValue} à {indicatorToValue}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="border-b noprint tw-z-10 tw-mb-8 tw-flex tw-w-full tw-flex-col tw-justify-center tw-gap-2 tw-self-center tw-border-gray-300 tw-pb-4">
        <div className="tw-flex tw-flex-wrap">
          <div className="tw-basis-5/6">{title}</div>
        </div>
        <div className="tw-grid tw-w-full tw-grid-cols-[2fr_5fr_1fr_5fr_1fr_5fr_2fr] tw-gap-x-1 tw-gap-y-2">
          {selection.map((indicator, index) => {
            // indicator: field, value, type
            const indicatorValues = getFilterOptionsByField(indicator.fieldName, indicatorsBase, index);
            const onChangeFromValue = (newValue: any) => {
              onChange(
                selection.map((f, i) => (i === index ? { ...f, fromValue: newValue } : f)),
                saveInURLParams
              );
            };
            const onChangeToValue = (newValue: any) => {
              onChange(
                selection.map((f, i) => (i === index ? { ...f, toValue: newValue } : f)),
                saveInURLParams
              );
            };
            const onRemoveFilter = () => {
              onChange(
                selection.filter((_f, i) => i !== index),
                saveInURLParams
              );
            };

            const value = selectCustomOptions.find((opt) => opt.value === indicator.fieldName);

            return (
              <React.Fragment key={`${indicator.fieldName || "empty"}${index}`}>
                <div className="tw-grow tw-items-center tw-self-center">
                  <p className="tw-m-0 tw-w-full tw-pr-4 tw-text-right">{index === 0 ? "Indicateur" : "ET"}</p>
                </div>
                <div>
                  <SelectCustom
                    options={selectCustomOptions}
                    value={value}
                    onChange={(option) => {
                      const newField = indicatorsBase.find((field) => field.name === option?.value);
                      if (!newField) return;
                      onChange(
                        selection.map((_indicator, i) =>
                          i === index ? { fieldName: newField.name, fromValue: null, toValue: null, type: newField.type } : _indicator
                        ),
                        saveInURLParams
                      );
                    }}
                  />
                </div>
                <div className="tw-flex  tw-items-center tw-justify-center">
                  <p className="tw-m-0">de</p>
                </div>
                <div>
                  <ValueSelector
                    fieldName={indicator.fieldName}
                    indicatorValues={indicatorValues}
                    value={indicator.fromValue}
                    base={indicatorsBase}
                    onChangeValue={onChangeFromValue}
                  />
                </div>
                <div className="tw-flex  tw-items-center tw-justify-center">
                  <p className="tw-m-0">à</p>
                </div>
                <div>
                  <ValueSelector
                    fieldName={indicator.fieldName}
                    indicatorValues={indicatorValues}
                    value={indicator.toValue}
                    base={indicatorsBase}
                    onChangeValue={onChangeToValue}
                  />
                </div>
                <div>
                  {!!selection.filter((_indicator) => Boolean(_indicator.fieldName)).length && (
                    <button
                      type="button"
                      className="tw-h-full tw-w-full tw-rounded tw-border tw-border-gray-300 tw-bg-white tw-text-red-500"
                      onClick={onRemoveFilter}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <div className="tw-flex tw-w-full">
          <button
            type="button"
            className={[
              "tw-h-full tw-rounded tw-text-main",
              "tw-hidden", // FIXME
              selection.find((f) => f.fieldName === null || f.toValue === null || f.fromValue === null) ? "tw-opacity-0" : "",
            ].join(" ")}
            onClick={onAddIndicator}
            // disabled={!!selection.find((f) => !f.fieldName)}
            disabled
          >
            + Ajouter un indicateur
          </button>
        </div>
      </div>
    </>
  );
};

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

interface ValueSelectorProps {
  fieldName: string | null;
  indicatorValues: Array<string>;
  value: any;
  onChangeValue: (newValue: any) => void;
  base: IndicatorsBase;
}

const ValueSelector = ({ fieldName, indicatorValues, value, onChangeValue, base }: ValueSelectorProps) => {
  const [comparator, setComparator] = useState<string | null>(null);
  if (!fieldName) return <></>;
  const current = base.find((field) => field.name === fieldName);
  if (!current) return <></>;
  const { type, name } = current;

  if (["number"].includes(type)) {
    return (
      <div className="-tw-mx-4 tw-flex tw-flex-wrap tw-items-center">
        <div
          className={[
            "tw-px-4",
            value?.comparator === "unfilled" ? "tw-basis-full" : "",
            value?.comparator === "between" ? "tw-basis-5/12" : "",
            !["unfilled", "between"].includes(value?.comparator) ? "tw-basis-1/2" : "",
          ].join(" ")}
        >
          <SelectCustom
            options={numberOptions}
            value={numberOptions.find((opt) => opt.value === value?.comparator)}
            isClearable={!value}
            onChange={(option) => {
              if (!option) return setComparator(null);
              setComparator(option.value);
              onChangeValue({ number: value?.number, comparator: option.value });
            }}
          />
        </div>
        {value?.comparator !== "unfilled" && (
          <div className={["tw-px-4", value?.comparator === "between" ? "tw-basis-3/12" : "tw-basis-1/2"].join(" ")}>
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
          options={indicatorValues.map((_value) => ({ label: _value, value: _value }))}
          value={{ label: value, value }}
          getOptionLabel={(f) => f.label}
          getOptionValue={(f) => f.value}
          onChange={(newValue) => onChangeValue(newValue?.value)}
          isClearable
        />
      );
      // eslint-disable-next-line no-empty
    } catch (_e) {}
    return null;
  }

  return (
    <SelectCustom
      options={indicatorValues.map((_value) => ({ label: _value, value: _value }))}
      value={value ? { label: value, value } : null}
      getOptionLabel={(f) => f.label}
      getOptionValue={(f) => f.value}
      onChange={(option) => onChangeValue(option?.value)}
      isClearable
    />
  );
};

export default EvolutiveStatsSelector;
