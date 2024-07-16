import { useState, useEffect } from "react";
import { servicesSelector } from "../recoil/reports";
import { useRecoilValue } from "recoil";
import API, { tryFetchExpectOk } from "../services/api";
import { toast } from "react-toastify";
import IncrementorSmall from "./IncrementorSmall";
import { organisationState } from "../recoil/auth";
import { capture } from "../services/sentry";

const ReceptionService = ({ report, team, dateString, dataTestIdPrefix = "", services, onUpdateServices: setServices }) => {
  const organisation = useRecoilValue(organisationState);
  const groupedServices = useRecoilValue(servicesSelector);
  const [selected, setSelected] = useState(groupedServices[0]?.groupTitle || null);

  useEffect(
    // Init services for a team. We need to fetch services from legacy report and database and merge them.
    function initServices() {
      if (!dateString || !team?._id || dateString === "undefined") {
        return capture("Missing params for initServices in reception", { extra: { dateString, team, report } });
      }
      tryFetchExpectOk(() => API.getAbortable({ path: `/service/team/${team._id}/date/${dateString}` })).then(([error, res]) => {
        if (error) {
          // Pas besoin d'afficher un message d'erreur si on était en train de quitter la page pendant le chargement.
          if (error?.name === "BeforeUnloadAbortError") return;
          return toast.error(<ErrorOnGetServices />);
        }
        const servicesFromLegacyReport = report?.services?.length ? JSON.parse(report?.services) : {};
        const servicesFromDatabase = res.data.reduce((acc, service) => {
          acc[service.service] = (servicesFromLegacyReport[service.service] || 0) + service.count;
          return acc;
        }, {});
        const mergedServices = Object.fromEntries(
          // We need a sum of all keys from legacy and database services.
          (organisation.services || []).map((key) => [key, (servicesFromLegacyReport[key] || 0) + (servicesFromDatabase[key] || 0)])
        );
        setServices(mergedServices);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateString, report, team]
  );

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
                ? "tw-mb-[-1px] tw-rounded-t tw-border tw-border-slate-300 tw-border-b-[#f8f8f8] tw-px-4 tw-py-2"
                : "tw-px-4 tw-py-2  tw-text-main tw-outline-slate-300 hover:tw-outline"
            }
            onClick={() => setSelected(group.groupTitle)}
          >
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
            key={team._id + " " + service}
            service={service}
            team={team._id}
            date={dateString}
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

const ErrorOnGetServices = () => (
  <div>
    <b>Impossible de récupérer les services pour cette date.</b>
    <p>Veuillez contacter l'équipe de mano pour signaler ce problème, en rappelant la date, l'équipe et l'organisation concernées.</p>
  </div>
);

export default ReceptionService;
