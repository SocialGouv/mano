import React, { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import BubbleRow from '../../components/BubbleRow';
import { itemsGroupedByPersonSelector } from '../../recoil/selectors';

const GroupRow = ({ relation, onMorePress }) => {
  const { persons, description, createdAt, user } = relation;
  const allPersons = useRecoilValue(itemsGroupedByPersonSelector);
  const pseudo1 = useMemo(() => allPersons[persons[0]]?.name, [allPersons, persons]);
  const pseudo2 = useMemo(() => allPersons[persons[1]]?.name, [allPersons, persons]);

  return (
    <BubbleRow
      onMorePress={onMorePress}
      caption={`Entre: ${pseudo1} et ${pseudo2}\n\n${description}`}
      date={createdAt}
      user={user}
      group={true}
      metaCaption="Relation créée par"
    />
  );
};

export default GroupRow;
