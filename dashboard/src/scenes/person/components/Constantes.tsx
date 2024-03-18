import { useRecoilValue } from "recoil";
import { arrayOfitemsGroupedByConsultationSelector } from "../../../recoil/selectors";
import { useMemo } from "react";
import { dayjsInstance } from "../../../services/date";
import { Datum, ResponsiveLine } from "@nivo/line";
import { PersonPopulated } from "../../../types/person";
import { ColorSchemeId } from "@nivo/colors";

const TEXT_NOT_ENOUGH_DATA = "Pas assez de données pour afficher le graphique d'évolution, vous devez effectuer au moins deux consultations";

export default function Constantes({ person }: { person: PersonPopulated }) {
  const allConsultations = useRecoilValue(arrayOfitemsGroupedByConsultationSelector);

  const personConsultations = useMemo(() => (allConsultations || []).filter((c) => c.person === person._id), [allConsultations, person._id]);
  const personConsultationsFiltered = useMemo(
    () =>
      personConsultations.filter(
        (c) =>
          c["constantes-poids"] ||
          c["constantes-frequence-cardiaque"] ||
          c["constantes-taille"] ||
          c["constantes-saturation-o2"] ||
          c["constantes-temperature"] ||
          c["constantes-glycemie-capillaire"] ||
          c["constantes-frequence-respiratoire"] ||
          c["constantes-tension-arterielle-systolique"] ||
          c["constantes-tension-arterielle-diastolique"]
      ),
    [personConsultations]
  );

  const constantesPoids = personConsultationsFiltered
    .filter((c) => c["constantes-poids"])
    .map((c) => ({ x: dayjsInstance(c.completedAt || c.dueAt).format("YYYY-MM-DD"), y: c["constantes-poids"] }))
    .sort((a, b) => (a.x > b.x ? 1 : -1));

  const constantesTaille = personConsultationsFiltered
    .filter((c) => c["constantes-taille"])
    .map((c) => ({ x: dayjsInstance(c.completedAt || c.dueAt).format("YYYY-MM-DD"), y: c["constantes-taille"] }))
    .sort((a, b) => (a.x > b.x ? 1 : -1));

  const constantesFrequenceCardiaque = personConsultationsFiltered
    .filter((c) => c["constantes-frequence-cardiaque"])
    .map((c) => ({ x: dayjsInstance(c.completedAt || c.dueAt).format("YYYY-MM-DD"), y: c["constantes-frequence-cardiaque"] }))
    .sort((a, b) => (a.x > b.x ? 1 : -1));
  const constantesSaturationO2 = personConsultationsFiltered
    .filter((c) => c["constantes-saturation-o2"])
    .map((c) => ({ x: dayjsInstance(c.completedAt || c.dueAt).format("YYYY-MM-DD"), y: c["constantes-saturation-o2"] }))
    .sort((a, b) => (a.x > b.x ? 1 : -1));
  const constantesTemperature = personConsultationsFiltered
    .filter((c) => c["constantes-temperature"])
    .map((c) => ({ x: dayjsInstance(c.completedAt || c.dueAt).format("YYYY-MM-DD"), y: c["constantes-temperature"] }))
    .sort((a, b) => (a.x > b.x ? 1 : -1));
  const constantesGlycemieCapillaire = personConsultationsFiltered
    .filter((c) => c["constantes-glycemie-capillaire"])
    .map((c) => ({ x: dayjsInstance(c.completedAt || c.dueAt).format("YYYY-MM-DD"), y: c["constantes-glycemie-capillaire"] }))
    .sort((a, b) => (a.x > b.x ? 1 : -1));
  const constantesFrequenceRespiratoire = personConsultationsFiltered
    .filter((c) => c["constantes-frequence-respiratoire"])
    .map((c) => ({ x: dayjsInstance(c.completedAt || c.dueAt).format("YYYY-MM-DD"), y: c["constantes-frequence-respiratoire"] }))
    .sort((a, b) => (a.x > b.x ? 1 : -1));
  const constantesTensionArterielleSystolique = personConsultationsFiltered
    .filter((c) => c["constantes-tension-arterielle-systolique"])
    .map((c) => ({ x: dayjsInstance(c.completedAt || c.dueAt).format("YYYY-MM-DD"), y: c["constantes-tension-arterielle-systolique"] }))
    .sort((a, b) => (a.x > b.x ? 1 : -1));
  const constantesTensionArterielleDiastolique = personConsultationsFiltered
    .filter((c) => c["constantes-tension-arterielle-diastolique"])
    .map((c) => ({ x: dayjsInstance(c.completedAt || c.dueAt).format("YYYY-MM-DD"), y: c["constantes-tension-arterielle-diastolique"] }))
    .sort((a, b) => (a.x > b.x ? 1 : -1));

  return (
    <div className="noprint tw-my-4 tw-grid tw-grid-cols-2 tw-gap-3">
      <LineChart data={constantesPoids} name="Poids" scheme="set1" unit="kg" />
      <LineChart data={constantesTaille} name="Taille" scheme="dark2" unit="cm" />
      <LineChart data={constantesFrequenceCardiaque} name="Fréquence cardiaque" scheme="category10" unit="bpm" />
      <LineChart data={constantesFrequenceRespiratoire} name="Fréquence respiratoire" scheme="accent" unit="mvt/min" />
      <LineChart data={constantesSaturationO2} name="Saturation O2" scheme="paired" unit="%" />
      <LineChart data={constantesTemperature} name="Température" scheme="paired" unit="°C" />
      <LineChart data={constantesGlycemieCapillaire} name="Glycémie capillaire" scheme="set2" unit="g/L" />
      <LineChartTensionArterielle systolique={constantesTensionArterielleSystolique} diastolique={constantesTensionArterielleDiastolique} />
    </div>
  );
}

