import React from 'react';
import BackButton from '../backButton';
import { useDataLoader } from '../DataLoader';
import ButtonCustom from '../ButtonCustom';

const Header = ({ title, refreshButton = false, style = {}, titleStyle = {}, className = '' }) => {
  return (
    <HeaderStyled style={style} className={className}>
      <Title style={titleStyle}>{title}</Title>
      {Boolean(refreshButton) && <RefreshButton />}
    </HeaderStyled>
  );
};

export const RefreshButton = ({ className }) => {
  const { refresh, isLoading } = useDataLoader();
  return (
    <>
      <ButtonCustom color="link" className={className} title="Rafraichir" onClick={() => refresh()} disabled={isLoading} />
    </>
  );
};

export const SmallHeaderWithBackButton = ({ className, ...props }) => {
  return <Header className={[className, 'tw-py-4 tw-px-0'].join(' ')} title={<BackButton />} {...props} />;
};

export const SmallHeader = ({ className, ...props }) => {
  return <Header className={className} titleStyle={{ fontWeight: '400' }} {...props} />;
};

export const HeaderStyled = ({ children, className = '', style = {} }) => (
  <div style={style} className={[className, 'tw-flex tw-items-center tw-justify-between tw-px-0 tw-py-3 sm:tw-py-12'].join(' ')}>
    {children}
  </div>
);

export const Title = ({ children, className = '', style = {} }) => (
  <h2 style={style} className={[className, 'tw-text-2xl tw-font-bold tw-text-black'].join(' ')}>
    {children}
  </h2>
);

export default Header;
