import { useState } from 'react';

export default function FinDeManoFabrique() {
  const [show, setShow] = useState(true);
  return (
    <div className="tw-mb-8 tw-border-l-4 tw-border-orange-500 tw-bg-orange-100 tw-p-4 tw-text-orange-700" role="alert">
      Dans le cadre de sa pérennisation, Mano ne sera pas accessible le 5 mars dès 9h. Pour en savoir plus, cliquez
      <button
        onClick={() => setShow(!show)}
        className="tw-ml-1 tw-cursor-pointer tw-border-none tw-bg-transparent tw-font-bold tw-text-orange-700 tw-underline">
        ici
      </button>
      {show && (
        <div className="tw-mt-8 tw-text-sm">
          <p>
            Comme vous le savez peut-être déjà, Mano et toute l'équipe quittent la Fabrique numérique des ministères sociaux pour rejoindre le
            groupement d'intérêt public Sesan (https://www.sesan.fr) et ainsi pérenniser notre action au long-cours !
          </p>
          <p>Concrètement, pas de changements pour vous :</p>
          <ul className="tw-list-disc tw-pl-4">
            <li>
              Mano restera chiffré de bout en bout pour protéger les données des personnes que vous accompagnez et leurs données seront toujours
              stockés sur des serveurs agréés données de santé (certification HDS) situés en France
            </li>
            <li>Nous continuerons à vous accompagner</li>
            <li>Nous continuerons à développer Mano en fonction de vos besoins</li>
          </ul>
          <p>Mano sera cependant indisponible la journée du 5 mars 2024 dès 9h, le temps de réaliser la bascule technique de Mano.</p>
          <p>L'application sera quand à elle indisponible dès le 4 Mars. Vous pourrez de nouveau l'utiliser le 5 Mars en fin de journée.</p>
          <p>🤗 Toute l'équipe Mano </p>
        </div>
      )}
    </div>
  );
}
