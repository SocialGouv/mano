import { Badge } from 'reactstrap';
import React from 'react';
import { userState } from '../recoil/auth';
import { useRecoilValue } from 'recoil';
import { disableConsultationRow } from '../recoil/consultations';

export default function ActionName({ action: actionOrConsultation }) {
  const me = useRecoilValue(userState);
  return (
    <>
      <div>{disableConsultationRow(actionOrConsultation, me) ? '' : actionOrConsultation.name}</div>
      <div>
        {actionOrConsultation.categories?.map((category) => (
          <Badge style={{ margin: '0 2px' }} color="info" key={category} data-test-id={actionOrConsultation.name + category}>
            {category}
          </Badge>
        ))}
        {!!actionOrConsultation.isConsultation && (
          <small className="text-muted">{disableConsultationRow(actionOrConsultation, me) ? '' : actionOrConsultation.type}</small>
        )}
      </div>
    </>
  );
}