function LineChart({ data, name, scheme, unit }: { data: Datum[]; name: string; scheme: ColorSchemeId; unit: string }) {
  if (data.length === 0) return;
  if (data.length === 1) {
    const d = data[0];
    return (
      <CardText name={name}>
        <div>
          <div className=" tw-text-4xl tw-font-bold tw-text-gray-600">
            {String(d.y)} {unit}
          </div>
          <div className=" tw-mb-4 tw-text-sm tw-text-gray-600">constante relevée le {dayjsInstance(d.x).format("DD/MM/YYYY")}</div>
          <div className="tw-text-sm tw-text-gray-400">{TEXT_NOT_ENOUGH_DATA}</div>
        </div>
      </CardText>
    );
  }

  // Generate kind-of unique ID based on data
  const id = data.reduce((acc, d) => acc + Number(d.y), 0);

  return (
    <div className="tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-p-4 tw-shadow">
      <div className="tw-text-lg tw-font-bold">
        {name} <small className="tw-text-stone-500">{unit}</small>
      </div>
      <div className="tw-h-[260px]">
        <ResponsiveLine
          colors={{ scheme }}
          data={[
            {
              // https://github.com/plouc/nivo/issues/1006#issuecomment-805473070
              id: name + id, // to avoid having the same id for different data
              data,
            },
          ]}
          margin={{ top: 40, right: 40, bottom: 50, left: 40 }}
          useMesh
          axisBottom={{ format: "%d/%m" }}
          curve="monotoneX"
          xFormat="time:%Y-%m-%d"
          xScale={{ format: "%Y-%m-%d", precision: "day", type: "time", useUTC: false }}
          yScale={{ type: "linear", min: "auto", max: "auto" }}
          tooltip={({ point }) => {
            return (
              <div className="tw-rounded tw-bg-white tw-p-1 tw-shadow">
                <div className="tw-text-xs tw-text-gray-400">{dayjsInstance(point.data.x).format("DD/MM")}</div>
                <div className="tw-text-base tw-font-bold">
                  {String(point.data.y)} {unit}
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

function LineChartTensionArterielle({ systolique, diastolique }: { systolique: Datum[]; diastolique: Datum[] }) {
  if (systolique.length === 0 && diastolique.length === 0) return;
  if (systolique.length === 1 && diastolique.length === 0) {
    return (
      <CardText name="Tension artérielle">
        <div>
          <div className=" tw-text-4xl tw-font-bold tw-text-gray-600">{String(systolique[0].y)} (sys)</div>
          <div className=" tw-mb-4 tw-text-sm tw-text-gray-600">constante relevée le {dayjsInstance(systolique[0].x).format("DD/MM/YYYY")}</div>
          <div className="tw-text-sm tw-text-gray-400">{TEXT_NOT_ENOUGH_DATA}</div>
        </div>
      </CardText>
    );
  }
  if (systolique.length === 0 && diastolique.length === 1) {
    return (
      <CardText name="Tension artérielle">
        <div>
          <div className=" tw-text-4xl tw-font-bold tw-text-gray-600">{String(diastolique[0].y)} (dia)</div>
          <div className=" tw-mb-4 tw-text-sm tw-text-gray-600">constante relevée le {dayjsInstance(diastolique[0].x).format("DD/MM/YYYY")}</div>
          <div className="tw-text-sm tw-text-gray-400">{TEXT_NOT_ENOUGH_DATA}</div>
        </div>
      </CardText>
    );
  }
  if (systolique.length === 1 && diastolique.length === 1) {
    return (
      <CardText name="Tension artérielle">
        <div>
          <div className=" tw-text-4xl tw-font-bold tw-text-gray-600">
            {String(systolique[0].y)} (sys) / {String(diastolique[0].y)} (dia) mmHg
          </div>
          <div className=" tw-mb-4 tw-text-sm tw-text-gray-600">constante relevée le {dayjsInstance(systolique[0].x).format("DD/MM/YYYY")}</div>
          <div className="tw-text-sm tw-text-gray-400">{TEXT_NOT_ENOUGH_DATA}</div>
        </div>
      </CardText>
    );
  }

  // Generate kind-of unique ID based on data
  const idSys = systolique.reduce((acc, d) => acc + Number(d.y), 0);
  const idDia = diastolique.reduce((acc, d) => acc + Number(d.y), 0);
  return (
    <div className="tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-p-4 tw-shadow">
      <div className="tw-text-lg tw-font-bold">
        Tension artérielle <small className="tw-text-stone-500">mmHg</small>
      </div>
      <div className="tw-h-[260px]">
        <ResponsiveLine
          colors={{ scheme: "set1" }}
          data={[
            { id: idSys, data: systolique },
            { id: idDia, data: diastolique },
          ]}
          margin={{ top: 40, right: 40, bottom: 50, left: 40 }}
          useMesh
          axisBottom={{ format: "%d/%m" }}
          curve="monotoneX"
          xFormat="time:%Y-%m-%d"
          xScale={{ format: "%Y-%m-%d", precision: "day", type: "time", useUTC: false }}
          yScale={{ type: "linear", min: "auto", max: "auto" }}
          tooltip={({ point }) => {
            return (
              <div className="tw-rounded tw-bg-white tw-p-1 tw-shadow">
                <div className="tw-text-xs tw-text-gray-400">{dayjsInstance(point.data.x).format("DD/MM")}</div>
                <div className="tw-text-base tw-font-bold">{String(point.data.y)} mmHg</div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

function CardText({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <div className="tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-p-4 tw-shadow">
      <div className="tw-text-lg tw-font-bold">{name}</div>
      <div className="tw-h-[260px]">
        <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-center">{children}</div>
      </div>
    </div>
  );
}
