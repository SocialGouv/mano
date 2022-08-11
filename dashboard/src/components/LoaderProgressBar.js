import React from 'react';
import styled from 'styled-components';
import { theme } from '../config';

export default function ProgressBar({ loadingText, progress }) {
  return (
    <>
      <ProgressContainer>
        <Progress progress={progress} />
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
  width: ${(p) => p.progress * 100}%;
  min-width: 10%;
  height: 5px;
  background-color: ${theme.main};
`;
