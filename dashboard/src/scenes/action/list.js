import { Badge, Container } from 'reactstrap';
import { useHistory } from 'react-router-dom';

import Header from '../../components/header';
import Loading from '../../components/loading';
import Table from '../../components/table';
import { useRecoilValue } from 'recoil';
import { actionsState } from '../../recoil/actions';

export default function ActionList() {
  const action = useRecoilValue(actionsState);
  const history = useHistory();

  if (!action) return <Loading />;

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title="Actions" />
      <Table
        data={action}
        rowKey={'_id'}
        onRowClick={(i) => history.push(`/action/${i._id}`)}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          { title: 'Créée le', dataKey: 'createdAt', render: (i) => (i.createdAt || '').slice(0, 10) },
          { title: 'À faire le', dataKey: 'dueAt', render: (i) => (i.createdAt || '').slice(0, 10) },
          { title: 'Status', dataKey: 'status', render: (i) => <Status status={i.status} /> },
        ]}
      />
    </Container>
  );
}

const Status = ({ status }) => {
  if (status === 'A FAIRE') return <Badge color="danger">{status}</Badge>;
  if (status === 'FAIT') return <Badge color="success">{status}</Badge>;
  return <div />;
};
