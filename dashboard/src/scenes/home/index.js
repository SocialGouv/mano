import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Col, Container, Row } from 'reactstrap';
import Header from '../../components/header';

import { theme } from '../../config';
import { useRecoilValue } from 'recoil';
import { personsState } from '../../recoil/persons';
import { actionsState } from '../../recoil/actions';
import API from '../../services/api';

export default function Home() {
  return (
    <>
      <Container>
        <Header title="Accueil" />

        <Row style={{ marginTop: '20px' }}>
          <BlockPersons filters={[]} />
          <BlockActions filters={[]} />
          <BlockStructure filters={[]} />
        </Row>
      </Container>
    </>
  );
}

const BlockPersons = ({ filters }) => {
  const persons = useRecoilValue(personsState);
  const count = persons.length;

  return (
    <Col md={4}>
      <Card title={"Nombre d'usagers suivi"} count={count} />
    </Col>
  );
};

const BlockActions = ({ filters }) => {
  const actions = useRecoilValue(actionsState);
  const count = actions.length;

  return (
    <Col md={4}>
      <Card title={'Nombre d’actions'} count={count} />
    </Col>
  );
};

const BlockStructure = ({ filters }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getCount();
  }, []);

  const getCount = async () => {
    const response = await API.get({ path: '/structure' });
    if (!response.ok) return;
    setCount(response.data.length);
  };
  return (
    <Col md={4}>
      <Card title={'Nombre de structures'} count={count} />
    </Col>
  );
};

const Card = ({ title, count }) => (
  <CardWrapper>
    <CardTitle>{title}</CardTitle>
    <CardCount>{count}</CardCount>
  </CardWrapper>
);

const CardWrapper = styled.div`
  background: ${theme.white};
  padding: 24px 0 40px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  font-weight: bold;
  height: 184px;
  margin-bottom: 10px;
`;

const CardTitle = styled.div`
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  color: ${theme.black};
`;

const CardCount = styled.div`
  font-size: 56px;
  line-height: 64px;
  color: ${theme.main};
`;
