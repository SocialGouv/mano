import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from 'react-use';
import { flattenedServicesSelector, prepareReportForEncryption, reportsState, servicesSelector } from '../recoil/reports';
import { useRecoilState, useRecoilValue } from 'recoil';
import useApi from '../services/api';
import IncrementorSmall from './IncrementorSmall';
import { lastLoadState, mergeItems } from './DataLoader';

const ReceptionService = ({ report, team, dateString, dataTestIdPrefix = '' }) => {
  // const organisation = useRecoilValue(organisationState);
  const groupedServices = useRecoilValue(servicesSelector);
  const flattenedServices = useRecoilValue(flattenedServicesSelector);
  const [reports, setReports] = useRecoilState(reportsState);
  const lastLoad = useRecoilValue(lastLoadState);
  const [selected, setSelected] = useState(groupedServices[0]?.groupTitle || null);

  const API = useApi();

  const [services, setServices] = useState(() => (report?.services?.length ? JSON.parse(report?.services) : {}));
  const servicesRef = useRef(services);

  const onServiceUpdate = async (service, newCount) => {
    const newServices = {
      ...services,
      [service]: newCount,
    };
    setServices(newServices);
  };

  useEffect(() => {
    // when we change the team, we change the report and we reset the services
    const newServices = report?.services?.length ? JSON.parse(report?.services) : {};
    setServices(newServices);
    servicesRef.current = newServices;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report]);

  useDebounce(
    async () => {
      /*
      The target of this complicated process is to not create empty reports automatically
      like we used to do before, so that the page /report is not cluttered with empty reports.
      The solution is to create a report only if there is at least one thing going one, including a service.
      */

      // we need to prevent create report on first mount with empty services
      if (!Object.keys(services).length) return;
      // we need to prevent update on first mount for nothing
      if (JSON.stringify(services) === report?.services) return;
      // we need to fetch the report again to be sure it's not already created by another user
      const latestReportsRes = await API.get({ path: '/report', query: { after: lastLoad, withDeleted: true } });
      const allReports = mergeItems(reports, latestReportsRes.decryptedData);
      const reportAtDate = !!report?._id
        ? allReports.find((_report) => _report._id === report._id)
        : allReports.find((_report) => _report.date === dateString && _report.team === team._id);

      // now we need to merge services with the latest report
      const originalServices = servicesRef.current;
      const myAddedServices = {};
      for (const service of flattenedServices) {
        if (services[service] == null) continue;
        myAddedServices[service] = (services[service] || 0) - (originalServices[service] || 0);
      }
      const latestReportServices = reportAtDate?.services?.length ? JSON.parse(reportAtDate?.services) : {};
      const newServices = {};
      for (const service of flattenedServices) {
        if (!myAddedServices[service]) {
          newServices[service] = latestReportServices[service];
        } else {
          newServices[service] = services[service];
        }
      }

      const reportUpdate = {
        team: team._id,
        date: dateString,
        ...(reportAtDate || {}),
        services: JSON.stringify(newServices),
      };

      const isNew = !reportUpdate?._id;
      const res = isNew
        ? await API.post({ path: '/report', body: prepareReportForEncryption(reportUpdate) })
        : await API.put({ path: `/report/${reportUpdate._id}`, body: prepareReportForEncryption(reportUpdate) });
      if (res.ok) {
        setReports((reports) =>
          isNew
            ? [res.decryptedData, ...reports]
            : reports.map((a) => {
                if (a._id === reportAtDate._id) return res.decryptedData;
                return a;
              })
        );
        const latestServices = res.decryptedData?.services?.length ? JSON.parse(res.decryptedData?.services) : {};
        setServices(latestServices);
        servicesRef.current = latestServices;
      }
    },
    process.env.REACT_APP_TEST === 'true' ? 0 : 900,
    [services]
  );

  const selectedServices = groupedServices.find((e) => e.groupTitle === selected)?.services || [];

  return (
    <div>
      <div className="tw-mb-4 tw-border-b tw-border-slate-300">
        {groupedServices.map((group) => (
          <button
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
      {selectedServices.map((service) => (
        <IncrementorSmall
          dataTestId={`${dataTestIdPrefix}${service}-${services[service] || 0}`}
          key={service}
          service={service}
          count={services[service] || 0}
          onChange={(newCount) => onServiceUpdate(service, newCount)}
        />
      ))}
    </div>
  );
};

export default ReceptionService;
