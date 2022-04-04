import React from 'react';
import { Button as LinkButton } from 'reactstrap';
import styled from 'styled-components';
import { theme } from '../../config';
import BackButton from '../backButton';

const Header = ({ title, onRefresh, loading, style = {}, titleStyle = {}, className = '' }) => {
  return (
    <HeaderStyled style={style} className={className}>
      <Title style={titleStyle}>{title}</Title>
      {!!onRefresh && (
        <LinkButton onClick={onRefresh} disabled={loading} color="link" style={{ marginRight: 10 }}>
          Rafraichir
        </LinkButton>
      )}
    </HeaderStyled>
  );
};

export const SmallerHeaderWithBackButton = (props) => {
  return <Header style={{ padding: '16px 0', ...props.style }} title={<BackButton />} {...props} />;
};

const HeaderStyled = styled.div`
  padding: 48px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  color: ${theme.black};
  font-weight: bold;
  font-size: 24px;
  line-height: 32px;
`;

export default Header;
