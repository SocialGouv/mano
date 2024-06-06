import React from "react";
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from "./tailwind/Modal";

export default function UnBugButton({ onResetCacheAndLogout }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        className="button-link !tw-ml-0"
        onClick={() => {
          setIsModalOpen(true);
        }}
      >
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
                Cliquez{" "}
                <button className={"tw-text-blue-500 tw-underline"} onClick={onResetCacheAndLogout}>
                  sur ce lien
                </button>{" "}
                pour réinitialiser le cache et vérifiez si le problème persiste
              </li>
              <li>
                Essayez depuis un autre ordinateur ou un autre compte pour voir si le problème est général ou localisé. Cela aidera les équipes pour
                l'étape suivante
              </li>
              <li>
                Si le problème persiste, contactez votre chargé de déploiement&nbsp;:
                <ul className="tw-list-disc">
                  <li>
                    Yoann - yoann.kittery@sesan.fr (07&nbsp;45&nbsp;16&nbsp;40&nbsp;04)
                    <span className="tw-text-xs tw-text-white tw-bg-red-700 tw-rounded tw-px-1 tw-pb-0.5 tw-ml-2">nouveau</span>
                  </li>
                  <li>
                    Melissa - melissa.saiter@sesan.fr (07&nbsp;49&nbsp;08&nbsp;27&nbsp;10)
                    <span className="tw-text-xs tw-text-white tw-bg-red-700 tw-rounded tw-px-1 tw-pb-0.5 tw-ml-2">nouveau</span>
                  </li>
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
