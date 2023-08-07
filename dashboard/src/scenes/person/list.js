import { Container } from 'reactstrap';
import { useHistory } from 'react-router-dom';

import Header from '../../components/header';
import Loading from '../../components/loading';
import Table from '../../components/table';
import { useRecoilValue } from 'recoil';
import { personsState } from '../../recoil/persons';

export default function PersonsList() {
  const people = useRecoilValue(personsState);
  const history = useHistory();

  if (!people) return <Loading />;

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title="Usagers" />
      <Table
        data={people}
        rowKey={'_id'}
        onRowClick={(i) => history.push(`/person/${i._id}`)}
        columns={[
          { title: 'Nom', dataKey: 'name' },
          { title: 'Créée le', dataKey: 'createdAt', render: (i) => (i.createdAt || '').slice(0, 10) },
        ]}
      />
      {/* <Page {...pagination} onChange={getPeople} /> */}
    </Container>
  );
}
