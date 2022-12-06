import React from 'react';
import { userState } from '../recoil/auth';
import { useRecoilValue } from 'recoil';
import { disableConsultationRow } from '../recoil/consultations';

const getName = (item) => {
  if (item.name) return item.name;
  if (!item.isConsultation) return 'Action'; // should never happen
  return `Consultation ${item.type}`;
};

export default function ActionOrConsultationName({ item }) {
  const me = useRecoilValue(userState);
  if (disableConsultationRow(item, me)) return <div />;
  return (
    <>
      <div>{getName(item)}</div>
      <div>
        {item.categories?.map((category) => (
          <span
            className="tw-whitespace-no-wrap tw-my-0 tw-mx-0.5 tw-inline-block tw-rounded tw-bg-main75 tw-py-0.5 tw-px-1 tw-text-center tw-align-baseline tw-text-[10.5px] tw-font-bold tw-leading-none tw-text-white"
            color="info"
            key={category}
            data-test-id={item.name + category}>
            {category}
          </span>
        ))}
        {!!item.isConsultation && <small className="text-muted">{item.type}</small>}
      </div>
    </>
  );
}
