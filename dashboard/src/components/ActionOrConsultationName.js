import { Badge } from 'reactstrap';
import React from 'react';
import { userState } from '../recoil/auth';
import { useRecoilValue } from 'recoil';
import { disableConsultationRow } from '../recoil/consultations';

export default function ActionOrConsultationName({ item }) {
  const me = useRecoilValue(userState);
  if (disableConsultationRow(item, me)) return <div />;
  return (
    <>
      <div>{item.name}</div>
      <div>
        {item.categories?.map((category) => (
          <Badge style={{ margin: '0 2px' }} color="info" key={category} data-test-id={item.name + category}>
            {category}
          </Badge>
        ))}
        {!!item.isConsultation && <small className="text-muted">{item.type}</small>}
      </div>
    </>
  );
}
