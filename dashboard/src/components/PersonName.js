import React from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router';
import { useRecoilValue } from 'recoil';
import { personsState } from '../recoil/persons';

export default function PersonName({ item, redirectToTab = 'résumé' }) {
  const history = useHistory();
  const persons = useRecoilValue(personsState);
  const personName = item?.personPopulated?.name || persons.find((p) => p._id === item.person)?.name;
  return (
    <BoldOnHover
      onClick={(e) => {
        e.stopPropagation();
        if (item.person) history.push(`/person/${item.person}?tab=${redirectToTab}`);
      }}>
      {personName}
    </BoldOnHover>
  );
}

const BoldOnHover = styled.span`
  &:hover {
    background-color: yellow;
    cursor: zoom-in;
  }
`;
