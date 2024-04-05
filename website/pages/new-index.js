import { useState } from "react";

const AgendaIcon = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 196 200">
    <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <path
        d="M54.4156393,0 C50.8139009,0 47.8939015,2.91978197 47.8939015,6.52173771 L47.8939015,31.5895584 C40.3315119,34.3034708 34.8504261,41.5556431 34.8504261,49.9999891 C34.8504261,60.7282477 43.6875981,69.5652023 54.4156393,69.5652023 C65.1438978,69.5652023 73.9808524,60.7282477 73.9808524,49.9999891 C73.9808524,41.5647736 68.4871579,34.3104273 60.937377,31.5895584 L60.937377,6.52173771 C60.937377,2.91978197 58.0173776,0 54.4156393,0 Z M141.37214,0 C137.770404,0 134.850404,2.91978197 134.850404,6.52173771 L134.850404,31.5895584 C127.288015,34.3034708 121.806929,41.5556431 121.806929,49.9999891 C121.806929,60.7282477 130.644101,69.5652023 141.37214,69.5652023 C152.100401,69.5652023 160.937353,60.7282477 160.937353,49.9999891 C160.937353,41.5647736 155.443659,34.3104273 147.893878,31.5895584 L147.893878,6.52173771 C147.893878,2.91978197 144.97388,0 141.37214,0 Z M23.9808633,13.0429137 C10.8095629,13.0429137 -1.42108547e-14,23.8532557 -1.42108547e-14,37.0243398 L-1.42108547e-14,176.018918 C-1.42108547e-14,189.19022 10.8097803,200 23.9808633,200 L171.671266,200 C184.84235,200 195.65213,189.19022 195.65213,176.018918 L195.65213,37.0243398 C195.65213,23.8532557 184.842133,13.0429137 171.671266,13.0429137 L158.695617,13.0429137 C155.25018,12.9956493 152.038009,16.1193443 152.038009,19.5652131 C152.038009,23.011082 155.25018,26.1356465 158.695617,26.0869509 L171.671266,26.0869509 C177.829308,26.0869509 182.608655,30.8658629 182.608655,37.0243398 L182.608655,73.9130274 L13.0434743,73.9130274 L13.0434743,37.0243398 C13.0434743,30.8658629 17.8226037,26.0869509 23.9808633,26.0869509 L36.9565126,26.0869509 C40.4019467,26.1347769 43.5460764,23.011082 43.5460764,19.5652131 C43.5460764,16.1193443 40.4019467,12.9947798 36.9565126,13.0429137 L23.9808633,13.0429137 Z M71.7391138,13.0434754 C68.1371602,13.0434754 65.217376,15.9632574 65.217376,19.5652131 C65.217376,23.1669515 68.1371602,26.0869509 71.7391138,26.0869509 L123.913015,26.0869509 C127.514971,26.0869509 130.434753,23.1669515 130.434753,19.5652131 C130.434753,15.9632574 127.514971,13.0434754 123.913015,13.0434754 L71.7391138,13.0434754 Z M54.4156393,43.4782514 C58.0947689,43.4782514 60.937377,46.3208595 60.937377,49.9999891 C60.937377,53.6791188 58.0947689,56.5217268 54.4156393,56.5217268 C50.736727,56.5217268 47.8939015,53.6791188 47.8939015,49.9999891 C47.8939015,46.3208595 50.736727,43.4782514 54.4156393,43.4782514 Z M141.37214,43.4782514 C145.051272,43.4782514 147.893878,46.3208595 147.893878,49.9999891 C147.893878,53.6791188 145.051272,56.5217268 141.37214,56.5217268 C137.69323,56.5217268 134.850404,53.6791188 134.850404,49.9999891 C134.850404,46.3208595 137.69323,43.4782514 141.37214,43.4782514 Z M13.0434743,86.9565028 L182.608655,86.9565028 L182.608655,176.018918 C182.608655,182.177395 177.829308,186.956525 171.671266,186.956525 L23.9808633,186.956525 C17.8223863,186.956525 13.0434743,182.177395 13.0434743,176.018918 L13.0434743,86.9565028 Z"
        id="Calendar"
        fill="currentColor"
        fillRule="nonzero"
      />
    </g>
  </svg>
);

