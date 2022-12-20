import React, { useCallback, useEffect, useRef } from 'react';
import Sortable from 'sortablejs';
import styled from 'styled-components';
import { theme } from '../config';

const Table = ({
  columns = [],
  data = [],
  rowKey,
  dataTestId = null,
  onRowClick,
  rowDisabled = () => false,
  nullDisplay = '',
  className,
  title,
  noData,
  isSortable,
  onSort,
}) => {
  const gridRef = useRef(null);
  const sortableJsRef = useRef(null);

  const onListChange = useCallback(() => {
    if (!isSortable) return;
    const newOrder = [...gridRef.current.children].map((i) => i.dataset.key);
    onSort(newOrder, data);
  }, [onSort, data, isSortable]);

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
          {columns.map((column) => {
            const { onSortBy, onSortOrder, sortBy, sortOrder, sortableKey, dataKey } = column;
            const onNameClick = () => {
              if (sortBy === sortableKey || sortBy === dataKey) {
                onSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
                return;
              }
              onSortBy(sortableKey || dataKey);
            };
            return (
              <td
                onClick={!!onSortBy ? onNameClick : null}
                className={!!onSortBy ? 'tw-cursor-pointer' : 'tw-cursor-default'}
                style={column.style || {}}
                key={String(dataKey) + String(column.title)}>
                <span>{column.title}</span>
                {(sortBy === sortableKey || sortBy === dataKey) && (
                  <>
                    {sortOrder === 'ASC' && <span className="tw-mx-4" onClick={() => onSortOrder('DESC')}>{`\u00A0\u2193`}</span>}
                    {sortOrder === 'DESC' && <span className="tw-mx-4" onClick={() => onSortOrder('ASC')}>{`\u00A0\u2191`}</span>}
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
              <tr
                onClick={() => (!rowDisabled(item) && onRowClick ? onRowClick(item) : null)}
                key={item[rowKey] || item._id}
                data-key={item[rowKey] || item._id}
                data-test-id={item[dataTestId] || item[rowKey] || item._id}
                className={[
                  rowDisabled(item)
                    ? 'tw-cursor-not-allowed'
                    : isSortable
                    ? 'tw-cursor-move'
                    : Boolean(onRowClick)
                    ? 'tw-cursor-pointer'
                    : 'tw-cursor-auto',
                ].join(' ')}
                style={item.style || {}}>
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
  -fs-table-paginate: paginate;

  thead {
    display: table-header-group;
  }

  thead tr {
    height: 2.5rem;
  }

  tbody {
    box-shadow: 0 4px 8px rgba(29, 32, 33, 0.05);
  }

  tr {
    height: 3.5rem;
  }

  tbody > tr:nth-child(odd) {
    background-color: ${theme.black05};
  }

  tbody > tr:hover {
    background-color: ${theme.black25};
  }

  thead td {
    color: ${theme.main};
    text-align: left;
    padding: 0.5rem 0.5rem;
    font-weight: 600;
    font-size: 12px;
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

  tbody td {
    padding: 0.25rem 0.5rem;
    font-size: 14px;
  }
  td {
    &.small {
      min-width: 50px;
    }
    /* if not this class, there is a bug ! try it */
    &.not-small {
      min-width: 100px;
    }
    &:not(:last-of-type) {
      border-right: 1px solid #dddddd55;
    }
  }

  tbody > tr:last-child {
    td:first-child {
      border-bottom-left-radius: 10px;
    }
    td:last-child {
      border-bottom-right-radius: 10px;
    }
  }
`;

export default Table;
