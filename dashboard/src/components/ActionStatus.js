import { Badge } from 'reactstrap';
import React from 'react';
import { DONE, TODO, CANCEL } from '../contexts/actions';

const ActionStatus = ({ status }) => {
  if (status === TODO) return <Badge color="danger">{status}</Badge>;
  if (status === DONE) return <Badge color="success">{status}</Badge>;
  if (status === CANCEL) return <Badge color="info">{status}</Badge>;
  return <div />;
};

export default ActionStatus;
