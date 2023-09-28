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
  const { refresh, isLoading, checkDataConsistency } = useDataLoader();
  const [buttonTitle, setButtonTitle] = React.useState('Rafraichir');

  React.useEffect(() => {
    function enableCheckDataConsistency(e) {
      // if option, then set title to check data consistency
      if (e.key === 'Alt') setButtonTitle('NOUVEAU RAFRAICHIR');
    }
    function disableCheckDataConsistency(e) {
      setButtonTitle('Rafraichir');
    }

    window.addEventListener('keydown', enableCheckDataConsistency);
    window.addEventListener('keyup', disableCheckDataConsistency);
    return () => {
      window.removeEventListener('keydown', enableCheckDataConsistency);
      window.removeEventListener('keyup', disableCheckDataConsistency);
    };
  }, []);

  return (
    <ButtonCustom
      color="link"
      className={className}
      title={buttonTitle}
      onClick={() => {
        if (buttonTitle === 'Rafraichir') {
          refresh();
        } else {
          checkDataConsistency();
        }
      }}
      disabled={isLoading}
    />
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
