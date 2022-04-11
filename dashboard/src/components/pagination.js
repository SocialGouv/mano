import React from 'react';
import Pagination from 'react-js-pagination';
import { Col, Row } from 'reactstrap';

const Page = ({ page = 0, limit = 20, total = 0, onChange = () => null }) => (
  <Row>
    <Col md={12} style={{ marginTop: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '1rem' }}>
        <Pagination
          itemClass="page-item"
          linkClass="page-link"
          activePage={parseInt(page) + 1}
          itemsCountPerPage={parseInt(limit)}
          totalItemsCount={parseInt(total)}
          pageRangeDisplayed={5}
          onChange={(page) => onChange({ limit, total, page: page - 1 })}
        />
        <i style={{ marginLeft: '1rem', marginBottom: '1rem', opacity: 0.5 }}>(Total: {total})</i>
      </div>
    </Col>
  </Row>
);

export default Page;
