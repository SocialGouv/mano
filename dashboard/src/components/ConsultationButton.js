import React from 'react';
import styled from 'styled-components';

export default function ConsultationButton({ ...props }) {
  return <ConsultationButtonStyled {...props}>🩺</ConsultationButtonStyled>;
}

const ConsultationButtonStyled = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 30px;
  margin-left: 5px;
  box-shadow: none;
  border: 2px solid #0969da;
  color: #0969da;
  font-size: 20px;
  font-weight: bold;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: #fef2f2;
`;
