import React from 'react';
import styled from 'styled-components';
import { theme } from '../config';

export default function ProgressBar({ loadingText, progress, total }) {
  const status = progress !== null && total !== null ? progress / total : 0.01;
  return (
    <>
      <ProgressContainer>
        <Progress status={status} />
      </ProgressContainer>
      <Caption>{loadingText}</Caption>
    </>
  );
}

const Caption = styled.span`
  width: 100%;
  color: ${theme.main};
  padding: 0px 5px;
  text-align: left;
  display: block;
  box-sizing: border-box;
  font-size: 10px;
`;

const ProgressContainer = styled.div`
  width: 100%;
`;

const Progress = styled.div`
  width: ${(p) => Math.min(p.status, 1) * 100}%;
  min-width: 5%;
  height: 5px;
  background-color: ${theme.main};
`;
