import React, { useCallback, useEffect, useRef } from 'react';
import Sortable from 'sortablejs';
import styled from 'styled-components';
import { theme } from '../config';

const Table = ({ columns = [], data = [], rowKey, onRowClick, nullDisplay = '', className, title, noData, isSortable, onSort }) => {
  const gridRef = useRef(null);
  const sortableJsRef = useRef(null);
  // There was a bug where we can't add a field then re-order the list: `data` is not updated
  // in `onListChange` callack so the list is partial and re-order fails (or loose fields).
  // We have to use a Ref for data since data does not react inside `{ onEnd: onListChange }` and is in its old state.
  // The bug is fixed, via using one more Ref 😱 (a.k.a "this"-ish) that is updated on each data change.
  // In a near future we should either avoir using Refs or use https://github.com/SortableJS/react-sortablejs instead.
  // To discuss with @Arnaud.
  const dataRef = useRef(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const onListChange = useCallback(() => {
    onSort(
      [...gridRef.current.children].map((i) => i.dataset.key),
      dataRef.current
    );
  }, [onSort]);

  useEffect(() => {
    if (!!isSortable && !!data.length) {
      sortableJsRef.current = new Sortable(gridRef.current, {
        animation: 150,
        onEnd: onListChange,
      });
    }
  }, [onListChange, isSortable, data.length]);

  if (!data.length && noData) {
    return (
      <TableWrapper className={className}>
        <thead>
          {!!title && (
            <tr>
              <td className="title" colSpan={columns.length}>
                {title}
              </td>
            </tr>
          )}
          <tr>
            <td colSpan={columns.length}>{noData}</td>
          </tr>
        </thead>
      </TableWrapper>
    );
  }
  return (
    <TableWrapper className={className} withPointer={Boolean(onRowClick)} isSortable={isSortable}>
      <thead>
        {!!title && (
          <tr>
            <td className="title" colSpan={columns.length}>
              {title}
            </td>
          </tr>
        )}
        <tr>
          {columns.map((column) => {
            const { onSortBy, onSortOrder, sortBy, sortOrder, sortableKey, dataKey } = column;
            const onNameClick = () => onSortBy(sortableKey || dataKey);
            return (
              <td
                onClick={!!onSortBy ? onNameClick : null}
                className={`column-header ${column.left && 'align-left'} ${!!onSortBy && 'clickable'}`}
                key={column.title || dataKey}>
                <span>{column.title}</span>
                {(sortBy === sortableKey || sortBy === dataKey) && (
                  <>
                    {sortOrder === 'ASC' && <span onClick={() => onSortOrder('DESC')}>{`\u00A0\u2193`}</span>}
                    {sortOrder === 'DESC' && <span onClick={() => onSortOrder('ASC')}>{`\u00A0\u2191`}</span>}
                  </>
                )}
              </td>
            );
          })}
        </tr>
      </thead>
      <tbody ref={gridRef}>
        {data
          .filter((e) => e)
          .map((item) => {
            return (
              <tr onClick={() => (onRowClick ? onRowClick(item) : null)} key={item[rowKey] || item._id} data-key={item[rowKey] || item._id}>
                {columns.map((column) => {
                  return (
                    <td className={`table-cell ${!!column.small ? 'small' : 'not-small'}`} key={item[rowKey] + column.dataKey}>
                      {column.render ? column.render(item) : item[column.dataKey] || nullDisplay}
                    </td>
                  );
                })}
              </tr>
            );
          })}
      </tbody>
    </TableWrapper>
  );
};

const TableWrapper = styled.table`
  width: 100%;
  padding: 16px;
  background: ${theme.white};
  box-shadow: 0 4px 8px rgba(29, 32, 33, 0.02);
  border-radius: 8px;
  -fs-table-paginate: paginate;

  thead {
    display: table-header-group;
  }

  tr {
    height: 56px;
    border-radius: 4px;
    ${(props) => !props.withPointer && 'cursor: auto;'}
  }
  ${(props) =>
    props.isSortable &&
    `
  tbody > tr {
    cursor: move;
  }
  `}

  tbody > tr:nth-child(odd) {
    background-color: ${theme.black05};
  }

  tbody > tr:hover {
    background-color: ${theme.black25};
  }

  thead td {
    color: ${theme.main};

    font-weight: 800;
    font-size: 12px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  thead .title {
    caption-side: top;
    font-weight: bold;
    font-size: 24px;
    line-height: 32px;
    padding: 20px 0 10px 0;
    width: 100%;
    color: #1d2021;
    text-transform: none;
  }

  td {
    padding: 5px 0;
    /* padding-left: 20px; */
    font-size: 14px;
    &.small {
      min-width: 50px;
    }
    /* if not this class, there is a bug ! try it */
    &.not-small {
      min-width: 100px;
    }
  }

  .column-header {
    text-align: center;
    padding-left: 0;
    padding-right: 0;
  }

  .align-left {
    text-align: left;
  }

  .clickable {
    cursor: pointer;
  }

  .table-cell {
    text-align: center;
  }

  td:first-child {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
  }
  td:last-child {
    border-bottom-right-radius: 10px;
    border-top-right-radius: 10px;
  }
`;

export default Table;
