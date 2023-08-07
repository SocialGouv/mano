import React from 'react';
import styled from 'styled-components';
import EyeIcon from '../assets/icons/EyeIcon';

const PasswordInput = ({ className, showPassword, setShowPassword, type, ...props }) => (
  <div className="tw-relative tw-mb-1.5 tw-flex tw-cursor-pointer tw-items-center">
    <InputField
      className={[className, '!tw-mb-0', showPassword ? 'show-password' : 'hide-password'].join(' ')}
      type={type || showPassword ? 'text' : 'password'}
      {...props}
    />
    <EyeIcon strikedThrough={showPassword} onClick={() => setShowPassword(!showPassword)} className="tw-absolute tw-right-4 tw-mb-auto" />
  </div>
);

const InputField = styled.input`
  background-color: transparent;
  outline: 0;
  display: block;
  width: 100%;
  padding: 0.625rem;
  margin-bottom: 0.375rem;
  border-radius: 4px;
  border: 1px solid #a7b0b7;
  color: #252b2f;
  -webkit-transition: border 0.2s ease;
  transition: border 0.2s ease;
  line-height: 1.2;
  &:focus {
    outline: none;
    border: 1px solid #116eee;
    & + label {
      color: #116eee;
    }
  }
`;

export default PasswordInput;
