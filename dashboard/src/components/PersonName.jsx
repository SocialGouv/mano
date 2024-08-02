import React from "react";
import { useHistory } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { personsObjectSelector } from "../recoil/selectors";
import { dayjsInstance, formatAge } from "../services/date";

export function getPersonInfo(person) {
  let infos = [];
  if (person?.birthdate) {
    infos.push(`Âge : ${formatAge(person?.birthdate)} (${dayjsInstance(person.birthdate).format("DD/MM/YYYY")})`);
  }
  infos.push(`Genre : ${person.gender ?? ""}`);
  infos.push(`Suivi·e depuis le : ${dayjsInstance(person.followedSince || person.createdAt).format("DD/MM/YYYY")}`);
  if (person.wanderingAt) {
    infos.push(`En rue depuis le : ${dayjsInstance(person.wanderingAt).format("DD/MM/YYYY")}`);
  }
  if (person.phone) {
    infos.push(`Téléphone : ${person.phone}`);
  }
  if (person.email) {
    infos.push(`Email : ${person.email}`);
  }
  return infos.join("\n");
}

export default function PersonName({ item, onClick = null, redirectToTab = "Résumé" }) {
  const history = useHistory();
  const persons = useRecoilValue(personsObjectSelector);
  const person = item?.personPopulated ?? persons[item.person];

  return (
    <span
      className="hover:tw-cursor-zoom-in hover:tw-bg-yellow-400 my-tooltip"
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) return onClick();
        if (item.person) history.push(`/person/${item.person}?tab=${redirectToTab}`);
      }}
      data-tooltip={getPersonInfo(person)}
    >
      {person?.name}
      {person?.otherNames ? <em className="tw-inline tw-text-main"> - {person?.otherNames}</em> : null}
    </span>
  );
}
