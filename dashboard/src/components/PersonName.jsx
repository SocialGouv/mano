import React from "react";
import { useHistory } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { personsObjectSelector } from "../recoil/selectors";

export default function PersonName({ item, onClick = null, redirectToTab = "Résumé", disabled = false }) {
  const history = useHistory();
  const persons = useRecoilValue(personsObjectSelector);
  const person = item?.personPopulated ?? persons[item.person];
  return (
    <span
      className={disabled ? "" : "hover:tw-cursor-zoom-in hover:tw-bg-yellow-400"}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) return;
        if (onClick) return onClick();
        if (item.person) history.push(`/person/${item.person}?tab=${redirectToTab}`);
      }}
    >
      {person?.name}
      {person?.otherNames ? <em className="tw-inline tw-text-main"> - {person?.otherNames}</em> : null}
    </span>
  );
}
