import React from 'react';
import EyeIcon from '../assets/icons/EyeIcon';

const PasswordInput = ({ className, showPassword, setShowPassword, type, ...props }) => (
  <div className="tw-relative tw-mb-1.5 tw-flex tw-cursor-pointer tw-items-center">
    <input
      className={[className, '!tw-mb-0', showPassword ? 'show-password' : 'hide-password'].join(' ')}
      type={type || showPassword ? 'text' : 'password'}
      {...props}
    />
    <EyeIcon strikedThrough={showPassword} onClick={() => setShowPassword(!showPassword)} className="tw-absolute tw-right-4 tw-mb-auto" />
  </div>
);

export default PasswordInput;
