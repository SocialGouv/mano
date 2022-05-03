import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import { useRecoilValue } from "recoil";
import styled from "styled-components";
import { actionsState, TODO } from "../recoil/actions";
import { currentTeamState } from "../recoil/auth";
import { personsState } from "../recoil/persons";
import { formatTime } from "../services/date";
import DateBloc from "./DateBloc";
import Table from "./table";

export default function Notification() {
  const history = useHistory();
  const [showModal, setShowModal] = useState(false);
  const currentTeam = useRecoilValue(currentTeamState);
  const persons = useRecoilValue(personsState);
  const actions = useRecoilValue(actionsState);
  const actionsFiltered = useMemo(
    () =>
      actions.filter(
        (action) =>
          action.team === currentTeam._id &&
          action.status === TODO &&
          action.urgent
      ),
    [actions, currentTeam._id]
  );
  if (!actionsFiltered.length) return null;
  return (
    <>
      <div style={{ alignSelf: "center", display: "flex", cursor: "pointer" }} onClick={() => setShowModal(true)}>
        <div style={{ fontSize: "1.5rem" }}>🔔</div> <div style={{ marginTop: "10px", marginLeft: "-10px" }}><span className="badge badge-pill badge-danger">{actionsFiltered.length}</span></div>
      </div>
      <StyledModal isOpen={showModal} toggle={() => setShowModal(false)} size="lg">
        <ModalHeader toggle={() => setShowModal(false)}>🔔 &nbsp;Actions urgentes et vigilance</ModalHeader>
        <ModalBody>
          <Table
            data={actionsFiltered}
            rowKey={'_id'}
            onRowClick={(actionOrConsultation) => {
              setShowModal(false);
              history.push(`/action/${actionOrConsultation._id}`);
            }}
            columns={[
              {
                title: 'À faire le',
                dataKey: 'dueAt' || '_id',
                render: (action) => {
                  return <DateBloc date={action.dueAt} />;
                },
              },
              {
                title: 'Heure',
                dataKey: '_id',
                render: (action) => {
                  if (!action.dueAt || !action.withTime) return null;
                  return formatTime(action.dueAt);
                },
              },
              { title: 'Nom', dataKey: 'name' },
              {
                title: 'Personne suivie',
                dataKey: 'person',
                render: (action) => <>{persons.find((p) => p._id === action.person)?.name}</>,
              },
            ]}
          />
        </ModalBody>
      </StyledModal>
    </>
  )
}
const StyledModal = styled(Modal)`
  @media (min-width: 576px) {
    max-width: 800px;
  }
`;
