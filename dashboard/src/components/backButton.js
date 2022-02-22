import React from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../config';

const BackButtonWrapperStyled = styled.a`
  ${(props) => props.withArrow && `background: url(${require('../assets/back.svg')}) left center no-repeat;`}

  background-size: 20px;
  color: ${theme.main};
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  padding-left: 25px;
  margin: 20px 0;
  line-height: 3;
  border-radius: 8px;
  cursor: pointer;
  border: 0;
`;

const BackButton = () => {
  const history = useHistory();
  return <BackButtonWrapper withArrow onClick={() => history.goBack()} caption="Retour" />;
};

export const BackButtonWrapper = ({ onClick, caption, withArrow }) => (
  <BackButtonWrapperStyled className="noprint" onClick={onClick} withArrow={withArrow}>
    {caption}
  </BackButtonWrapperStyled>
);

export default BackButton;
