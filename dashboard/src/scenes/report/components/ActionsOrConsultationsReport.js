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
import EyeIcon from '../../../assets/icons/EyeIcon';

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
  actionsCompletedAt,
  actionsCanceledAt,
  actionsCreatedAt,
  consultationsCompletedAt,
  consultationsCanceledAt,
  consultationsCreatedAt,
  period,
}) => {
  const history = useHistory();
  const user = useRecoilValue(userState);

  const [activeTab, setActiveTab] = useLocalStorage('reports-actions-consultations-todo-done-toggle', 'Faites');
  const canSeeMedicalData = ['admin', 'normal'].includes(user.role) && !!user.healthcareProfessional;
  const [showActions, setShowActions] = useLocalStorage('reports-actions-consultations-show-actions', true);
  const [showConsultations, setShowConsultations] = useLocalStorage('reports-actions-consultations-show-consults', canSeeMedicalData);

  const activeTabIndex = useMemo(() => {
    if (activeTab.includes('Faites')) return 0;
    if (activeTab.includes('Annulées')) return 1;
    return 2; // activeTab.includes('Créées')
  }, [activeTab, canSeeMedicalData]);

  const [fullScreen, setFullScreen] = useState(false);

  const actions = useMemo(() => {
    if (activeTab.includes('Faites')) return actionsCompletedAt;
    if (activeTab.includes(`Annulées`)) return actionsCanceledAt;
    return actionsCreatedAt;
  }, [activeTab, actionsCompletedAt, actionsCanceledAt, actionsCreatedAt]);

  const consultations = useMemo(() => {
    if (activeTab.includes('Faites')) return consultationsCompletedAt;
    if (activeTab.includes(`Annulées`)) return consultationsCanceledAt;
    return consultationsCreatedAt;
  }, [activeTab, consultationsCompletedAt, consultationsCanceledAt, consultationsCreatedAt]);

  const data = useMemo(() => {
    if (showActions && showConsultations) return [...actions, ...consultations];
    if (showActions) return actions;
    if (showConsultations) return consultations;
    return [];
  }, [activeTab, showActions, showConsultations, actions, consultations]);

  const tabs = [
    `Faites (${canSeeMedicalData ? actionsCompletedAt.length + consultationsCompletedAt.length : actionsCompletedAt.length})`,
    `Annulées (${canSeeMedicalData ? actionsCanceledAt.length + consultationsCanceledAt.length : actionsCanceledAt.length})`,
    `Créées (${canSeeMedicalData ? actionsCreatedAt.length + consultationsCreatedAt.length : actionsCreatedAt.length})`,
  ];

  return (
    <>
      <section title={activeTab} className="noprint tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden">
        <div className="tw-flex tw-items-center tw-bg-white tw-px-3 tw-py-3">
          <TabsNav
            className="tw-m-0 tw-flex-wrap tw-justify-start tw-border-b-0 tw-py-0.5 tw-pl-0 [&_button]:tw-text-xl"
            tabs={tabs}
            renderTab={(caption) => <h3 className="tw-m-0 tw-text-base tw-font-medium">{caption}</h3>}
            onClick={(_, index) => {
              if (index === 0) setActiveTab('Faites');
              if (index === 1) setActiveTab('Annulées');
              if (index === 2) setActiveTab('Créées');
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
          <ActionsOrConsultationsFilters
            showActions={showActions}
            showConsultations={showConsultations}
            setShowActions={setShowActions}
            setShowConsultations={setShowConsultations}
            numberOfActions={actions.length}
            numberOfConsultations={consultations.length}
          />
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
          <ActionsSortableList data={data} />
        </div>
      </section>

      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader
          title={`${canSeeMedicalData ? 'Actions et Consultations' : 'Actions'} ${activeTab} (${data.length})`}
          onClose={() => setFullScreen(false)}>
          <div className="tw-mx-auto tw-mt-2 tw-w-full tw-max-w-lg">
            <ActionsOrConsultationsFilters
              showActions={showActions}
              showConsultations={showConsultations}
              setShowActions={setShowActions}
              setShowConsultations={setShowConsultations}
              numberOfActions={actions.length}
              numberOfConsultations={consultations.length}
            />
          </div>
        </ModalHeader>
        <ModalBody>
          <ActionsSortableList data={data} showCreatedAt />
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

const ActionsOrConsultationsFilters = ({
  setShowActions,
  setShowConsultations,
  showActions,
  showConsultations,
  numberOfActions,
  numberOfConsultations,
}) => {
  return (
    <>
      <div className="tw-flex tw-w-full tw-justify-between tw-gap-x-4">
        <div className="tw-flex tw-shrink-0 tw-grow tw-basis-full tw-items-center tw-gap-x-4 tw-pl-1 tw-pr-2">
          <button
            type="button"
            className={[
              'tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-md tw-border tw-border-main/20 tw-py-1 tw-px-4',
              showActions ? '' : 'tw-opacity-50',
            ].join(' ')}
            onClick={() => setShowActions((show) => !show)}>
            <EyeIcon size={15} strikedThrough={!showActions} /> Actions ({numberOfActions})
          </button>
          <button
            type="button"
            className={[
              'tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-md tw-border tw-border-main/20 tw-py-1 tw-px-4',
              showConsultations ? '' : 'tw-opacity-50',
            ].join(' ')}
            onClick={() => setShowConsultations((show) => !show)}>
            <EyeIcon size={15} strikedThrough={!showConsultations} /> Consultations ({numberOfConsultations})
          </button>
        </div>
      </div>
    </>
  );
};
