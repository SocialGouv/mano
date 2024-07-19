import Pagination from "react-js-pagination";

const Page = ({ page = 0, limit = 20, total = 0, onChange = (_args: { page: number }) => {} }) => (
  <div className="tw-mt-3 tw-mb-2 tw-flex tw-flex-row tw-items-center">
    <Pagination
      itemClass="page-item"
      linkClass="page-link"
      innerClass="pagination !tw-mb-0"
      activePage={page + 1}
      itemsCountPerPage={limit}
      totalItemsCount={total}
      pageRangeDisplayed={5}
      onChange={(page: number) => onChange({ page: page - 1 })}
    />
    <i className="tw-opacity-50 tw-ml-2">(Total: {total})</i>
  </div>
);

export default Page;
