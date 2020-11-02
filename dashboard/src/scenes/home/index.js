import React, { useState } from "react";
import styled from "styled-components";
import { Container, Table, Modal, ModalHeader, ModalBody, Button, Row, Col, FormGroup, Input } from "reactstrap";

export default () => {
  const [people, setPeople] = useState(0);
  return (
    <Container>
      <Row style={{ marginTop: "20px" }}>
        <Col>
          <Card>
            <Title>Nombre de personnes</Title>
            <Value>
              {100} <span style={{ fontSize: "19px" }}>personnes</span>
            </Value>
          </Card>
        </Col>
        <Col>
          <Card>
            <Title>Nombre d'actions</Title>
            <Value>
              {43} <span style={{ fontSize: "19px" }}>actions</span>
            </Value>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

const Card = styled.div`
  border-radius: 18px;
  box-shadow: 0 5px 31px 0 #d7dce3;
  margin-bottom: 30px;
  padding: 20px 30px;
  height: 150px;
  background: #fff;
  color: #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media print {
    border: 1px solid #ddd;
  }
`;

const Title = styled.div`
  font-size: 18px;
  margin-bottom: 10px;
  flex-grow: 1;
`;

const Value = styled.div`
  font-size: 40px;
  text-align: center;
  flex-grow: 2;
`;
