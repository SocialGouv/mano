import React from 'react';
import styled from 'styled-components';
import EyeIcon from '../assets/icons/EyeIcon';

const PasswordInput = ({ InputComponent, showPassword, setShowPassword, type, ...props }) => (
  <InputWithEye>
    <InputComponent className={showPassword ? 'show-password' : 'hide-password'} type={type || showPassword ? 'text' : 'password'} {...props} />
    <EyeIcon strikedThrough={showPassword} onClick={() => setShowPassword(!showPassword)} />
  </InputWithEye>
);

const InputWithEye = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  margin-bottom: 0.375rem;
  cursor: pointer;

  > input {
    margin-bottom: 0;
  }

  > svg {
    position: absolute;
    right: 15px;
    margin-bottom: auto;
  }
`;

export default PasswordInput;
