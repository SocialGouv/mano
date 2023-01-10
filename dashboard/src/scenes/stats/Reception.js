import React from 'react';
import { CustomResponsivePie } from './charts';
import { Block } from './Blocks';
import { organisationState } from '../../recoil/auth';
import { useRecoilValue } from 'recoil';

const ReceptionStats = ({ passages, reportsServices }) => {
  const organisation = useRecoilValue(organisationState);
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques de l'accueil</h3>
      <div className="-tw-mx-4 tw-flex tw-flex-wrap">
        <Block data={passages.length} title="Nombre de passages" />
      </div>
      <CustomResponsivePie
        title="Services"
        data={organisation.services?.map((service) => {
          return {
            id: service,
            label: service,
            value: reportsServices.reduce((serviceNumber, rep) => (rep?.[service] || 0) + serviceNumber, 0),
          };
        })}
      />
    </>
  );
};

export default ReceptionStats;
