import React from 'react';
import styled from 'styled-components';

export default function ExclamationMarkButton({ ...props }) {
  return <ExclamationMarkButtonDiv {...props}>!</ExclamationMarkButtonDiv>;
}

const ExclamationMarkButtonDiv = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 20px;
  margin-left: 5px;
  box-shadow: none;
  border: 2px solid #dc2626;
  color: #dc2626;
  font-size: 14px;
  font-weight: bold;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: #fef2f2;
  flex-shrink: 0;
`;
