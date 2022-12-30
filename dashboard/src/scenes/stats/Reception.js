import React, { useEffect, useMemo, useState } from 'react';
import { CustomResponsivePie } from './charts';
import { Block } from './Blocks';
import { organisationState, teamsState } from '../../recoil/auth';
import { useRecoilValue } from 'recoil';
import useApi from '../../services/api';
import { toast } from 'react-toastify';
import { dayjsInstance } from '../../services/date';
import { Spinner } from 'reactstrap';

const ReceptionStats = ({ passages, reportsServices, period, teamsId }) => {
  const organisation = useRecoilValue(organisationState);
  const [servicesFormDatabase, setServicesFormDatabase] = useState(null);
  const API = useApi();
  const startDate = useMemo(() => dayjsInstance(period.startDate).format('YYYY-MM-DD'), [period.startDate]);
  const endDate = useMemo(() => dayjsInstance(period.endDate).format('YYYY-MM-DD'), [period.endDate]);

  useEffect(
    function fetchServicesStats() {
      API.get({ path: `/service/team/${teamsId.join(',')}/from/${startDate}/to/${endDate}` }).then((res) => {
        if (!res.ok) return toast.error("Erreur lors du chargement des statistiques des services de l'accueil");
        setServicesFormDatabase(res.data.reduce((acc, service) => ({ ...acc, [service.service]: Number(service.count) }), {}));
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teamsId, startDate, endDate]
  );

  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques de l'accueil</h3>
      <div className="-tw-mx-4 tw-flex tw-flex-wrap">
        <Block data={passages.length} title="Nombre de passages" />
      </div>
      {servicesFormDatabase !== null && (
        <CustomResponsivePie
          title="Services"
          data={organisation.services?.map((service) => {
            return {
              id: service,
              label: service,
              value: reportsServices.reduce((serviceNumber, rep) => (rep?.[service] || 0) + serviceNumber, 0) + (servicesFormDatabase[service] || 0),
            };
          })}
        />
      )}
    </>
  );
};

export default ReceptionStats;
