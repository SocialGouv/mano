import React, { useEffect, useMemo, useState } from 'react';
import { Spinner } from 'reactstrap';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import Box from '../../../components/Box';
import { capture } from '../../../services/sentry';
import { organisationState } from '../../../recoil/auth';
import { useRecoilValue } from 'recoil';
import IncrementorSmall from '../../../components/IncrementorSmall';
import API from '../../../services/api';
import { theme } from '../../../config';
import { formatPeriod } from '../../../components/DateRangePickerWithPresets';
import { servicesSelector } from '../../../recoil/reports';

const ErrorOnGetServices = () => (
  <div>
    <b>Impossible de récupérer les services agrégés pour les rapports sélectionnés.</b>
    <p>Veuillez contacter l'équipe de mano pour signaler ce problème, en rappelant la date et l'organisation concernées.</p>
  </div>
);

export default function ServicesReport({ period, selectedTeamsObject }) {
  const organisation = useRecoilValue(organisationState);
  const [show, setShow] = useState([]);
  // `service` structure is: { `team-id-xxx`: { `service-name`: 1, ... }, ... }
  const [services, setServices] = useState({});
  console.log({ period });

  const teamIds = Object.keys(selectedTeamsObject);
  useEffect(() => {
    setShow([teamIds.length === 1 ? selectedTeamsObject[teamIds[0]] : 'all']);
  }, [teamIds]);
  const isSingleDay = period.startDate === period.endDate;

  // Sums of services for all reports, to display the total of services for all teams.
  const serviceSumsForAllReports = useMemo(() => {
    const servicesValues = Object.values(services);
    if (!servicesValues.length) return null;
    return servicesValues.reduce((acc, curr) => {
      return Object.entries(curr).reduce((innerAcc, [key, value]) => {
        innerAcc[key] = (innerAcc[key] || 0) + value;
        return innerAcc;
      }, acc);
    }, {});
  }, [services]);

  useEffect(() => {
    window.sessionStorage.setItem(`services-general-${JSON.stringify(period)}`, show);
  }, [show, period]);

  useEffect(
    // Fetch services for all teams.
    // `services` value contains an object with `team` as key, and an object with `service` as key and `count` as value.
    // { `team-id-xxx`: { `service-name`: 1, ... }, ... }
    function initServices() {
      API.get({
        path: `/service/for-reports`,
        query: {
          teamIds: Object.keys(selectedTeamsObject).join(','),
          startDate: period.startDate.slice(0, 10),
          endDate: period.endDate.slice(0, 10),
        },
      }).then((res) => {
        if (!res.ok) return toast.error(<ErrorOnGetServices />);
        setServices(res.data);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, selectedTeamsObject]
  );

  if (!organisation.receptionEnabled || !organisation?.services) return null;

  return (
    <StyledBox>
      <TabTitle>Services effectués ce jour</TabTitle>
      {teamIds.length > 1 && (
        <ServicesWrapper
          show={show.includes('all')}
          showForPrint={window.sessionStorage.getItem(`services-general-${JSON.stringify(period)}`) === 'true'}>
          <div className="team-name">
            <p>
              Services effectués par toutes les équipes sélectionnées
              <br />
              <small className="tw-opacity-50">
                Ces données sont en lecture seule. Pour les modifier, vous devez le faire équipe par équipe (ci-dessous)
              </small>
            </p>
            <button
              className="toggle-show"
              type="button"
              onClick={() => setShow(show.includes('all') ? show.filter((e) => e === 'all') : [...show, 'all'])}>
              {show.includes('all') ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          <div className="services-list">
            {serviceSumsForAllReports ? (
              Object.entries(serviceSumsForAllReports).map(([key, value]) => (
                <IncrementorSmall
                  dataTestId={`general-${key}-${value || 0}`}
                  key={`general-${key}-${value || 0}`}
                  service={key}
                  count={value || 0}
                  disabled
                  className="max-w-[400px] tw-w-full tw-text-neutral-600"
                />
              ))
            ) : (
              <Spinner />
            )}
          </div>
        </ServicesWrapper>
      )}
      {teamIds.map((teamId) => (
        <ServicesWrapper key={teamId} show={show.includes(teamId)}>
          {teamIds.length > 1 && (
            <div className="team-name">
              <p>
                <b>
                  {selectedTeamsObject[teamId].nightSession ? '🌒' : '☀️ '} {selectedTeamsObject[teamId]?.name || ''}
                </b>{' '}
                - {formatPeriod({ period })}
              </p>
              <button
                className="toggle-show"
                type="button"
                onClick={() => setShow(show.includes(teamId) ? show.filter((e) => e === teamId) : [...show, teamId])}>
                {show.includes(teamId) ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          )}
          <div className="services-list">
            <ServiceByTeam
              services={services[teamId]}
              onUpdateServices={(updated) => setServices((s) => ({ ...s, [teamId]: updated }))}
              team={selectedTeamsObject[teamId]}
              disabled={!isSingleDay}
              dateString={period.startDate.slice(0, 10)}
              dataTestIdPrefix={`${selectedTeamsObject[teamId].name}-`}
            />
          </div>
        </ServicesWrapper>
      ))}
    </StyledBox>
  );
}

const ServiceByTeam = ({ team, disabled, dateString, dataTestIdPrefix = '', services, onUpdateServices: setServices }) => {
  const groupedServices = useRecoilValue(servicesSelector);
  const [selected, setSelected] = useState(groupedServices[0]?.groupTitle || null);

  const selectedServices = groupedServices.find((e) => e.groupTitle === selected)?.services || [];

  if (!services) return;

  return (
    <div>
      <div className="tw-mb-4 tw-border-b tw-border-slate-300">
        {groupedServices.map((group, index) => (
          <button
            key={group + index}
            className={
              selected === group.groupTitle
                ? 'tw-mb-[-1px] tw-rounded-t tw-border tw-border-slate-300 tw-border-b-[#f8f8f8] tw-px-4 tw-py-2'
                : 'tw-px-4 tw-py-2  tw-text-main tw-outline-slate-300 hover:tw-outline'
            }
            onClick={() => setSelected(group.groupTitle)}>
            {group.groupTitle}
          </button>
        ))}
      </div>
      {/* This key is used to refresh incrementators on team change. */}
      {/* We could avoid this by mapping on something that actually represents what is displayed (eg: services) */}
      <div key={team._id}>
        {selectedServices.map((service) => (
          <IncrementorSmall
            dataTestId={`${dataTestIdPrefix}${service}-${services[service] || 0}`}
            key={team._id + ' ' + service}
            service={service}
            team={team._id}
            dateString={dateString}
            disabled={disabled}
            count={services[service] || 0}
            onUpdated={(newCount) => {
              setServices({ ...services, [service]: newCount });
            }}
          />
        ))}
      </div>
    </div>
  );
};

const ServicesWrapper = styled.div`
  background-color: #f8f8f8;
  border-radius: 15px;
  padding: 1rem;
  margin-bottom: 1rem;
  .services-list {
    display: ${(p) => (p.show ? 'flex' : 'none')};
    flex-direction: column;
    justify-content: center;
    align-items: center;
    @media print {
      display: flex;
    }
  }
  .services-incrementators {
    text-align: left;
    margin-top: 1rem;
  }
  .team-name {
    font-weight: 600;
    ${(p) => p.show && 'border-bottom: 1px solid #ddd;'}
    ${(p) => p.show && 'margin-bottom: 1.5rem;'}
    ${(p) => p.show && 'padding-bottom: 0.5rem;'}
    display: flex;
    justify-content: space-between;
    align-items: center;
    p {
      margin: 0;
    }
  }
  button.toggle-show {
    background: none;
    color: ${theme.main};
    display: inline-block;
    font-size: 14px;
    font-weight: 600;
    margin-left: auto;
    border-radius: 8px;
    cursor: pointer;
    border: none;
  }
`;

const TabTitle = styled.span`
  caption-side: top;
  font-weight: bold;
  font-size: 24px;
  line-height: 32px;
  width: 100%;
  color: #1d2021;
  text-transform: none;
  padding: 16px 0;
  display: block;
  @media print {
    display: block !important;
  }
`;

const StyledBox = styled(Box)`
  border-radius: 16px;
  padding: 16px 32px;
  @media print {
    margin-bottom: 15px;
  }

  .Table {
    padding: 0;
  }
`;
