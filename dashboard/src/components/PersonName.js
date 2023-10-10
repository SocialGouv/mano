import React from 'react';
import { useHistory } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { personsObjectSelector } from '../recoil/selectors';

export default function PersonName({ item, onClick = null, redirectToTab = 'Résumé' }) {
  const history = useHistory();
  const persons = useRecoilValue(personsObjectSelector);
  // TODO: enquêter pourquoi certaines personnes sont undefined.
  // cf: MANO-16A sur sentry. On ne le remarquait pas avant à cause du "?" mais c'est antérieur.
  const person = item?.personPopulated ?? persons[item.person];
  return (
    <span
      className="hover:tw-cursor-zoom-in hover:tw-bg-yellow-400"
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) return onClick();
        if (item.person) history.push(`/person/${item.person}?tab=${redirectToTab}`);
      }}>
      {person?.name}
      {person?.otherNames ? <small className="tw-text-main75"> - {person?.otherNames}</small> : null}
    </span>
  );
}
