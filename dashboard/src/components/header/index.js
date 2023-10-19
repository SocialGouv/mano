import React from 'react';
import BackButton from '../backButton';
import { useDataLoader } from '../DataLoader';
import ButtonCustom from '../ButtonCustom';
import API from '../../services/api';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../tailwind/Modal';

const Header = ({ title, style = {}, titleStyle = {}, className = '' }) => {
  return (
    <HeaderStyled style={style} className={className}>
      <Title style={titleStyle}>{title}</Title>
    </HeaderStyled>
  );
};

export const UnBugButton = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { resetCache } = useDataLoader();
  return (
    <>
      <ButtonCustom
        className="tw-ml-4"
        color="link"
        title="Un bug ?"
        onClick={() => {
          setIsModalOpen(true);
        }}
      />
      {isModalOpen && (
        <ModalContainer open={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
          <ModalHeader toggle={() => setIsModalOpen(false)} title="Un bug ? 🪲" />
          <ModalBody className="tw-p-4">
            <p>
              Vous ne voyez plus vos données&nbsp;? C’est peut-être un problème de cache sur votre ordinateur. Nous vous conseillons les étapes
              suivantes&nbsp;:
            </p>
            <ul className="tw-list-disc tw-space-y-2">
              <li>
                Cliquez{' '}
                <button
                  className={'tw-text-blue-500 tw-underline'}
                  onClick={() => {
                    resetCache().then(() => {
                      return API.logout();
                    });
                  }}>
                  sur ce lien
                </button>{' '}
                pour réinitialiser le cache et vérifiez si le problème persiste&nbsp;;
              </li>
              <li>
                Essayez depuis un autre ordinateur ou un autre compte pour voir si le problème est général ou localisé. Cela aidera les équipes pour
                l'étape suivante&nbsp;;
              </li>
              <li>
                Si le problème persiste, contactez votre chargé de déploiement :
                <ul className="tw-list-disc">
                  <li>Yoann - ykittery.mano@gmail.com (06&nbsp;83&nbsp;98&nbsp;29&nbsp;66)</li>
                  <li>Melissa - m.saiter.mano@gmail.com (06&nbsp;13&nbsp;23&nbsp;33&nbsp;45)</li>
                </ul>
              </li>
            </ul>
          </ModalBody>
          <ModalFooter>
            <ButtonCustom color="secondary" title="Fermer" onClick={() => setIsModalOpen(false)} />
          </ModalFooter>
        </ModalContainer>
      )}
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
