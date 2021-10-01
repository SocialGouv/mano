import React from 'react';
import styled from 'styled-components';
import EyeIcon from '../assets/icons/EyeIcon';

const PasswordInput = ({ InputComponent, showPassword, setShowPassword, type, ...props }) => (
  <InputWithEye>
    <InputComponent showPassword={showPassword} type={showPassword ? 'text' : 'password'} {...props} />
    <EyeIcon strikedThrough={showPassword} onClick={() => setShowPassword(!showPassword)} />
  </InputWithEye>
);

const InputWithEye = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  margin-bottom: 0.375rem;

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
