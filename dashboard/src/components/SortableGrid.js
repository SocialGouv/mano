import React, { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Sortable from 'sortablejs';

const SortableGrid = ({ list, onUpdateList }) => {
  const gridRef = useRef(null);
  const sortableJsRef = useRef(null);

  const onListChange = useCallback(() => {
    onUpdateList([...gridRef.current.children].map((i) => i.dataset.content));
  }, [onUpdateList]);

  useEffect(() => {
    console.log('inside effect');
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
        </Item>
      ))}
    </SortableContainer>
  );
};

const SortableContainer = styled.div`
  max-width: 100%;
  box-sizing: border-box;
  flex-basis: 0px;
  flex-grow: 1;
  overflow-y: auto;
  position: relative;

  background-color: #f5ddc9;

  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-row-gap: 24px;

  line-height: 24px;
  padding: 2%;
`;

const Item = styled.div`
  background-color: rgb(255, 255, 255);
  color: rgb(33, 37, 41);
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  align-self: center;
  justify-self: center;
  font-family: 'Helvetica Neue', Helvetica, Arial;
  font-size: 16px;
  font-weight: normal;
  height: 100px;
  width: 100px;
`;

export default SortableGrid;
