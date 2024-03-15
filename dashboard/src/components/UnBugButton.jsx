import React from 'react';
import { useDataLoader } from './DataLoader';
import API from '../services/api';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';

export default function UnBugButton() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { resetCache } = useDataLoader();
  return (
    <>
      <button
        type="button"
        className="button-link !tw-ml-0"
        onClick={() => {
          setIsModalOpen(true);
        }}>
        Un bug ?
      </button>
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
                pour réinitialiser le cache et vérifiez si le problème persiste
              </li>
              <li>
                Essayez depuis un autre ordinateur ou un autre compte pour voir si le problème est général ou localisé. Cela aidera les équipes pour
                l'étape suivante
              </li>
              <li>
                Si le problème persiste, contactez votre chargé de déploiement&nbsp;:
                <ul className="tw-list-disc">
                  <li>Yoann - ykittery.mano@gmail.com (06&nbsp;83&nbsp;98&nbsp;29&nbsp;66)</li>
                  <li>Melissa - m.saiter.mano@gmail.com (06&nbsp;13&nbsp;23&nbsp;33&nbsp;45)</li>
                </ul>
              </li>
            </ul>
          </ModalBody>
          <ModalFooter>
            <button type="button" className="button-cancel" onClick={() => setIsModalOpen(false)}>
              Fermer
            </button>
          </ModalFooter>
        </ModalContainer>
      )}
    </>
  );
}
