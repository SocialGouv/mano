import { Badge } from 'reactstrap';
import React from 'react';
import { userState } from '../recoil/auth';
import { useRecoilValue } from 'recoil';
import { getConsultationField } from '../recoil/consultations';

export default function ActionName({ action }) {
  const me = useRecoilValue(userState);
  console.log({ action });
  return (
    <>
      <div>{!action?.isConsultation ? action?.name : getConsultationField(action, 'name', me)}</div>
      <div>
        {action?.categories?.map((category) => (
          <Badge style={{ margin: '0 2px' }} color="info" key={category} data-test-id={action.name + category}>
            {category}
          </Badge>
        ))}
        {!!action?.isConsultation && <small className="text-muted">{getConsultationField(action, 'type', me)}</small>}
      </div>
    </>
  );
}
