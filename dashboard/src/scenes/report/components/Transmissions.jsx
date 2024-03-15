import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { prepareReportForEncryption } from '../../../recoil/reports';
import API from '../../../services/api';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../../components/tailwind/Modal';
import { useDataLoader } from '../../../components/DataLoader';
import SelectAndCreateCollaboration from '../SelectAndCreateCollaboration';

export default function Transmissions({ period, selectedTeamsObject, reports }) {
  const days = useMemo(() => {
    const days = [];
    const endDate = dayjs(period.endDate).startOf('day').add(1, 'day').toISOString();
    let i = 0;
    while (true) {
      const day = dayjs(period.startDate).add(i, 'day').format('YYYY-MM-DD');
      if (day < endDate) {
        days.push(day);
        i++;
      } else {
        break;
      }
    }
    return days;
  }, [period]);

  return (
    <>
      <section className="noprint">
        <h3 className="tw-w-full tw-px-3 tw-py-2 tw-text-base tw-font-medium tw-text-black">👋&nbsp;Comment s'est passée la&nbsp;journée&nbsp;?</h3>
        {days.map((day) => {
          return (
            <details open={days.length === 1} className="tw-my-2 tw-p-2" key={day}>
              <summary>
                <h4 className="tw-inline-block tw-text-base tw-capitalize">{dayjs(day).format('dddd D MMM')}</h4>
              </summary>
              {Object.keys(selectedTeamsObject).map((teamId) => {
                const report = reports.find((report) => report.team === teamId && report.date === day);
                return <Transmission day={day} teamId={teamId} report={report} team={selectedTeamsObject[teamId]} key={teamId + report?._id} />;
              })}
            </details>
          );
        })}
      </section>
      <section
        aria-hidden="true"
        className="printonly tw-mt-12 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
        <h3 className="tw-w-full tw-px-3 tw-py-2 tw-text-base tw-font-medium tw-text-black">👋&nbsp;Comment s'est passée la&nbsp;journée&nbsp;?</h3>
        {days.map((day) => {
          return (
            <div className="tw-border-t tw-border-zinc-200" key={day}>
              <h4 className="tw-inline-block tw-p-4 tw-text-base tw-capitalize">{dayjs(day).format('dddd D MMM')}</h4>
              {Object.keys(selectedTeamsObject).map((teamId) => {
                const report = reports.find((report) => report.team === teamId && report.date === day);
                return <Transmission day={day} teamId={teamId} report={report} team={selectedTeamsObject[teamId]} key={teamId + report?._id} />;
              })}
            </div>
          );
        })}
      </section>
    </>
  );
}

function Transmission({ report, team, day, teamId }) {
  const [isEditingTransmission, setIsEditingTransmission] = useState(false);
  const [collaborations, setCollaborations] = useState(report?.collaborations ?? []);
  const { refresh } = useDataLoader();

  async function onEditTransmission(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const description = formData.get('description');
    onSaveReport({
      ...report,
      description,
      team: teamId,
      date: day,
    });
  }

  const onSaveReport = async (body) => {
    const response = report?._id
      ? await API.put({ path: `report/${report._id}`, body: prepareReportForEncryption(body) })
      : await API.post({ path: 'report', body: prepareReportForEncryption(body) });
    if (!response.ok) {
      toast.error(response.errorMessage);
      return;
    }
    refresh();
    setIsEditingTransmission(false);
  };

  return (
    <>
      <div className="p-2 tw-mb-4 tw-flex tw-flex-col tw-rounded-2xl tw-bg-gray-100 print:tw-mx-4 print:tw-bg-transparent">
        <p className="tw-font-medium">
          {team?.nightSession ? '🌒' : '☀️ '} {team?.name || ''}
        </p>
        <div className="print:tw-ml-4 print:tw-border-l-2 print:tw-border-zinc-300 print:tw-pl-8">
          {!report?.description ? (
            <>
              <h5 className="printonly tw-text-base tw-font-medium">Aucune transmission pour cette journée</h5>
              <button
                onClick={() => setIsEditingTransmission(true)}
                className="noprint tw-mx-auto tw-rounded-lg tw-border tw-border-main tw-px-3 tw-py-1">
                Ajouter une transmission
              </button>
            </>
          ) : (
            <>
              {report?.description?.length > 0 && <h5 className="printonly tw-text-base tw-font-medium">Transmission :</h5>}
              <p className="print:tw-border-l print:tw-border-zinc-200 print:tw-pl-4">
                {report?.description?.split('\n').map((sentence, index) => (
                  <React.Fragment key={index}>
                    {sentence}
                    <br />
                  </React.Fragment>
                ))}
              </p>
              <button
                onClick={() => setIsEditingTransmission(true)}
                className="noprint tw-mx-auto tw-rounded-lg tw-border tw-border-main tw-px-3 tw-py-1">
                Modifier la transmission
              </button>
            </>
          )}
          <hr />
          <div className="tw-my-2">
            {!!collaborations.length && (
              <>
                <p className="tw-mb-2">Co-interventions avec&nbsp;:</p>
                <p className="print:tw-border-l print:tw-border-zinc-200 print:tw-pl-4">{collaborations.join(', ')}</p>
              </>
            )}
            <SelectAndCreateCollaboration
              values={collaborations}
              className="noprint"
              onChange={(e) => {
                const nextCollabs = e.currentTarget.value;
                setCollaborations(nextCollabs);
                onSaveReport({
                  ...report,
                  collaborations: nextCollabs,
                  team: teamId,
                  date: day,
                });
              }}
            />
          </div>
        </div>
      </div>
      <ModalContainer open={isEditingTransmission} size="3xl">
        <ModalHeader title={`Transmission du ${dayjs(day).format('dddd D MMM')} - ${team?.nightSession ? '🌒' : '☀️ '} ${team?.name || ''}`} />
        <ModalBody className="tw-py-4">
          <form id={`edit-transmission-${day}-${teamId}`} className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8" onSubmit={onEditTransmission}>
            <div>
              <label htmlFor="description" className="tailwindui">
                Transmission
              </label>
              <textarea
                rows={27}
                className="tailwindui"
                id="description"
                name="description"
                type="text"
                placeholder="Entrez ici votre transmission de la journée"
                defaultValue={report?.description}
              />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setIsEditingTransmission(false)}>
            Annuler
          </button>
          <button type="submit" className="button-submit" form={`edit-transmission-${day}-${teamId}`}>
            Enregistrer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
}
