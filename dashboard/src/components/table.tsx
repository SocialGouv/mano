import { useCallback, useEffect, useRef } from "react";
import Sortable from "sortablejs";
import useMinimumWidth from "../services/useMinimumWidth";

interface RootItem {
  _id?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date;
  organisation?: string;
}

interface TableProps<T extends RootItem> {
  columns?: {
    title: string;
    dataKey: string;
    sortableKey?: string;
    onSortBy?: (key: string) => void;
    onSortOrder?: (order: "ASC" | "DESC") => void;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    className?: string;
    style?: React.CSSProperties;
    help?: React.ReactNode;
    render?: (item: T) => React.ReactNode;
    small?: boolean;
  }[];
  data?: T[];
  rowKey: string;
  dataTestId?: string;
  onRowClick?: (item: T) => void;
  rowDisabled?: (item: T) => boolean;
  nullDisplay?: string;
  className?: string;
  title?: string;
  noData?: string;
  isSortable?: boolean;
  onSort?: (newOrder: string[], data: T[]) => void;
  renderCellSmallDevices?: (item: T) => React.ReactNode;
}

const Table = <T extends { [key: string]: any } & RootItem>({
  columns = [],
  data = [],
  rowKey,
  dataTestId = null,
  onRowClick = null,
  rowDisabled = () => false,
  nullDisplay = "",
  className,
  title = "",
  noData,
  isSortable = false,
  onSort = (_newOrder, _data) => null,
  renderCellSmallDevices = null,
}: TableProps<T>) => {
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

  const isDesktop = useMinimumWidth("sm");

  if (!data.length && noData) {
    return (
      <table className={[className, "table-selego"].join(" ")}>
        <thead>
          {!!title && (
            <tr>
              <td className="title" colSpan={columns.length}>
                {title}
              </td>
            </tr>
          )}
          <tr>
            <td colSpan={columns.length}>
              <p className="tw-m-0 tw-mb-5 tw-text-center">{noData}</p>
            </td>
          </tr>
        </thead>
      </table>
    );
  }

  if (isDesktop || !renderCellSmallDevices) {
    return (
      <table className={[className, "table-selego"].join(" ")}>
        <thead className="tw-hidden sm:tw-table-header-group">
          {!!title && (
            <tr>
              <td tabIndex={0} aria-label={title} className="title" colSpan={columns.length}>
                {title}
              </td>
            </tr>
          )}
          <tr>
            {columns.map((column) => {
              const { onSortBy, onSortOrder, sortBy, sortOrder, sortableKey, dataKey } = column;
              const onNameClick = () => {
                if (sortBy === sortableKey || sortBy === dataKey) {
                  onSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
                  return;
                }
                onSortBy(sortableKey || dataKey);
              };
              return (
                <td
                  className={["tw-whitespace-nowrap", column.className || "", onSortBy ? "tw-cursor-pointer" : "tw-cursor-default"].join(" ")}
                  style={column.style || {}}
                  key={String(dataKey) + String(column.title)}
                >
                  <button aria-label="Changer l'ordre de tri" type="button" onClick={onSortBy ? onNameClick : null}>
                    {column.title}
                  </button>
                  {column.help && <>{column.help}</>}
                  {!!onSortBy && (sortBy === sortableKey || sortBy === dataKey) && (
                    <button onClick={onSortBy ? onNameClick : null} type="button" aria-label="Changer l'ordre de tri">
                      {sortOrder === "ASC" && <span className="tw-mx-1" onClick={() => onSortOrder("DESC")}>{`\u00A0\u2193`}</span>}
                      {sortOrder === "DESC" && <span className="tw-mx-1" onClick={() => onSortOrder("ASC")}>{`\u00A0\u2191`}</span>}
                    </button>
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
                  onKeyUp={(event) => {
                    if (event.key === "Enter")
                      if (!rowDisabled(item) && onRowClick) {
                        onRowClick(item);
                      }
                  }}
                  key={item[rowKey] || item._id}
                  data-key={item[rowKey] || item._id}
                  data-test-id={item[dataTestId] || item[rowKey] || item._id}
                  tabIndex={0}
                  className={[
                    rowDisabled(item) ? "tw-cursor-not-allowed" : isSortable ? "tw-cursor-move" : onRowClick ? "tw-cursor-pointer" : "tw-cursor-auto",
                  ].join(" ")}
                  style={item.style || {}}
                >
                  {columns.map((column) => {
                    return (
                      <td className={([column.className || ""].join(" "), column.small ? "small" : "not-small")} key={item[rowKey] + column.dataKey}>
                        {column.render ? column.render(item) : item[column.dataKey] || nullDisplay}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
        </tbody>
      </table>
    );
  }

  return (
    <table>
      <tbody ref={gridRef}>{data.filter((e) => e).map(renderCellSmallDevices)}</tbody>
    </table>
  );
};

export default Table;
