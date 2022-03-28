import React from 'react';
import styled from 'styled-components';
import { theme } from '../config';

export default function QuestionMarkButton({ ...props }) {
  return <QuestionMarkButtonDiv {...props}>?</QuestionMarkButtonDiv>;
}

const QuestionMarkButtonDiv = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 20px;
  margin-left: 10px;
  box-shadow: none;
  border: 1px solid ${theme.main};
  color: ${theme.main};
  font-size: 12px;
  font-weight: bold;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  &:hover {
    background-color: ${theme.main};
    color: #fff;
  }
`;
