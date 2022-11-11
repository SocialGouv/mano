import { Badge } from 'reactstrap';
import React from 'react';

export default function ActionName({ action }) {
  return (
    <>
      <div>{action.name}</div>
      <div>
        {action.categories?.map((category) => (
          <Badge style={{ margin: '0 2px' }} color="info" key={category} data-test-id={action.name + category}>
            {category}
          </Badge>
        ))}
        {action.isConsultation && <small className="text-muted">{action.type}</small>}
      </div>
    </>
  );
}
