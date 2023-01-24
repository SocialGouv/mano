import React from 'react';
import SelectCustom from './SelectCustom';
import DatePicker from 'react-datepicker';
import { dayjsInstance, isOnSameDay } from '../services/date';

export const filterData = (data, filters, returnWholeArray = false) => {
  if (!!filters?.filter((f) => Boolean(f?.value)).length) {
    for (let filter of filters) {
      if (!filter.field || !filter.value) continue;
      data = data
        .map((item, index) => {
          const itemValue = item[filter.field];
          if (['number'].includes(filter.type)) {
            const { number, number2, comparator } = filter.value;
            if (comparator === 'unfilled') return !itemValue || [null, undefined].includes(itemValue) ? item : null;
            if (!itemValue || [null, undefined].includes(itemValue)) return null;
            if (comparator === 'between') {
              if (Number(number) < Number(number2)) {
                return Number(itemValue) >= Number(number) && Number(itemValue) <= Number(number2) ? item : null;
              } else {
                return Number(itemValue) >= Number(number2) && Number(itemValue) <= Number(number) ? item : null;
              }
            }
            if (comparator === 'equals') return Number(itemValue) === Number(number) ? item : null;
            if (comparator === 'lower') return Number(itemValue) < Number(number) ? item : null;
            if (comparator === 'greater') return Number(itemValue) > Number(number) ? item : null;
          }
          if (['boolean'].includes(filter.type)) {
            if (filter.value === 'Oui' && !!itemValue) return item;
            if (filter.value === 'Non' && !itemValue) return item;
            return null;
          }
          if (['date-with-time', 'date'].includes(filter.type)) {
            const { date, comparator } = filter.value;
            if (comparator === 'unfilled') return !itemValue ? item : null;
            if (!itemValue || [null, undefined].includes(itemValue)) return null;
            if (comparator === 'before') return dayjsInstance(itemValue).isBefore(date) ? item : null;
            if (comparator === 'after') return dayjsInstance(itemValue).isAfter(date) ? item : null;
            if (comparator === 'equals') return isOnSameDay(itemValue, date) ? item : null;
          }
          if (!itemValue || [null, undefined].includes(itemValue)) return filter.value === 'Non renseigné' ? item : null;
          if (typeof itemValue === 'boolean') {
            return itemValue === (filter.value === 'Oui') ? item : null;
          }

          if (typeof itemValue === 'string') {
            // For type text we trim and lower case the value.
            if (
              filter.type === 'text' &&
              (itemValue || '')
                .trim()
                .toLowerCase()
                .includes((filter.value || '').trim().toLowerCase())
            )
              return item;
            if (itemValue === filter.value) return item;
            return null;
          }
          // type is array
          if (!itemValue.length && filter.value === 'Non renseigné') return item;
          if (itemValue?.includes?.(filter.value)) {
            if (returnWholeArray) return item;
            let newValues = itemValue.filter((value) => value !== filter.value);
            if (!newValues.length) newValues = ['Uniquement'];
            return {
              ...item,
              [filter.field]: newValues,
            };
          }
          return null;
        })
        .filter(Boolean);
    }
  }
  return data;
};

