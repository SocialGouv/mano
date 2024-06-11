import { useHistory } from "react-router-dom";
import DateBloc from "../../../components/DateBloc";
import Table from "../../../components/table";
import PersonName from "../../../components/PersonName";

export default function TreatmentsSortableList({ treatments }) {
  const history = useHistory();

  return (
    <Table
      className="Table"
      data={treatments}
      noData="Pas de traitement"
      onRowClick={(treatment) => {
        const searchParams = new URLSearchParams(history.location.search);
        searchParams.set("treatmentId", treatment._id);
        history.push(`?${searchParams.toString()}`);
      }}
      rowKey="_id"
      columns={[
        {
          title: "Début",
          dataKey: "startDate",
          render: (treatment) => <DateBloc date={treatment.startDate} />,
        },
        {
          title: "Fin",
          dataKey: "endDate",
          render: (treatment) => <DateBloc date={treatment.endDate} />,
        },
        {
          title: "Nom",
          dataKey: "name",
        },
        {
          title: "Dosage",
          dataKey: "dosage",
        },
        {
          title: "Fréquence",
          dataKey: "frequency",
        },
        {
          title: "Indication",
          dataKey: "indication",
        },
        {
          title: "Personne suivie",
          dataKey: "person",
          render: (treatment) => <PersonName item={treatment} />,
        },
      ]}
    />
  );
}
