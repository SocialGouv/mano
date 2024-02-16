import { useState, useMemo } from 'react';
import { mappedIdsToLabels } from '../../../recoil/actions';
import { useHistory } from 'react-router-dom';
import SelectCustom from '../../../components/SelectCustom';
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from '../../../components/tailwind/Modal';
import { FullScreenIcon } from '../../../assets/icons/FullScreenIcon';
import ActionsSortableList from '../../../components/ActionsSortableList';
import TabsNav from '../../../components/tailwind/TabsNav';
import { useLocalStorage } from '../../../services/useLocalStorage';
import { useRecoilValue } from 'recoil';
import { userState } from '../../../recoil/auth';
import { dayjsInstance } from '../../../services/date';

const formatEcheanceLabelPeriod = (period) => {
  if (!!period.startDate && !!period.endDate) {
    const start = dayjsInstance(period.startDate);
    const end = dayjsInstance(period.endDate);
    const today = dayjsInstance();
    const showYear = start.year() !== end.year() || start.year() !== today.year();
    const startFormatted = dayjsInstance(period.startDate).format(showYear ? 'D MMM YYYY' : 'D MMM');
    const endFormatted = dayjsInstance(period.endDate).format(showYear ? 'D MMM YYYY' : 'D MMM');
    if (startFormatted === endFormatted) return `le ${startFormatted}`;
    return `entre le ${startFormatted} et le ${endFormatted}`;
  }
  return '';
};

