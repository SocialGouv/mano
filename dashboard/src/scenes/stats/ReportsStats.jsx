import React from "react";
import { CustomResponsivePie } from "./charts";
import { getPieData } from "./utils";
import { organisationState } from "../../recoil/auth";
import { useRecoilValue } from "recoil";

const ReportsStats = ({ reports }) => {
  const organisation = useRecoilValue(organisationState);
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des comptes-rendus</h3>
      <CustomResponsivePie
        title="Répartition des comptes-rendus par collaboration"
        data={getPieData(reports, "collaborations", { options: organisation.collaborations || [] })}
        help={`Répartition par collaboration des comptes-rendus enregistrés dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des comptes-rendus.`}
      />
    </>
  );
};

export default ReportsStats;
