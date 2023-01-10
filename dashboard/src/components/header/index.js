import React from 'react';
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
    <>
      <button type="button" className="button-link tw-mr-2.5" disabled={isLoading} onClick={refresh}>
        Rafraichir
      </button>
    </>
  );
};

export const SmallHeaderWithBackButton = ({ className, ...props }) => {
  return <Header className={[className, 'tw-py-4 tw-px-0'].join(' ')} title={<BackButton />} {...props} />;
};

export const SmallHeader = ({ className, ...props }) => {
  return <Header className={[className, 'tw-py-4 tw-px-0'].join(' ')} titleStyle={{ fontWeight: '400' }} {...props} />;
};

export const HeaderStyled = ({ children, className = '', style = {} }) => (
  <div style={style} className={[className, 'tw-flex tw-items-center tw-justify-between tw-py-12 tw-px-0'].join(' ')}>
    {children}
  </div>
);

export const Title = ({ children, className = '', style = {} }) => (
  <h2 style={style} className={[className, 'tw-text-2xl tw-font-bold tw-text-black'].join(' ')}>
    {children}
  </h2>
);

export default Header;
