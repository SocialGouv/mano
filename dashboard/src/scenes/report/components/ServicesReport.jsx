import { useEffect, useMemo, useState } from "react";
import { Spinner } from "reactstrap";
import { toast } from "react-toastify";
import { organisationState } from "../../../recoil/auth";
import { useRecoilValue } from "recoil";
import IncrementorSmall from "../../../components/IncrementorSmall";
import API, { tryFetchExpectOk } from "../../../services/api";
import { formatPeriod } from "../../../components/DateRangePickerWithPresets";
import { servicesSelector } from "../../../recoil/reports";
import dayjs from "dayjs";
import { FullScreenIcon } from "../../../assets/icons/FullScreenIcon";
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from "../../../components/tailwind/Modal";

const ErrorOnGetServices = () => (
  <div>
    <b>Impossible de récupérer les services agrégés pour les rapports sélectionnés.</b>
    <p>Veuillez contacter l'équipe de mano pour signaler ce problème, en rappelant la date et l'organisation concernées.</p>
  </div>
);

export default function ServicesReport({ period, selectedTeamsObject }) {
  const organisation = useRecoilValue(organisationState);
  const [show, setShow] = useState([]);
  const [fullScreen, setFullScreen] = useState(false);
  // `service` structure is: { `team-id-xxx`: { `service-name`: 1, ... }, ... }
  const [services, setServices] = useState({});

  useEffect(() => {
    const teamIds = Object.keys(selectedTeamsObject);
    setShow([teamIds.length === 1 ? selectedTeamsObject[teamIds[0]] : "all"]);
  }, [selectedTeamsObject]);

  // Sums of services for all reports, to display the total of services for all teams.
  const serviceSumsForAllReports = useMemo(() => {
    const servicesValues = Object.values(services);
    if (!servicesValues.length) return {};
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
      tryFetchExpectOk(async () =>
        API.get({
          path: `/service/for-reports`,
          query: {
            teamIds: Object.keys(selectedTeamsObject).join(","),
            startDate: dayjs(period.startDate).format("YYYY-MM-DD"),
            endDate: dayjs(period.endDate).format("YYYY-MM-DD"),
          },
        })
      ).then(([error, res]) => {
        if (error) return toast.error(<ErrorOnGetServices />);
        setServices(res.data);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, selectedTeamsObject]
  );

  if (!organisation.receptionEnabled || !organisation?.services) return null;

  const teamIds = Object.keys(selectedTeamsObject);

  const isSingleDay = dayjs(period.startDate).format("YYYY-MM-DD") === dayjs(period.endDate).format("YYYY-MM-DD");

  return (
    <>
      <section className="noprint tw-py-2 print:tw-mb-4">
        <div className="tw-flex tw-items-center tw-justify-between tw-px-3">
          <h3 className="tw-w-full tw-py-2 tw-text-base tw-font-medium tw-text-black">Services effectués</h3>
          <button
            title="Passer les actions/consultations en plein écran"
            className="tw-h-6 tw-w-6 tw-rounded-full tw-text-main tw-transition hover:tw-scale-125 disabled:tw-opacity-30"
            onClick={() => setFullScreen(true)}
          >
            <FullScreenIcon />
          </button>
        </div>
        <div className="tw-mb-4">
          {!serviceSumsForAllReports ? (
            <Spinner />
          ) : (
            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-rounded-2xl tw-py-4">
              {teamIds.length > 1 ? (
                <>
                  <div className="tw-mb-6 tw-flex tw-items-center tw-justify-between tw-border-b-gray-300 tw-px-2 tw-pb-2 tw-font-medium print:tw-justify-start">
                    <p className="tw-mb-0">
                      Services effectués par toutes les équipes sélectionnées
                      <>
                        <br />
                        <small className="noprint tw-opacity-50">
                          Ces données sont en lecture seule. Pour les modifier, vous devez le faire équipe par équipe en plein écran
                        </small>
                      </>
                    </p>
                  </div>
                  {Object.entries(serviceSumsForAllReports).map(([key, value]) => (
                    <IncrementorSmall
                      dataTestId={`general-${key}-${value || 0}`}
                      key={`general-${key}-${value || 0}`}
                      service={key}
                      count={value || 0}
                      date={dayjs(period.startDate).format("YYYY-MM-DD")}
                      disabled
                      className="max-w-[400px] tw-w-full tw-px-2 tw-text-neutral-600"
                    />
                  ))}
                </>
              ) : (
                <ServiceByTeam
                  services={services[teamIds[0]]}
                  onUpdateServices={(updated) => setServices((s) => ({ ...s, [teamIds[0]]: updated }))}
                  team={selectedTeamsObject[teamIds[0]]}
                  disabled={!isSingleDay}
                  dateString={dayjs(period.startDate).format("YYYY-MM-DD")}
                  dataTestIdPrefix={`${selectedTeamsObject[teamIds[0]].name}-`}
                />
              )}
            </div>
          )}
        </div>
      </section>
      <ServicesFullScreen
        open={fullScreen}
        onClose={() => setFullScreen(false)}
        period={period}
        teamIds={teamIds}
        setServices={setServices}
        services={services}
        serviceSumsForAllReports={serviceSumsForAllReports}
        selectedTeamsObject={selectedTeamsObject}
        isSingleDay={isSingleDay}
      />
      <section
        aria-hidden="true"
        className="printonly tw-mt-12 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow"
      >
        <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
          <h3 className="tw-m-0 tw-text-base tw-font-medium">Services effectués {teamIds.length > 1 && " par toutes les équipes sélectionnées"}</h3>
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20 tw-p-4">
          {Object.entries(serviceSumsForAllReports).map(([key, value]) => (
            <IncrementorSmall
              dataTestId={`general-printonly-${key}-${value || 0}`}
              key={`general-printonly-${key}-${value || 0}`}
              service={key}
              count={value || 0}
              date={dayjs(period.startDate).format("YYYY-MM-DD")}
              disabled
              className="max-w-[400px] tw-w-full tw-text-neutral-600"
            />
          ))}
        </div>
      </section>
    </>
  );
}

function ServicesFullScreen({ open, onClose, period, isSingleDay, teamIds, services, setServices, selectedTeamsObject }) {
  const [show, setShow] = useState([]);

  return (
    <ModalContainer open={!!open} className="" size="prose" onClose={onClose}>
      <ModalHeader title="Services effectués" onClose={onClose} />
      <ModalBody>
        <div className="py-2 tw-px-4 print:tw-mb-4">
          {teamIds.map((teamId) => {
            return (
              <div key={teamId} className="tw-mb-4 tw-rounded-2xl tw-bg-gray-100 tw-p-4">
                <div
                  className={[
                    "tw-flex tw-items-center tw-justify-between tw-font-medium",
                    (teamIds.length === 1 || show.includes(teamId)) && "tw-mb-6 tw-border-b-gray-300 tw-pb-2",
                    !services[teamId] && "tw-opacity-50",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <p className="tw-mb-0">
                    <b>
                      {selectedTeamsObject[teamId].nightSession ? "🌒" : "☀️ "} {selectedTeamsObject[teamId]?.name || ""}
                    </b>{" "}
                    - {formatPeriod({ period })}
                  </p>
                  {teamIds.length > 1 && (
                    <button
                      className="tw-ml-auto tw-inline-block tw-rounded-lg tw-border-none tw-bg-none tw-text-sm tw-font-medium tw-text-main disabled:tw-cursor-not-allowed"
                      type="button"
                      title={services[teamId] ? "Afficher les services" : "Aucun service effectué"}
                      onClick={() => setShow(show.includes(teamId) ? show.filter((e) => e !== teamId) : [...show, teamId])}
                    >
                      {show.includes(teamId) ? "Masquer" : "Afficher"}
                    </button>
                  )}
                </div>
                <div
                  className={[
                    "tw-flex-col tw-items-center tw-justify-center print:tw-flex",
                    teamIds.length === 1 || show.includes(teamId) ? "tw-flex" : "tw-hidden",
                  ].join(" ")}
                >
                  <ServiceByTeam
                    services={services[teamId]}
                    onUpdateServices={(updated) => setServices((s) => ({ ...s, [teamId]: updated }))}
                    team={selectedTeamsObject[teamId]}
                    disabled={!isSingleDay}
                    dateString={dayjs(period.startDate).format("YYYY-MM-DD")}
                    dataTestIdPrefix={`${selectedTeamsObject[teamId].name}-`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ModalBody>
      <ModalFooter>
        <button type="button" name="cancel" className="button-cancel" onClick={onClose}>
          Fermer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
}

const ServiceByTeam = ({ team, disabled, dateString, dataTestIdPrefix = "", services = {}, onUpdateServices: setServices }) => {
  const groupedServices = useRecoilValue(servicesSelector);
  const [selected, setSelected] = useState(groupedServices[0]?.groupTitle || null);

  const selectedServices = groupedServices.find((e) => e.groupTitle === selected)?.services || [];

  return (
    <div>
      <div className="tw-mb-4 tw-border-b tw-border-slate-300 tw-px-2">
        {groupedServices.map((group, index) => (
          <button
            key={group + index}
            className={[
              selected === group.groupTitle ? "tw-bg-main/10 tw-text-black" : "tw-hover:text-gray-700 tw-text-main",
              "tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-font-medium",
            ].join(" ")}
            onClick={() => setSelected(group.groupTitle)}
          >
            {group.groupTitle}
          </button>
        ))}
      </div>
      {/* This key is used to refresh incrementators on team change. */}
      {/* We could avoid this by mapping on something that actually represents what is displayed (eg: services) */}
      <div key={team._id} className="tw-px-4">
        {selectedServices.map((service) => (
          <IncrementorSmall
            dataTestId={`${dataTestIdPrefix}${service}-${services[service] || 0}`}
            key={team._id + " " + service}
            service={service}
            team={team._id}
            date={dateString}
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
