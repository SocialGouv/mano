import { useEffect } from "react";
import { useRecoilValue } from "recoil";
import { teamsState } from "../recoil/auth";

export default function ColorHeaderBand({ teamId }) {
  const teams = useRecoilValue(teamsState);
  const teamIndex = teams?.findIndex((t) => t._id === teamId);
  const team = teams[teamIndex];
  const color = teamsColors[teamIndex % teamsColors?.length];
  const backgroundColor = `${color}CC`;

  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    metaThemeColor.setAttribute("content", color);
  }, [color]);

  if (!team) return null;

  return <div key={team?._id} style={{ backgroundColor, borderColor: color }} className="tw-border tw-py-0.5" />;
}

const teamsColors = [
  "#255C99",
  "#74776B",
  "#00C6A5",
  "#FF4B64",
  "#EF798B",
  "#A066FF",
  "#00E6D6",
  "#124660",
  "#FF4F38",
  "#1B9476",
  "#4DBAC7",
  "#FFA500",
  "#E392DB",
  "#28A428",
  "#F5C000",
];
