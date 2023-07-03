import React from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router';
import { useRecoilValue } from 'recoil';
import { personsObjectSelector } from '../recoil/selectors';

export default function PersonName({ item, onClick, redirectToTab = 'Résumé' }) {
  const history = useHistory();
  const persons = useRecoilValue(personsObjectSelector);
  const personName = item?.personPopulated?.name || persons[item.person]?.name;
  return (
    <BoldOnHover
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) return onClick();
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
