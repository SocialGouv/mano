import { useMemo, useState } from "react";
import { CustomResponsivePie } from "./charts";
import { getPieData } from "./utils";
import { organisationState, userState } from "../../recoil/auth";
import { useRecoilValue } from "recoil";
import { Block } from "./Blocks";
import CustomFieldsStats from "./CustomFieldsStats";
import Filters from "../../components/Filters";
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from "../../components/tailwind/Modal";
import ActionsSortableList from "../../components/ActionsSortableList";

export default function ConsultationsStats({ consultations, personsWithConsultations, filterBase, filterPersons, setFilterPersons }) {
  const organisation = useRecoilValue(organisationState);
  const [actionsModalOpened, setActionsModalOpened] = useState(false);
  const [slicedData, setSlicedData] = useState([]);
  const user = useRecoilValue(userState);

  const filterTitle = useMemo(() => {
    if (!filterPersons.length) return `Filtrer par personnes suivies :`;
    if (personsWithConsultations === 1)
      return `Filtrer par personnes suivies (${personsWithConsultations} personne concernée par le filtre actuel) :`;
    return `Filtrer par personnes suivies (${personsWithConsultations} personnes concernées par le filtre actuel) :`;
  }, [filterPersons, personsWithConsultations]);

  const consultationsByType = useMemo(() => {
    const _consultationsByType = {};
    for (const consultationSetting of organisation.consultations) {
      _consultationsByType[consultationSetting.name] = { persons: {}, data: [] };
    }
    for (const consultation of consultations) {
      if (!_consultationsByType[consultation.type]) _consultationsByType[consultation.type] = { persons: {}, data: [] };
      _consultationsByType[consultation.type].data.push(consultation);
      _consultationsByType[consultation.type].persons[consultation.person] = true;
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
        open={window.localStorage.getItem("consultations-stats-general-open") === "true"}
        onToggle={(e) => {
          if (e.target.open) {
            window.localStorage.setItem("consultations-stats-general-open", "true");
          } else {
            window.localStorage.removeItem("consultations-stats-general-open");
          }
        }}
      >
        <summary className="tw-mx-0 tw-my-8">
          <h4 className="tw-inline tw-text-xl tw-text-black75">Global</h4>
        </summary>
        <div className="tw-mb-5 tw-flex tw-justify-center">
          <Block
            data={consultations}
            title="Nombre de consultations"
            help={`Nombre de consultations réalisées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
          />
          <Block
            data={personsWithConsultations}
            title="Nombre de personnes suivies"
            help={`Nombre de personnes suivies ayant eu une consultation dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
          />
        </div>
        <CustomResponsivePie
          title="Consultations par type"
          data={getPieData(consultations, "type")}
          onItemClick={
            user.role === "stats-only"
              ? undefined
              : (newSlice) => {
                  setActionsModalOpened(true);
                  setSlicedData(consultationsByType[newSlice].data);
                }
          }
          help={`Répartition par type des consultations réalisées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
        />
        <CustomResponsivePie
          title="Consultations par statut"
          data={getPieData(consultations, "status")}
          onItemClick={
            user.role === "stats-only"
              ? undefined
              : (newSlice) => {
                  setActionsModalOpened(true);
                  setSlicedData(consultations.filter((c) => c.status === newSlice));
                }
          }
          help={`Répartition par statut des consultations réalisées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
        />
      </details>
      {organisation.consultations.map((c) => {
        return (
          <details
            open={window.localStorage.getItem(`person-stats-${c.name.replace(" ", "-").toLocaleLowerCase()}-open`) === "true"}
            onToggle={(e) => {
              if (e.target.open) {
                window.localStorage.setItem(`person-stats-${c.name.replace(" ", "-").toLocaleLowerCase()}-open`, "true");
              } else {
                window.localStorage.removeItem(`person-stats-${c.name.replace(" ", "-").toLocaleLowerCase()}-open`);
              }
            }}
            key={c.name}
          >
            <summary className="tw-mx-0 tw-my-8">
              <h4 className="tw-inline tw-text-xl tw-text-black75">
                Statistiques des consultations de type « {c.name} » ({consultationsByType[c.name]?.data?.length ?? 0})
              </h4>
            </summary>
            <div className="tw-mb-5 tw-flex tw-justify-center">
              <Block
                data={consultationsByType[c.name].data.length}
                title="Nombre de consultations"
                help={`Nombre de consultations réalisées dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
              />
              <Block
                data={Object.keys(consultationsByType[c.name].persons).length}
                title="Nombre de personnes suivies"
                help={`Nombre de personnes suivies ayant eu une consultation dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des consultations.`}
              />
            </div>
            <CustomFieldsStats
              data={consultationsByType[c.name].data}
              customFields={c.fields}
              onSliceClick={
                user.role === "stats-only"
                  ? undefined
                  : (newSlice, field) => {
                      setActionsModalOpened(true);
                      if (newSlice === "Non renseigné") {
                        setSlicedData(consultationsByType[c.name].data.filter((c) => !c[field]));
                      } else {
                        setSlicedData(consultationsByType[c.name].data.filter((c) => c[field] === newSlice));
                      }
                    }
              }
              help={(label) => `${label.capitalize()} des consultations réalisées dans la période définie.`}
              totalTitleForMultiChoice={<span className="tw-font-bold">Nombre de consultations concernées</span>}
            />
          </details>
        );
      })}
      <SelectedActionsModal
        open={actionsModalOpened}
        onClose={() => {
          setActionsModalOpened(false);
        }}
        onAfterLeave={() => {
          setSlicedData([]);
        }}
        data={slicedData}
        title={`Consultations (${slicedData.length})`}
      />
    </>
  );
}

const SelectedActionsModal = ({ open, onClose, data, title, onAfterLeave }) => {
  return (
    <ModalContainer open={open} size="full" onClose={onClose} onAfterLeave={onAfterLeave}>
      <ModalHeader title={title} />
      <ModalBody>
        <div className="tw-p-4">
          <ActionsSortableList data={data} limit={20} />
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          name="cancel"
          className="button-cancel"
          onClick={() => {
            onClose(null);
          }}
        >
          Fermer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};
