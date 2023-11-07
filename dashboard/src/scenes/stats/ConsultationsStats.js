import React, { useMemo } from 'react';
import { CustomResponsivePie } from './charts';
import { getPieData } from './utils';
import { organisationState } from '../../recoil/auth';
import { useRecoilValue } from 'recoil';
import { Block } from './Blocks';
import CustomFieldsStats from './CustomFieldsStats';
import Filters from '../../components/Filters';

export default function ConsultationsStats({ consultations, personsWithConsultations, filterBase, filterPersons, setFilterPersons }) {
  const organisation = useRecoilValue(organisationState);

  const filterTitle = useMemo(() => {
    if (!filterPersons.length) return `Filtrer par personnes suivies :`;
    if (personsWithConsultations === 1)
      return `Filtrer par personnes suivies (${personsWithConsultations} personne concernée par le filtre actuel) :`;
    return `Filtrer par personnes suivies (${personsWithConsultations} personnes concernées par le filtre actuel) :`;
  }, [filterPersons, personsWithConsultations]);

  const consultationsByType = useMemo(() => {
    const _consultationsByType = {};
    for (const consultationSetting of organisation.consultations) {
      _consultationsByType[consultationSetting.name] = [];
    }
    for (const consultation of consultations) {
      if (!_consultationsByType[consultation.type]) _consultationsByType[consultation.type] = [];
      _consultationsByType[consultation.type].push(consultation);
    }
    return _consultationsByType;
  }, [consultations, organisation.consultations]);

  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des consultations</h3>
      <div className="tw-flex tw-basis-full tw-items-center">
        <Filters title={filterTitle} base={filterBase} filters={filterPersons} onChange={setFilterPersons} />
      </div>
      <details
        open={window.localStorage.getItem('consultations-stats-general-open') === 'true'}
        onToggle={(e) => {
          if (e.target.open) {
            window.localStorage.setItem('consultations-stats-general-open', 'true');
          } else {
            window.localStorage.removeItem('consultations-stats-general-open');
          }
        }}>
        <summary className="tw-my-8 tw-mx-0">
          <h4 className="tw-inline tw-text-xl tw-text-black75">Global</h4>
        </summary>
        <div className="tw-mb-5 tw-flex tw-justify-center">
          <Block
            data={consultations}
            title="Nombre de consultations"
            help={`Nombre de consultations réalisées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
          />
        </div>
        <CustomResponsivePie
          title="Consultations par type"
          data={getPieData(consultations, 'type')}
          help={`Répartition par type des consultations réalisées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
        />
        <CustomResponsivePie
          title="Consultations par statut"
          data={getPieData(consultations, 'status')}
          help={`Répartition par statut des consultations réalisées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
        />
      </details>
      {organisation.consultations.map((c) => {
        return (
          <details
            open={window.localStorage.getItem(`person-stats-${c.name.replace(' ', '-').toLocaleLowerCase()}-open`) === 'true'}
            onToggle={(e) => {
              if (e.target.open) {
                window.localStorage.setItem(`person-stats-${c.name.replace(' ', '-').toLocaleLowerCase()}-open`, 'true');
              } else {
                window.localStorage.removeItem(`person-stats-${c.name.replace(' ', '-').toLocaleLowerCase()}-open`);
              }
            }}
            key={c.name}>
            <summary className="tw-my-8 tw-mx-0">
              <h4 className="tw-inline tw-text-xl tw-text-black75">
                Statistiques des consultations de type « {c.name} » ({consultationsByType[c.name]?.length ?? 0})
              </h4>
            </summary>
            <CustomFieldsStats
              data={consultationsByType[c.name]}
              customFields={c.fields}
              help={(label) => `${label.capitalize()} des consultations réalisées dans la période définie.`}
              totalTitleForMultiChoice={<span className="tw-font-bold">Nombre de consultations concernées</span>}
            />
          </details>
        );
      })}
    </>
  );
}
