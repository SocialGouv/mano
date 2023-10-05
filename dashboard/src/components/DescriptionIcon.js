import React from 'react';
import openNewWindow from '../assets/icons/description-icon.svg';

const DescriptionIcon = () => (
  <div className="tw-ml-1 tw-inline-block tw-h-4 tw-w-4 tw-bg-contain tw-text-gray-300" style={{ backgroundImage: `url(${openNewWindow})` }} />
);

export default DescriptionIcon;
