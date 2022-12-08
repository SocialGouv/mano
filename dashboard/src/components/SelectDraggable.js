import React, { useCallback, useEffect, useRef } from 'react';
import { components } from 'react-select';
import SortableJS from 'sortablejs';
import SelectCustom from './SelectCustom';

const SelectDraggable = ({ onChange, classNamePrefix, value, ...props }) => {
  const onDragAndDrop = useCallback(async () => {
    const grid = gridRef.current;
    const items = grid.querySelectorAll(`.${classNamePrefix}__multi-value__label`);
    const newValue = [];
    for (const item of items) {
      newValue.push(value.find((_item) => _item.label === item.innerText));
    }
    onChange(newValue);
  }, [classNamePrefix, onChange, value]);

  const gridRef = useRef(null);
  const sortableRef = useRef(null);
  useEffect(() => {
    gridRef.current = document.querySelector(`.${classNamePrefix}__value-container--is-multi`);
    gridRef.current.lastChild.classList.add('not-draggable'); // this is the input {classNamePrefix}__input-container
    sortableRef.current = SortableJS.create(gridRef.current, {
      animation: 150,
      group: classNamePrefix,
      onEnd: onDragAndDrop,
    });
  }, [props.options, props.value, onDragAndDrop, classNamePrefix]);

  return (
    <SelectCustom
      components={{
        MultiValueLabel: (props) => {
          return (
            <components.MultiValueLabel
              {...props}
              innerProps={{
                ...props.innerProps,
                onMouseDown: (e) => {
                  e.stopPropagation();
                },
                className: `${props.innerProps.className} tw-cursor-move`,
              }}
            />
          );
        },
      }}
      classNamePrefix={classNamePrefix}
      onChange={onChange}
      value={value}
      {...props}
      isMulti
    />
  );
};

export default SelectDraggable;
