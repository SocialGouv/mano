import React from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../config';
import backImage from '../assets/back.svg';

const BackButtonWrapperStyled = styled.a`
  ${(props) => props.withArrow && `background: url(${backImage}) left center no-repeat;`}

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
  ${(props) => props.disabled && `opacity: 0.5; pointer-events: none; cursor: default;`}
`;

const BackButton = () => {
  const history = useHistory();
  return <BackButtonWrapper withArrow onClick={() => history.goBack()} caption="Retour" />;
};

export const BackButtonWrapper = ({ onClick, caption, withArrow, disabled = false, title = '' }) => (
  <BackButtonWrapperStyled className="noprint" onClick={onClick} withArrow={withArrow} disabled={disabled} title={title}>
    {caption}
  </BackButtonWrapperStyled>
);

export default BackButton;
