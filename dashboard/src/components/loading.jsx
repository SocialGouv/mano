import React from 'react';
import { Spinner } from 'reactstrap';
import styled from 'styled-components';

const Loading = () => {
  return (
    <LoadingWrapper>
      <Spinner style={{ width: 100, height: 100 }} color={'primary'} />
    </LoadingWrapper>
  );
};

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

export default Loading;