const Filters = ({ onChange, base, filters, title = 'Filtres :', saveInURLParams = false }) => {
  filters = !!filters.length ? filters : [{ field: null, type: null, value: null }];
  const onAddFilter = () => onChange([...filters, {}], saveInURLParams);
  const filterFields = base.filter((_filter) => _filter.field !== 'alertness').map((f) => ({ label: f.label, field: f.field, type: f.type }));

  function getFilterValuesByField(field, base, index) {
    if (!field) return [];
    const current = base.find((filter) => filter.field === field);
    if (!current) {
      onChange(
        filters.filter((_f, i) => i !== index),
        saveInURLParams
      );
      return [];
    }
    if (['yes-no'].includes(current.type)) return ['Oui', 'Non', 'Non renseigné'];
    if (['boolean'].includes(current.type)) return ['Oui', 'Non'];
    if (current?.field === 'outOfActiveList') return current.options;
    if (current?.options?.length) return [...current?.options, 'Non renseigné'];
    return ['Non renseigné'];
  }

  return (
    <div className="border-b tw-z-50 tw-mb-8 tw-flex tw-w-full tw-justify-center tw-self-center tw-border-gray-300 tw-pb-4">
      <div className="tw-w-full">
        <div className="tw-flex tw-flex-wrap">
          <div className="tw-basis-5/6">
            <p className="tw-m-0">{title}</p>
          </div>
          <div className="tw-basis-1/6 tw-pl-8">
            <button
              type="button"
              className="tw-h-full tw-w-full tw-rounded tw-border tw-border-gray-300 tw-bg-white tw-text-main disabled:tw-opacity-20"
              onClick={onAddFilter}
              disabled={filters.find((f) => !f.field)}>
              + Ajouter
              <br />
              un filtre
            </button>
          </div>
        </div>
        {filters.map((filter, index) => {
          // filter: field, value, type
          const filterValues = getFilterValuesByField(filter.field, base, index);
          const onChangeField = (newField) => {
            onChange(
              filters.map((_filter, i) => (i === index ? { field: newField?.field, value: null, type: newField?.type } : _filter)),
              saveInURLParams
            );
          };
          const onChangeValue = (newValue) => {
            onChange(
              filters.map((f, i) => (i === index ? { field: filter.field, value: newValue, type: filter.type } : f)),
              saveInURLParams
            );
          };
          const onRemoveFilter = () => {
            onChange(
              filters.filter((_f, i) => i !== index),
              saveInURLParams
            );
          };

          return (
            <div className="-tw-mx-4 tw-mb-2.5 tw-flex tw-flex-wrap" key={`${filter.field || 'empty'}${index}`}>
              <div className="tw-basis-1/3 tw-px-4">
                <SelectCustom
                  options={filterFields}
                  value={filter.field ? filter : null}
                  onChange={onChangeField}
                  getOptionLabel={(_option) => filterFields.find((_filter) => _filter.field === _option.field)?.label}
                  getOptionValue={(_option) => _option.field}
                  isClearable={true}
                  isMulti={false}
                />
              </div>
              <div className="tw-basis-1/3 tw-px-4">
                <ValueSelector field={filter.field} filterValues={filterValues} value={filter.value} base={base} onChangeValue={onChangeValue} />
              </div>
              <div className="tw-basis-1/6 tw-pl-4">
                {!!filters.filter((_filter) => Boolean(_filter.field)).length && (
                  <button
                    type="button"
                    className="tw-h-full tw-w-full tw-rounded tw-border tw-border-gray-300 tw-bg-white tw-text-red-500"
                    onClick={onRemoveFilter}>
                    Retirer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const dateOptions = [
  {
    label: 'Avant',
    value: 'before',
  },
  {
    label: 'Après',
    value: 'after',
  },
  {
    label: 'Date exacte',
    value: 'equals',
  },
  {
    label: 'Non renseigné',
    value: 'unfilled',
  },
];

const numberOptions = [
  {
    label: 'Inférieur à',
    value: 'lower',
  },
  {
    label: 'Supérieur à',
    value: 'greater',
  },
  {
    label: 'Égal à',
    value: 'equals',
  },
  {
    label: 'Entre',
    value: 'between',
  },
  {
    label: 'Non renseigné',
    value: 'unfilled',
  },
];

const ValueSelector = ({ field, filterValues, value, onChangeValue, base }) => {
  const [comparator, setComparator] = React.useState(null);
  if (!field) return <></>;
  const current = base.find((filter) => filter.field === field);
  if (!current) return <></>;
  const { type, field: name } = current;

  if (['text', 'textarea'].includes(type)) {
    return (
      <input
        name={name}
        className="tailwindui !tw-mt-0"
        type="text"
        value={value || ''}
        onChange={(e) => {
          e.preventDefault();
          onChangeValue(e.target.value);
        }}
      />
    );
  }

  if (['date-with-time', 'date'].includes(type)) {
    return (
      <div className="-tw-mx-4 tw-flex tw-flex-wrap">
        <div className={['tw-px-4', value?.comparator !== 'unfilled' ? 'tw-basis-1/2' : 'tw-basis-full'].join(' ')}>
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
        {value?.comparator !== 'unfilled' && (
          <div className="tw-basis-1/2 tw-px-4">
            <DatePicker
              locale="fr"
              dateFormat="dd/MM/yyyy"
              className="form-control"
              name={name}
              selected={value?.date ? new Date(value?.date) : null}
              onChange={(date) => onChangeValue({ date, comparator })}
            />
          </div>
        )}
      </div>
    );
  }

  if (['number'].includes(type)) {
    return (
      <div className="-tw-mx-4 tw-flex tw-flex-wrap">
        <div
          className={[
            'tw-px-4',
            value?.comparator === 'unfilled' ? 'tw-basis-full' : '',
            value?.comparator === 'between' ? 'tw-basis-5/12' : '',
            !['unfilled', 'between'].includes(value?.comparator) ? 'tw-basis-1/2' : '',
          ].join(' ')}>
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
        {value?.comparator !== 'unfilled' && (
          <div className={['tw-px-4', value?.comparator === 'between' ? 'tw-basis-3/12' : 'tw-basis-1/2'].join(' ')}>
            <input
              name={name}
              className="tailwindui !tw-mt-0"
              type="number"
              min="0"
              value={value?.number || ''}
              onChange={(e) => {
                onChangeValue({ number: e.target.value, number2: value?.number2, comparator });
              }}
            />
          </div>
        )}
        {value?.comparator === 'between' && (
          <>
            {/* we have an input here, just for styling purpose, to have 'et' aligned with number and number2 */}
            <input className="tailwindui !tw-mt-0 tw-basis-1/12 !tw-border-0 !tw-bg-transparent !tw-shadow-none" disabled defaultValue="et" />
            <div className="tw-basis-3/12 tw-px-4">
              <input
                name={name}
                className="tailwindui !tw-mt-0"
                type="number"
                min="0"
                value={value?.number2 || ''}
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

  return (
    <SelectCustom
      options={filterValues.map((_value) => ({ label: _value, value: _value }))}
      value={value ? { label: value, value } : null}
      getOptionLabel={(f) => f.label}
      getOptionValue={(f) => f.value}
      onChange={(f) => onChangeValue(f.value)}
      isClearable={!value}
    />
  );
};

export default Filters;