export const ActionsOrConsultationsReport = ({
  actionsDueOrCompletedAt,
  actionsCreatedAt,
  consultationsDueOrCompletedAt,
  consultationsCreatedAt,
  period,
}) => {
  const history = useHistory();
  const user = useRecoilValue(userState);

  const [activeTab, setActiveTab] = useLocalStorage('reports-actions-consultation-toggle', 'Actions');
  const canSeeMedicalData = ['admin', 'normal'].includes(user.role) && !!user.healthcareProfessional;

  const activeTabIndex = useMemo(() => {
    if (activeTab.includes('Actions')) return 0;
    if (activeTab.includes('Consultations')) return 1;
    if (activeTab.includes('Créées')) {
      if (canSeeMedicalData) return 2;
      return 1;
    }
  }, [activeTab, canSeeMedicalData]);
  const [fullScreen, setFullScreen] = useState(false);
  const [filterStatus, setFilterStatus] = useLocalStorage('reports-actions-filter-status', []);

  const data = useMemo(() => {
    if (activeTab.includes('Action')) return actionsDueOrCompletedAt;
    if (activeTab.includes('Consultations')) return consultationsDueOrCompletedAt;
    return [...actionsCreatedAt, ...consultationsCreatedAt];
  }, [activeTab, actionsCreatedAt, consultationsCreatedAt, consultationsDueOrCompletedAt, actionsDueOrCompletedAt]);

  const filteredActionsDueOrCompletedAt = actionsDueOrCompletedAt.filter((item) => !filterStatus.length || filterStatus.includes(item.status));
  const filteredConsultationsDueOrCompletedAt = consultationsDueOrCompletedAt.filter(
    (item) => !filterStatus.length || filterStatus.includes(item.status)
  );
  const filteredData = useMemo(() => {
    if (activeTab.includes('Action')) return filteredActionsDueOrCompletedAt;
    if (activeTab.includes('Consultations')) return filteredConsultationsDueOrCompletedAt;
    return [...actionsCreatedAt, ...consultationsCreatedAt];
  }, [activeTab, actionsCreatedAt, consultationsCreatedAt, filteredConsultationsDueOrCompletedAt, filteredActionsDueOrCompletedAt]);

  const tabs = canSeeMedicalData
    ? [
        `Actions (${filteredActionsDueOrCompletedAt.length})`,
        `Consultations (${filteredConsultationsDueOrCompletedAt.length})`,
        `Créées (${consultationsCreatedAt.length + actionsCreatedAt.length})`,
      ]
    : [`Actions (${filteredActionsDueOrCompletedAt.length})`, `Créées (${actionsCreatedAt.length})`];

  return (
    <>
      <section title={activeTab} className="noprint tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden">
        <div className="tw-flex tw-items-center tw-bg-white tw-px-3 tw-py-3">
          <TabsNav
            className="tw-m-0 tw-flex-wrap tw-justify-start tw-border-b-0 tw-py-0.5 tw-pl-0 [&_button]:tw-text-xl"
            tabs={tabs}
            renderTab={(caption) => <h3 className="tw-m-0 tw-text-base tw-font-medium">{caption}</h3>}
            onClick={(_, index) => {
              if (index === 0) setActiveTab('Actions');
              if (index === 1) {
                if (canSeeMedicalData) {
                  setActiveTab('Consultations');
                } else {
                  setActiveTab('Créées');
                }
              }
              if (index === 2) {
                setActiveTab('Créées');
              }
            }}
            activeTabIndex={activeTabIndex}
          />
          <div className="flex-col tw-flex tw-items-center tw-gap-2">
            <button
              aria-label="Ajouter une action"
              className={[
                'tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-font-bold tw-text-white tw-transition hover:tw-scale-125',
                activeTab.includes('Consultations') ? 'tw-bg-blue-900' : 'tw-bg-main',
              ].join(' ')}
              onClick={() => {
                const searchParams = new URLSearchParams(history.location.search);
                searchParams.set(activeTab.includes('Actions') ? 'newAction' : 'newConsultation', true);
                searchParams.set('dueAt', period.startDate);
                searchParams.set('completedAt', dayjsInstance(period.startDate).set('hour', 12));
                history.push(`?${searchParams.toString()}`);
              }}>
              ＋
            </button>
            <button
              title="Passer les actions/consultations en plein écran"
              className={[
                'tw-h-6 tw-w-6 tw-rounded-full tw-transition hover:tw-scale-125 disabled:tw-cursor-not-allowed disabled:tw-opacity-30',
                activeTab.includes('Consultations') ? 'tw-text-blue-900' : 'tw-text-main',
              ].join(' ')}
              disabled={!data.length}
              onClick={() => setFullScreen(true)}>
              <FullScreenIcon />
            </button>
          </div>
        </div>
        <div className="w-full tw-max-w-lg tw-bg-white tw-px-7 tw-pb-1">
          <ActionsOrConsultationsFilters setFilterStatus={setFilterStatus} filterStatus={filterStatus} disabled={!data.length} period={period} />
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
          <ActionsSortableList data={filteredData} />
        </div>
      </section>
      <section
        aria-hidden="true"
        className="printonly tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
        <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
          <h3 className="tw-m-0 tw-text-base tw-font-medium">
            Actions À FAIRE/FAITE/ANNULÉE {formatEcheanceLabelPeriod(period)} ({filteredActionsDueOrCompletedAt.length})
          </h3>
          {filterStatus.length > 0 && (
            <h4 className="tw-m-0 tw-text-base tw-font-medium">
              Filtrées par status:{' '}
              {mappedIdsToLabels
                .filter((s) => filterStatus.includes(s._id))
                .map((status) => status.name)
                .join(', ')}
            </h4>
          )}
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
          <ActionsSortableList data={filteredActionsDueOrCompletedAt} showCreatedAt />
        </div>
      </section>
      <section
        aria-hidden="true"
        className="printonly tw-mt-12 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
        <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
          <h3 className="tw-m-0 tw-text-base tw-font-medium">
            Actions créées {formatEcheanceLabelPeriod(period)} ({actionsCreatedAt.length})
          </h3>
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
          <ActionsSortableList data={actionsCreatedAt} showCreatedAt />
        </div>
      </section>

      {canSeeMedicalData && (
        <>
          <section
            aria-hidden="true"
            className="printonly tw-mt-12 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
            <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
              <h3 className="tw-m-0 tw-text-base tw-font-medium">
                Consultations À FAIRE/FAITE/ANNULÉE {formatEcheanceLabelPeriod(period)} ({filteredConsultationsDueOrCompletedAt.length})
              </h3>
              {filterStatus.length > 0 && (
                <h4 className="tw-m-0 tw-text-base tw-font-medium">
                  Filtrées par status:{' '}
                  {mappedIdsToLabels
                    .filter((s) => filterStatus.includes(s._id))
                    .map((status) => status.name)
                    .join(', ')}
                </h4>
              )}
            </div>
            <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
              <ActionsSortableList data={filteredConsultationsDueOrCompletedAt} showCreatedAt />
            </div>
          </section>
          <section
            aria-hidden="true"
            className="printonly tw-mt-12 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
            <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
              <h3 className="tw-m-0 tw-text-base tw-font-medium">
                Consultations créées {formatEcheanceLabelPeriod(period)} ({consultationsCreatedAt.length})
              </h3>
            </div>
            <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
              <ActionsSortableList data={consultationsCreatedAt} showCreatedAt />
            </div>
          </section>
        </>
      )}
      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`${activeTab} (${filteredData.length})`} onClose={() => setFullScreen(false)}>
          <div className="tw-mx-auto tw-mt-2 tw-w-full tw-max-w-lg">
            <ActionsOrConsultationsFilters setFilterStatus={setFilterStatus} filterStatus={filterStatus} disabled={!data.length} period={period} />
          </div>
        </ModalHeader>
        <ModalBody>
          <ActionsSortableList data={filteredData} showCreatedAt />
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
            Fermer
          </button>
          <button
            type="button"
            className="button-submit"
            onClick={() => {
              const searchParams = new URLSearchParams(history.location.search);
              searchParams.set(activeTab.includes('Actions') ? 'newAction' : 'newConsultation', true);
              history.push(`?${searchParams.toString()}`);
            }}>
            ＋ Ajouter une action
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

const ActionsOrConsultationsFilters = ({ setFilterStatus, filterStatus, disabled }) => {
  return (
    <>
      <div className="tw-flex tw-w-full tw-justify-between tw-gap-x-4">
        <div className="tw-flex tw-shrink-0 tw-grow tw-basis-full tw-items-center tw-pl-1 tw-pr-2">
          {/* <label htmlFor="action-select-status-filter" className="tw-text-xs">
            Filtrer par statut
          </label> */}
          <div className="tw-w-full">
            <SelectCustom
              inputId="action-select-status-filter"
              placeholder="Filtrer par statut"
              options={mappedIdsToLabels}
              getOptionValue={(s) => s._id}
              getOptionLabel={(s) => s.name}
              name="status"
              onChange={(s) => setFilterStatus(s.map((s) => s._id))}
              isClearable
              isDisabled={disabled}
              isMulti
              value={mappedIdsToLabels.filter((s) => filterStatus.includes(s._id))}
            />
          </div>
        </div>
      </div>
    </>
  );
};
