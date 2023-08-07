import React from 'react';
import styled from 'styled-components';
import { theme } from '../config';
import { Spinner } from 'reactstrap';

const Button = ({ color = 'primary', onClick = Function.prototype, icon = null, style, loading, title = 'Button', width }) => {
  return (
    <ButtonWrapper onClick={onClick} color={color} style={style} width={width}>
      <Content>
        {loading ? (
          <Icon>
            <Spinner color={'white'} size={'sm'} />
          </Icon>
        ) : (
          icon && <Icon>{icon}</Icon>
        )}
        <Title>{title}</Title>
      </Content>
    </ButtonWrapper>
  );
};

const STYLES = {
  danger: `background: ${theme.redLight}; color: ${theme.redDark};`,
  primary: `background: ${theme.main}; color: ${theme.white};`,
};

const ButtonWrapper = styled.div`
  ${(p) => STYLES[p.color] || `background: ${theme.main}; color: ${theme.white};`};
  border-radius: 8px;
  font-size: 14px;
  height: 48px;
  width: ${(p) => (p.width ? `${p.width}px` : '100%')};
  max-width: 320px;
  display: grid;
  align-items: center;
  justify-content: center;
`;

const Title = styled.div``;
const Content = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
const Icon = styled.div`
  padding: 0 8px;
  font-size: 20px;
`;

export default Button;
