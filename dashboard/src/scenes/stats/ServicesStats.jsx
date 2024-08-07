import { useEffect, useMemo, useState } from "react";
import { CustomResponsivePie } from "./Charts";
import { useRecoilValue } from "recoil";
import API, { tryFetchExpectOk } from "../../services/api";
import { toast } from "react-toastify";
import { dayjsInstance } from "../../services/date";
import { useLocalStorage } from "../../services/useLocalStorage";
import SelectCustom from "../../components/SelectCustom";
import { servicesSelector } from "../../recoil/reports";

const ServicesStats = ({ period, teamIds }) => {
  const groupedServices = useRecoilValue(servicesSelector);
  const allServices = useMemo(() => {
    return groupedServices.reduce((services, group) => [...services, ...group.services], []);
  }, [groupedServices]);
  const [servicesGroupFilter, setServicesGroupFilter] = useLocalStorage("stats-servicesGroupFilter", []);
  const [servicesFilter, setServicesFilter] = useLocalStorage("stats-servicesFilter", []);
  const [servicesFromDatabase, setServicesFromDatabase] = useState(null);
  const startDate = useMemo(() => (period.startDate ? dayjsInstance(period.startDate).format("YYYY-MM-DD") : null), [period.startDate]);
  const endDate = useMemo(() => (period.endDate ? dayjsInstance(period.endDate).format("YYYY-MM-DD") : null), [period.endDate]);

  useEffect(
    function fetchServicesStats() {
      if (!teamIds?.length) {
        setServicesFromDatabase({});
        return;
      }
      tryFetchExpectOk(async () =>
        API.getAbortable({ path: `/service/team/${teamIds.join(",")}/stats`, query: startDate ? { from: startDate, to: endDate || startDate } : {} })
      ).then(([error, response]) => {
        if (error) {
          // Pas besoin d'afficher un message d'erreur si on était en train de quitter la page pendant le chargement.
          if (error?.name === "BeforeUnloadAbortError") return;
          return toast.error("Erreur lors du chargement des statistiques des services de l'accueil");
        }
        const servicesObj = {};
        for (const service of allServices) {
          servicesObj[service] = Number(response.data.find((s) => s.service === service)?.count || 0);
        }
        setServicesFromDatabase(servicesObj);
      });
    },
    [teamIds, startDate, endDate, allServices]
  );

  const servicesFiltered = useMemo(() => {
    const servicesToConsider = servicesFilter?.length ? servicesFilter : allServices;
    if (!servicesGroupFilter?.length) return servicesToConsider;
    const servicesToHide = groupedServices.reduce((services, group) => {
      if (servicesGroupFilter.includes(group.groupTitle)) return services;
      return [...services, ...group.services];
    }, []);
    return servicesToConsider.filter((service) => !servicesToHide.includes(service));
  }, [servicesFilter, allServices, servicesGroupFilter, groupedServices]);

  const servicesData = useMemo(() => {
    if (!servicesFromDatabase) return [];
    return servicesFiltered?.map((service) => {
      return {
        id: service,
        label: service,
        value: servicesFromDatabase[service] || 0,
      };
    });
  }, [servicesFiltered, servicesFromDatabase]);

  const groupsData = useMemo(() => {
    if (!servicesFromDatabase) return [];
    return groupedServices
      .filter((group) => !servicesGroupFilter?.length || servicesGroupFilter.includes(group.groupTitle))
      .map((group) => {
        let totalServices = 0;
        for (const service of group.services) {
          if (!servicesFiltered.includes(service)) continue;
          totalServices = totalServices + (servicesFromDatabase[service] || 0);
        }
        return {
          id: group.groupTitle,
          label: group.groupTitle,
          value: totalServices,
        };
      });
  }, [groupedServices, servicesGroupFilter, servicesFiltered, servicesFromDatabase]);

  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des services</h3>
      <div className="tw-mb-5 tw-flex tw-basis-full tw-items-center">
        <label htmlFor="filter-by-status" className="tw-mx-5 tw-w-64 tw-shrink-0">
          Filtrer par groupe de services :
        </label>
        <div className="tw-basis-[500px]">
          <SelectCustom
            value={servicesGroupFilter?.map((_option) => ({ value: _option, label: _option })) || []}
            options={groupedServices.map((group) => group.groupTitle).map((_option) => ({ value: _option, label: _option }))}
            getOptionValue={(s) => s.value}
            getOptionLabel={(s) => s.label}
            onChange={(groups) => setServicesGroupFilter(groups.map((s) => s.value))}
            name="service-group-filter"
            inputId="service-group-filter"
            isClearable
            isMulti
          />
        </div>
        <label htmlFor="filter-by-status" className="tw-mx-5 tw-w-64 tw-shrink-0">
          Filtrer par service :
        </label>
        <div className="tw-basis-[500px]">
          <SelectCustom
            value={servicesFilter?.map((_option) => ({ value: _option, label: _option })) || []}
            options={allServices.map((_option) => ({ value: _option, label: _option }))}
            getOptionValue={(s) => s.value}
            getOptionLabel={(s) => s.label}
            onChange={(services) => setServicesFilter(services.map((s) => s.value))}
            name="service-filter"
            inputId="service-filter"
            isClearable
            isMulti
          />
        </div>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-4">
        <CustomResponsivePie
          title="Répartition des services par groupe"
          help={`Groupes de services enregistrés dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des services.`}
          data={groupsData}
        />
        <CustomResponsivePie
          title="Services"
          help={`Services enregistrés dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des services.`}
          data={servicesData}
        />
      </div>
    </>
  );
};

export default ServicesStats;
