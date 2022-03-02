import React, { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Sortable from 'sortablejs';
import { theme } from '../config';

const SortableGrid = ({ list, onUpdateList, onRemoveItem }) => {
  const gridRef = useRef(null);
  const sortableJsRef = useRef(null);

  const onListChange = useCallback(() => {
    onUpdateList([...gridRef.current.children].map((i) => i.dataset.content));
  }, [onUpdateList]);

  useEffect(() => {
    sortableJsRef.current = new Sortable(gridRef.current, {
      animation: 150,
      onEnd: onListChange,
    });
  }, [onListChange]);

  return (
    <SortableContainer ref={gridRef}>
      {list.map((content) => (
        <Item key={content} data-content={content} className="grid-square">
          <span>{content}</span>
          <button onClick={() => onRemoveItem(content)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </Item>
      ))}
    </SortableContainer>
  );
};

const SortableContainer = styled.div`
  max-width: 100%;
  box-sizing: border-box;
  flex-grow: 1;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
`;

const Item = styled.div`
  background-color: rgb(255, 255, 255);
  color: rgb(33, 37, 41);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.25rem;
  width: 12.5rem;
  height: 3.5rem;
  position: relative;
  span {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    background-color: ${theme.main}22;
    padding: 0.25rem;
    text-align: center;
  }
  button {
    display: none;
    border: none;
    position: absolute;
    top: 5px;
    right: 5px;
    padding: 0;
    margin: 0;
    width: 1rem;
    height: 1rem;
    background: none;
    line-height: 1rem;
  }
  svg {
    line-height: 1rem;
    width: 1rem;
    height: 1rem;
  }
  &:hover button {
    display: block;
  }
`;

export default SortableGrid;
