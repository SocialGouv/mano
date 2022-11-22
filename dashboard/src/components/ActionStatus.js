import { Badge } from 'reactstrap';
import React from 'react';
import { DONE, TODO, CANCEL } from '../recoil/actions';

const ActionStatus = ({ status }) => {
  if (status === TODO)
    return (
      <Badge color="danger" pill="true">
        {status}
      </Badge>
    );
  if (status === DONE)
    return (
      <Badge color="success" pill="true">
        {status}
      </Badge>
    );
  if (status === CANCEL)
    return (
      <Badge color="info" pill="true">
        {status}
      </Badge>
    );
  return <div />;
};

export default ActionStatus;