export default function NewIndex() {
  return (
    <>
      <header className="flex gap-8 p-2 w-full border-b border-gray-300 items-center shadow mb-8">
        <img src="/logo.svg" alt="Logo" className="w-12 h-12" />
        <div className="grow">
          <ul className="sm:flex flex-row gap-8 hidden">
            <li className="hover:underline decoration-mano underline-offset-2 cursor-pointer">Comment ça marche</li>
            <li className="hover:underline decoration-mano underline-offset-2 cursor-pointer">Sécurité des données</li>
            <li className="hover:underline decoration-mano underline-offset-2 cursor-pointer">Ils nous font confiance</li>
            <li className="hover:underline decoration-mano underline-offset-2 cursor-pointer">Qui sommes nous</li>
          </ul>
        </div>
        <button className="inline-flex w-full cursor-pointer justify-center rounded-md border border-transparent bg-mano px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-mano focus:outline-none focus:ring-2 focus:ring-mano focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30 sm:ml-3 sm:w-auto">
          Se connecter
        </button>
      </header>
      <main>
        <div className="container my-16">
          <div className="flex items-center mx-auto justify-center gap-8">
            <img src="/logo.svg" alt="Logo" className="w-24 h-24" />
            <h1 className="text-4xl">
              Faciliter votre travail, mieux agir
              <br />
              auprès de vos publics
            </h1>
          </div>
          <div className="max-w-[600px] text-center mx-auto my-8">
            Mano, l’outil numérique pour les professionnels accompagnant des publics précaires. Un service gratuit, sécurisé, personnalisable, pensé
            par et pour le terrain.
          </div>
          <img src="https://placehold.co/300x200/png" alt="Screenshot" className="mx-auto" />
        </div>
        <div className="bg-slate-100 py-8">
          <h2 className="text-2xl text-center mx-4">Vous souhaitez en savoir plus ? Contactez nous !</h2>
          <div className="grid grid-cols-2 gap-8 max-w-[800px] mx-auto my-8">
            <div className="border rounded shadow p-4 bg-white">
              <div className="text-center grid gap-2">
                <div>Mélissa Saiter</div>
                <div>
                  <a href="mailto:melissa.saiter@sesan.fr" className="text-mano hover:underline">
                    melissa.saiter@sesan.fr
                  </a>
                </div>
                <div className="flex items-center justify-center">
                  <a href="tel:+33749082710" className="hover:underline">
                    07 49 08 27 10
                  </a>
                  <span className="text-[10px] text-white bg-mano rounded px-1 ml-2">nouveau</span>
                </div>

                <div className="text-xs mt-4 max-w-sm mx-auto">
                  Île-de-France, Hauts-de-France, Auvergne&nbsp;Rhone&nbsp;Alpes, Grand&nbsp;Est, Normandie, Bretagne, Guadeloupe et Martinique
                </div>
                <div className="py-4">
                  <a
                    target="_blank"
                    className="flex mx-8 my-4 bg-sky-600 text-white px-4 py-2 rounded shadow text-sm"
                    href="https://cal.com/msaiter/je-souhaite-une-demonstration-de-l-outil-mano?duration=60"
                  >
                    <div className="text-left">Reservez un temps de présentation de l’outil MANO</div>
                    <AgendaIcon size={42} />
                  </a>
                </div>
              </div>
            </div>
            <div className="border rounded shadow p-4 bg-white">
              <div className="text-center grid gap-2">
                <div>Melissa Saiter</div>
                <div>
                  <a href="mailto:melissa.saiter@sesan.fr" className="text-mano hover:underline">
                    melissa.saiter@sesan.fr
                  </a>
                </div>
                <div className="flex items-center justify-center">
                  <a href="tel:+33749082710" className="hover:underline">
                    07 49 08 27 10
                  </a>
                  <span className="text-[10px] text-white bg-mano rounded px-1 ml-2">nouveau</span>
                </div>

                <div className="text-xs mt-4 max-w-sm mx-auto">
                  Île-de-France, Hauts-de-France, Auvergne&nbsp;Rhone&nbsp;Alpes, Grand&nbsp;Est, Normandie, Bretagne, Guadeloupe et Martinique
                </div>
                <div className="py-4">
                  <a
                    target="_blank"
                    className="flex mx-8 my-4 bg-sky-600 text-white px-4 py-2 rounded shadow text-sm"
                    href="https://cal.com/msaiter/je-souhaite-une-demonstration-de-l-outil-mano?duration=60"
                  >
                    <div className="text-left">Reservez un temps de présentation de l’outil MANO</div>
                    <AgendaIcon size={42} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-2xl text-left mx-4 py-8">Comment ça marche</h2>
          </div>
          <div className="bg-slate-100 py-8">
            <div className="grid grid-cols-3 items-center max-w-[1000px] mx-auto gap-8">
              <div className="col-span-2 self-start">
                <FaqBox title="Centralisez vos données">
                  Forgez une mémoire collective en regroupant toutes les données essentielles concernant le suivi de vos bénéficiaires dans un dossier
                  personnel, facilement accessible par tous les membres de votre équipe
                </FaqBox>
                <FaqBox title="N’oubliez plus vos tâches et rendez-vous">Lorem ipsum dolor sit amet</FaqBox>
                <FaqBox title="Comprenez votre activité et votre public">Lorem ipsum dolor sit amet</FaqBox>
                <FaqBox title="Entièrement adaptable à vos besoins">Lorem ipsum dolor sit amet</FaqBox>
                <FaqBox title="Un dossier médical sécurisé">Lorem ipsum dolor sit amet</FaqBox>
                <FaqBox title="Disponible où que vous soyez">Lorem ipsum dolor sit amet</FaqBox>
              </div>
              <div>
                <img src="https://placehold.co/300x200/png" alt="Screenshot" className="mx-auto" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-2xl text-right mx-4 py-8">Sécurité des données</h2>
          </div>
          <div className="bg-slate-100 py-8">
            <div className="grid grid-cols-3 items-center max-w-[1000px] mx-auto gap-8">
              <div>
                <img src="https://placehold.co/300x200/png" alt="Screenshot" className="mx-auto" />
              </div>
              <div className="col-span-2 self-start">
                <FaqBox title="Hébergement certifié HDS">Lorem ipsum dolor sit amet</FaqBox>
                <FaqBox title="Vous êtes les seuls à accéder à vos données">Lorem ipsum dolor sit amet</FaqBox>
                <FaqBox title="Procédure d’effacement de vos données">Lorem ipsum dolor sit amet</FaqBox>
                <FaqBox title="Une charte d’utilisation co-écrite avec nos utilisateurs">Lorem ipsum dolor sit amet</FaqBox>
              </div>
            </div>
          </div>
        </div>
        <div className="container mt-8 mx-auto">
          <h2 className="text-2xl text-center mx-4 py-8">Ils nous font confiance</h2>
        </div>
        <div className="bg-slate-100 py-8">
          <div className="grid grid-cols-2 gap-8 max-w-[800px] mx-auto">
            <img src="https://placehold.co/500x300/png" alt="Screenshot" />
            <img src="https://placehold.co/500x300/png" alt="Screenshot" />
          </div>
          <Carousel />
        </div>
        <div className="mt-8">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-2xl text-right mx-4 py-8">Qui sommes-nous ?</h2>
          </div>
          <div className="grid grid-cols-3 gap-8 max-w-[1000px] mx-auto text-sm">
            <div className="bg-mano rounded p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Notre histoire</h3>
              <div>
                Mano, c’est un service public numérique dont la mission est de proposer un outil adapté aux pratiques de ses utilisateurs, pensé par
                et pour ces derniers, afin d’aider à améliorer l’accompagnement proposé aux plus précaires d’entre nous. L’histoire commence avec le
                CAARUD EGO de l’Association Aurore à Paris, continue à travers la France en étant incubé à la Fabrique numérique des ministères
                sociaux, et attérit au GIP Sesan pour péréniser son action au long-cours.
              </div>
            </div>
            <div className="bg-mano rounded p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Notre approche</h3>
              <div>
                <ul className="list-disc ml-4 space-y-2">
                  <li>Utilité et simplicité de la plateforme</li>
                  <li>Pilotés par l’Impact et les besoins identifiés par le terrain</li>
                  <li>Travail en transparence et en partenariat avec les équipes utilisatrices </li>
                  <li>Un accompagnement à l’utilisation global pour chaque équipe utilisatrice</li>
                </ul>
              </div>
            </div>
            <div className="bg-mano rounded p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Qui nous finance ?!</h3>
              <div>
                Mano est financé par les agences régionales de santé (ARS) d’Île-de-France, de Bretagne, de Normandie, d’Occitanie, de
                Bourgogne-Franche-Conté, et des Pays de la Loire
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-2xl text-center mx-4 py-8">L’équipe</h2>
          </div>
          <div>
            <div className="grid grid-cols-5 max-w-[800px] mx-auto">
              <div className="mx-auto flex flex-col items-center justify-center text-center">
                <img src="/yo.png" alt="Logo" className="w-16 h-16" />
                <div>
                  Yoann KITTERY
                  <div className="text-sm">Chargé de déploiement</div>
                </div>
              </div>
              <div className="mx-auto flex flex-col items-center justify-center text-center">
                <img src="/yo.png" alt="Logo" className="w-16 h-16" />
                <div>
                  Yoann KITTERY
                  <div className="text-sm">Chargé de déploiement</div>
                </div>
              </div>
              <div className="mx-auto flex flex-col items-center justify-center text-center">
                <img src="/yo.png" alt="Logo" className="w-16 h-16" />
                <div>
                  Yoann KITTERY
                  <div className="text-sm">Chargé de déploiement</div>
                </div>
              </div>
              <div className="mx-auto flex flex-col items-center justify-center text-center">
                <img src="/yo.png" alt="Logo" className="w-16 h-16" />
                <div>
                  Yoann KITTERY
                  <div className="text-sm">Chargé de déploiement</div>
                </div>
              </div>
              <div className="mx-auto flex flex-col items-center justify-center text-center">
                <img src="/yo.png" alt="Logo" className="w-16 h-16" />
                <div>
                  Yoann KITTERY
                  <div className="text-sm">Chargé de déploiement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full bg-mano mt-16 border text-white p-8">
        <ul className="flex flex-row gap-4">
          <li>Accessibilité : non conforme</li>
          <li>Mentions légales</li>
          <li>Conditions générales d'utilisation</li>
          <li>Statistiques</li>
          <li>Politique de confidentialité</li>
        </ul>
        <div className="text-xs mt-4">2020-présent, Mano - Tous droits réservés </div>
      </footer>
    </>
  );
}

