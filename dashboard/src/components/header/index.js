import React from 'react';
import { Button as LinkButton } from 'reactstrap';
import styled from 'styled-components';
import { theme } from '../../config';
import BackButton from '../backButton';
import { useDataLoader } from '../DataLoader';

export const Header = ({ title, refreshButton = false, style = {}, titleStyle = {}, className = '' }) => {
  return (
    <HeaderStyled style={style} className={className}>
      <Title style={titleStyle}>{title}</Title>
      {Boolean(refreshButton) && <RefreshButton />}
    </HeaderStyled>
  );
};

export const RefreshButton = () => {
  const { refresh, isLoading } = useDataLoader();
  return (
    <LinkButton onClick={() => refresh()} disabled={isLoading} color="link" style={{ marginRight: 10 }}>
      Rafraichir
    </LinkButton>
  );
};

export const SmallHeaderWithBackButton = (props) => {
  return <Header style={{ padding: '16px 0', ...props.style }} title={<BackButton />} {...props} />;
};

export const SmallHeader = (props) => {
  return <Header style={{ padding: '16px 0', ...props.style }} titleStyle={{ fontWeight: '400' }} {...props} />;
};

export const HeaderStyled = styled.div`
  padding: 48px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Title = styled.h2`
  color: ${theme.black};
  font-weight: bold;
  font-size: 24px;
  line-height: 32px;
`;

export default Header;
