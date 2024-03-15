import React, { useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import { useHistory } from "react-router-dom";
import { organisationState, userState } from "../../../recoil/auth";
import { CANCEL, DONE, mappedIdsToLabels } from "../../../recoil/actions";
import SelectCustom from "../../../components/SelectCustom";
import TagTeam from "../../../components/TagTeam";
import ActionOrConsultationName from "../../../components/ActionOrConsultationName";
import { formatDateWithNameOfDay, formatTime } from "../../../services/date";
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from "../../../components/tailwind/Modal";
import { arrayOfitemsGroupedByConsultationSelector } from "../../../recoil/selectors";
import { useLocalStorage } from "../../../services/useLocalStorage";
import { AgendaMutedIcon } from "../../../assets/icons/AgendaMutedIcon";
import { disableConsultationRow } from "../../../recoil/consultations";
import { FullScreenIcon } from "../../../assets/icons/FullScreenIcon";
import UserName from "../../../components/UserName";
import DescriptionIcon from "../../../components/DescriptionIcon";
import ActionStatusSelect from "../../../components/ActionStatusSelect";

export const Consultations = ({ person }) => {
  const [fullScreen, setFullScreen] = useState(false);
  const history = useHistory();

  const allConsultations = useRecoilValue(arrayOfitemsGroupedByConsultationSelector);
  const [consultationTypes, setConsultationTypes] = useLocalStorage("consultation-types", []);
  const [consultationStatuses, setConsultationStatuses] = useLocalStorage("consultation-statuses", []);

  const personConsultations = useMemo(() => (allConsultations || []).filter((c) => c.person === person._id), [allConsultations, person._id]);
  const personConsultationsFiltered = useMemo(
    () =>
      personConsultations
        .filter((c) => !consultationStatuses.length || consultationStatuses.includes(c.status))
        .filter((c) => !consultationTypes.length || consultationTypes.includes(c.type))
        .sort((p1, p2) => ((p1.completedAt || p1.dueAt) > (p2.completedAt || p2.dueAt) ? -1 : 1)),
    [personConsultations, consultationStatuses, consultationTypes]
  );

  const data = personConsultations;
  const filteredData = personConsultationsFiltered;

  return (
    <>
      <div className="tw-relative">
        <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-bg-white tw-p-3 tw-shadow-sm">
          <h4 className="tw-flex-1 tw-text-xl">Consultations {filteredData.length ? `(${filteredData.length})` : ""}</h4>
          <div className="flex-col tw-flex tw-items-center tw-gap-2">
            <button
              aria-label="Ajouter une consultation"
              className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-blue-900 tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
              onClick={() => {
                const searchParams = new URLSearchParams(history.location.search);
                searchParams.set("newConsultation", true);
                searchParams.set("personId", person._id);
                history.push(`?${searchParams.toString()}`);
              }}
            >
              ＋
            </button>
            {Boolean(filteredData.length) && (
              <button
                title="Passer les consultations en plein écran"
                className="tw-h-6 tw-w-6 tw-rounded-full tw-text-blue-900 tw-transition hover:tw-scale-125"
                onClick={() => setFullScreen(true)}
              >
                <FullScreenIcon />
              </button>
            )}
          </div>
        </div>
        <ConsultationsFilters
          data={data}
          filteredData={filteredData}
          consultationTypes={consultationTypes}
          setConsultationTypes={setConsultationTypes}
          setConsultationStatuses={setConsultationStatuses}
          consultationStatuses={consultationStatuses}
        />
        <ModalContainer open={!!fullScreen} size="prose" onClose={() => setFullScreen(false)}>
          <ModalBody>
            <ConsultationsTable filteredData={filteredData} person={person} />
          </ModalBody>
          <ModalHeader title={`Consultations de  ${person?.name} (${filteredData.length})`}>
            <div className="tw-mt-2 tw-w-full tw-max-w-2xl">
              <ConsultationsFilters
                data={data}
                filteredData={filteredData}
                consultationTypes={consultationTypes}
                setConsultationTypes={setConsultationTypes}
                setConsultationStatuses={setConsultationStatuses}
                consultationStatuses={consultationStatuses}
              />
            </div>
          </ModalHeader>
          <ModalFooter>
            <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
              Fermer
            </button>
            <button
              type="button"
              className="button-submit !tw-bg-blue-900"
              onClick={() => {
                const searchParams = new URLSearchParams(history.location.search);
                searchParams.set("newConsultation", true);
                searchParams.set("personId", person._id);
                history.push(`?${searchParams.toString()}`);
              }}
            >
              ＋ Ajouter une consultation
            </button>
          </ModalFooter>
        </ModalContainer>
        <ConsultationsTable filteredData={filteredData} person={person} />
      </div>
    </>
  );
};

const ConsultationsFilters = ({ data, filteredData, setConsultationTypes, setConsultationStatuses, consultationStatuses, consultationTypes }) => {
  const organisation = useRecoilValue(organisationState);

  return (
    <>
      {data.length ? (
        <div className="tw-mb-4 tw-flex tw-basis-full tw-justify-between tw-gap-2 tw-px-3">
          <div className="tw-shrink-0 tw-flex-grow">
            <label htmlFor="consultation-select-types-filter">Filtrer par type</label>
            <SelectCustom
              options={organisation.consultations.map((e) => ({ _id: e.name, name: e.name }))}
              value={organisation.consultations.map((e) => ({ _id: e.name, name: e.name })).filter((s) => consultationTypes.includes(s._id))}
              getOptionValue={(s) => s._id}
              getOptionLabel={(s) => s.name}
              onChange={(selectedTypes) => setConsultationTypes(selectedTypes.map((t) => t._id))}
              inputId="consultation-select-types-filter"
              name="types"
              isClearable
              isMulti
            />
          </div>
          <div className="tw-shrink-0 tw-flex-grow">
            <label htmlFor="consultation-select-status-filter">Filtrer par statut</label>
            <SelectCustom
              inputId="consultation-select-status-filter"
              options={mappedIdsToLabels}
              getOptionValue={(s) => s._id}
              getOptionLabel={(s) => s.name}
              name="status"
              onChange={(s) => setConsultationStatuses(s.map((s) => s._id))}
              isClearable
              isMulti
              value={mappedIdsToLabels.filter((s) => consultationStatuses.includes(s._id))}
            />
          </div>
        </div>
      ) : (
        <div className="tw-mt-8 tw-w-full tw-text-center tw-text-gray-300">
          <AgendaMutedIcon />
          Aucune consultation pour le moment
        </div>
      )}
    </>
  );
};

const ConsultationsTable = ({ filteredData, person }) => {
  const user = useRecoilValue(userState);
  const history = useHistory();

  return (
    <>
      <table className="table">
        <tbody className="small">
          {filteredData.map((consultation, i) => {
            const date = formatDateWithNameOfDay([DONE, CANCEL].includes(consultation.status) ? consultation.completedAt : consultation.dueAt);
            const time = consultation.withTime && consultation.dueAt ? ` ${formatTime(consultation.dueAt)}` : "";
            return (
              <tr key={consultation._id} className={i % 2 ? "tw-bg-sky-800/80 tw-text-white" : "tw-bg-sky-100/80"}>
                <td>
                  <div
                    className={
                      ["restricted-access"].includes(user.role) || disableConsultationRow(consultation, user)
                        ? "tw-cursor-not-allowed tw-py-2"
                        : "tw-cursor-pointer tw-py-2"
                    }
                    onClick={() => {
                      if (disableConsultationRow(consultation, user)) return;
                      const searchParams = new URLSearchParams(history.location.search);
                      searchParams.set("consultationId", consultation._id);
                      history.push(`?${searchParams.toString()}`);
                    }}
                  >
                    <div className="tw-flex">
                      <div className="tw-flex-1">
                        {!!consultation.description && <DescriptionIcon />}
                        {`${date}${time}`}
                      </div>
                      <div>
                        <ActionStatusSelect action={consultation} />
                      </div>
                    </div>
                    <div className="tw-mt-2 tw-flex">
                      <div className="tw-flex tw-flex-1 tw-flex-row tw-items-center">
                        {!["restricted-access"].includes(user.role) && (
                          <>
                            <ActionOrConsultationName item={consultation} hideType />
                            {Boolean(consultation.name) && ![consultation.type, `Consultation ${consultation.type}`].includes(consultation.name) && (
                              <span className="tw-ml-2">- {consultation.type}</span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="tw-flex tw-flex-col tw-gap-px">
                        {Array.isArray(consultation?.teams) ? (
                          consultation.teams.map((e) => <TagTeam key={e} teamId={e} />)
                        ) : (
                          <TagTeam teamId={consultation?.team} />
                        )}
                      </div>
                    </div>
                    <div className="-tw-mb-2 tw-mt-2 tw-flex tw-basis-full tw-gap-1 tw-text-xs tw-opacity-50 [overflow-wrap:anywhere]">
                      <span>Créée par</span>
                      <UserName id={consultation.user} />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};
