import React from 'react';
import styled from 'styled-components';
import { theme } from '../config';
import { Spinner } from 'reactstrap';

const ButtonCustom = ({
  color = 'primary',
  onClick = Function.prototype,
  style,
  loading,
  title = 'ButtonCustom',
  type = 'submit',
  width,
  disabled,
  icon,
  padding = '',
  ...rest
}) => {
  return (
    <ButtonWrapper
      className="noprint"
      onClick={onClick}
      color={color}
      style={style}
      width={width}
      disabled={loading || disabled}
      type={type}
      {...rest}>
      <SpinnerContainer visibility={!loading ? 'hidden' : 'visible'}>
        <Spinner color={'white'} size={'sm'} style={{ borderWidth: '0.1em' }} />
      </SpinnerContainer>
      <Content padding={padding}>
        {!!icon && <Icon color={color} icon={icon} />}
        <Title transparent={loading} dangerouslySetInnerHTML={{ __html: title }} />
      </Content>
    </ButtonWrapper>
  );
};

const STYLES = {
  primary: `background: ${theme.main}; color: ${theme.white};`,
  secondary: `background: ${theme.black}; color: ${theme.white};`,
  link: `background: transparent; color: ${theme.main};`,
  cancel: `background: transparent; color: ${theme.main};`,
  danger: `background: ${theme.redLight}; color: ${theme.redDark};`,
  warning: `background: ${theme.orangeLight}; color: ${theme.orangeDark};`,
};

const ButtonWrapper = styled.button`
  border-radius: 8px;
  font-size: 14px;
  ${(p) => p.color === 'link' && 'font-weight: 600;'}
  width: ${(p) => (p.width ? `${p.width}px` : 'auto')};
  max-width: 450px;
  display: grid;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  border: none;
  position: relative;
  ${(props) => props.disabled && 'pointer-events: none;'}
  ${(p) => STYLES[p.color] || `background: ${theme.main}; color: ${theme.white};`};

  &:disabled {
    opacity: 0.2;
  }

  &:hover {
    cursor: pointer;
    ${(p) => p.color === 'link' && 'text-decoration: underline;'}
  }
`;

const Icon = styled.div`
  color: currentColor;
  background-image: url(${(props) => props.icon});
  background-size: 20px;
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 7px;
`;

const Title = styled.p`
  ${(props) => props.transparent && 'color: transparent'};
  margin-bottom: 0;
`;

const Content = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 15px;
  ${(props) => `padding: ${props.padding}`}
`;
const SpinnerContainer = styled.div`
  visibility: ${(props) => props.visibility};
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default ButtonCustom;
