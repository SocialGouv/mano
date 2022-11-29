import { Badge } from 'reactstrap';
import React from 'react';
import { userState } from '../recoil/auth';
import { useRecoilValue } from 'recoil';
import { getConsultationField } from '../recoil/consultations';

export default function ActionName({ action: actionOrConsultation }) {
  const me = useRecoilValue(userState);
  return (
    <>
      <div>{!actionOrConsultation.isConsultation ? actionOrConsultation.name : getConsultationField(actionOrConsultation, 'name', me)}</div>
      <div>
        {actionOrConsultation.categories?.map((category) => (
          <Badge style={{ margin: '0 2px' }} color="info" key={category} data-test-id={actionOrConsultation.name + category}>
            {category}
          </Badge>
        ))}
        {!!actionOrConsultation.isConsultation && <small className="text-muted">{getConsultationField(actionOrConsultation, 'type', me)}</small>}
      </div>
    </>
  );
}