function FaqBox({ title, children }) {
  return (
    <details className="w-full bg-white border-b [&_svg]:open:-rotate-180 open:mb-4">
      <summary className="list-none p-4 flex items-center">
        <div className="grow">{title}</div>
        <svg
          className="rotate-0 transform transition-all duration-200"
          fill="none"
          height="20"
          width="20"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </summary>
      <div className="p-4 border-t border-slate-100 text-sm">{children}</div>
    </details>
  );
}

function Carousel() {
  const [current, setCurrent] = useState(0);
  const data = [
    {
      quote: "C’est excellent de pouvoir participer développement de l'outil en tant que professionnel du terrain",
      author: ["Valentin Rault", "Maraude Equipe Mobile EGO"],
    },
    {
      quote: "Nous avons une une grande liberté pour faire évoluer mano selon nos besoins et cela fait la différence",
      author: ["Laïla", "Infirmière Coordinatrice"],
    },
  ];
  const length = data.length;
  return (
    <div className="flex items-center gap-4 mx-auto max-w-[800px] my-8">
      <button onClick={() => setCurrent(current === 0 ? length - 1 : current - 1)}>
        <svg
          className="rotate-90 transform transition-all duration-200"
          fill="none"
          height="40"
          width="40"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div className="grow bg-white p-8 rounded">
        <div className="text-lg italic font-semibold text-mano h-20">«&nbsp;{data[current].quote}&nbsp;»</div>
        <div className="text-right mt-8">
          {data[current].author.map((e) => (
            <div>{e}</div>
          ))}
        </div>
      </div>

      <button onClick={() => setCurrent(current === length - 1 ? 0 : current + 1)}>
        <svg
          className="-rotate-90 transform transition-all duration-200"
          fill="none"
          height="40"
          width="40"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>
  );
}
