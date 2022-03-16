import React from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router';
import { useRecoilValue } from 'recoil';
import { personsState } from '../recoil/persons';

export default function ActionPersonName({ item }) {
  const history = useHistory();
  const persons = useRecoilValue(personsState);
  const personName = persons.find((p) => p._id === item.person)?.name;
  return (
    <BoldOnHover
      onClick={(e) => {
        e.stopPropagation();
        if (item.person) history.push(`/person/${item.person}`);
      }}>
      {personName}
    </BoldOnHover>
  );
}

const BoldOnHover = styled.span`
  &:hover {
    font-weight: bold;
    cursor: zoom-in;
  }
`;
