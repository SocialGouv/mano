import React from 'react';
import styled from 'styled-components';
import { theme } from '../config';

const Table = ({ columns = [], data = [], rowKey, onRowClick, nullDisplay = '' }) => {
  return (
    <TableWrapper>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <td key={column.title}>{column.title}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((i) => {
            return (
              <tr onClick={() => onRowClick(i)} key={i[rowKey]}>
                {columns.map((column) => (
                  <td key={i[rowKey] + i[column.dataKey]}>{column.render ? column.render(i) : i[column.dataKey] || nullDisplay}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableWrapper>
  );
};

const TableWrapper = styled.div`
  width: 100%;
  padding: 16px;
  background: ${theme.white};
  box-shadow: 0px 4px 8px rgba(29, 32, 33, 0.02);
  border-radius: 8px;

  table {
    width: 100%;

    tr {
      height: 56px;
      border-radius: 4px;
    }

    tbody > tr:nth-child(odd) {
      background-color: ${theme.black05};
    }

    tbody > tr:hover {
      background-color: ${theme.black25};
    }

    td {
      padding: 5px 0;
      padding-left: 20px;
      font-size: 14px;
    }

    td:first-child {
      border-top-left-radius: 10px;
      border-bottom-left-radius: 10px;
    }
    td:last-child {
      border-bottom-right-radius: 10px;
      border-top-right-radius: 10px;
    }

    thead td {
      color: ${theme.main};

      font-weight: 800;
      font-size: 12px;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
  }
`;

export default Table;
