import Footer from "components/footer";
import Header from "components/header";
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
  const [showMenu, setShowMenu] = useState(false);
  return (
    <>
      <Header showMenu={showMenu} setShowMenu={setShowMenu} />
      <main
        onClick={() => {
          setShowMenu(false);
        }}
      >
        <div className="container my-16 mx-auto">
          <div className="flex md:flex-row flex-col items-center mx-auto justify-center gap-8">
            <img src="/logo.png" alt="Logo" className="w-24 h-24" />
            <h1 className="text-4xl p-4 max-w-[640px] text-center">Faciliter votre travail, mieux agir auprès de vos publics</h1>
          </div>
          <div className="max-w-[600px] text-center mx-auto my-8 sm:block hidden">
            Mano, l’outil numérique pour les professionnels accompagnant des publics précaires. Un service gratuit, sécurisé, personnalisable, pensé
            par et pour le terrain.
          </div>
          <img src="/mano-tel.png" alt="Screenshot" className="mx-auto w-[600px]" />
        </div>
        {/* <div className="flex flex-col items-center justify-center border pt-8 pb-16">
          <img src="/mano-tel.png" alt="Screenshot" className="mx-auto w-[600px] border" />
          <div className="w-full text-center mx-auto -mt-32 h-32 bg-red-500 -z-10">frfr</div>
      </div> */}
        <div className="bg-slate-100 py-8">
          <h2 className="text-2xl text-center mx-4">Vous souhaitez en savoir plus&nbsp;? Contactez nous&nbsp;!</h2>
          <div className="grid sm:grid-cols-2 gap-8 max-w-[800px] mx-auto my-8">
            <div className="border rounded shadow p-4 bg-white md:mx-0 mx-2 flex flex-col">
              <div className="text-center grid gap-2 grow">
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
                  Île-de-France, Hauts-de-France, Bretagne, Auvergne&nbsp;Rhone&nbsp;Alpes, Grand&nbsp;Est, Normandie, Guadeloupe et Martinique
                </div>
              </div>
              <div className="pt-4">
                <a
                  target="_blank"
                  className="flex my-4 bg-sky-600 text-white px-4 py-2 rounded shadow text-sm max-w-72 mx-auto"
                  href="https://cal.com/msaiter/je-souhaite-une-demonstration-de-l-outil-mano?duration=60"
                >
                  <div className="text-left">Reservez un temps de présentation de l’outil MANO</div>
                  <AgendaIcon size={42} />
                </a>
              </div>
            </div>
            <div className="border rounded shadow p-4 bg-white md:mx-0 mx-2 flex flex-col">
              <div className="text-center grid gap-2 grow">
                <div>Yoann Kittery</div>
                <div>
                  <a href="mailto:yoann.kittery@sesan.fr" className="text-mano hover:underline">
                    yoann.kittery@sesan.fr
                  </a>
                </div>
                <div className="flex items-center justify-center">
                  <a href="tel:+33749082710" className="hover:underline">
                    07 45 16 40 04
                  </a>
                  <span className="text-[10px] text-white bg-mano rounded px-1 ml-2">nouveau</span>
                </div>

                <div className="text-xs mt-4 max-w-sm mx-auto">
                  Île-de-france, PACA, Occitanie, Nouvelle&nbsp;Aquitaine, Pays&nbsp;de&nbsp;la&nbsp;Loire, Centre&nbsp;Val&nbsp;de&nbsp;Loire, Corse
                  et Réunion
                </div>
              </div>
              <div className="pt-4">
                <a
                  target="_blank"
                  className="flex my-4 bg-sky-600 text-white px-4 py-2 rounded shadow text-sm max-w-72 mx-auto"
                  href="https://cal.com/ykittery-mano/reservez-un-temps-de-presentation-de-l-outil-mano?duration=60"
                >
                  <div className="text-left">Reservez un temps de présentation de l’outil MANO</div>
                  <AgendaIcon size={42} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 relative">
          <div id="comment-ça-marche" className="absolute -top-16"></div>
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-2xl text-left mx-4 py-8">Comment ça marche</h2>
          </div>
          <div className="bg-slate-100 py-8">
            <div className="grid sm:grid-cols-3 items-center max-w-[1000px] mx-auto gap-8">
              <div className="sm:col-span-2 px-4 sm:px-0 self-start">
                <FaqBox title="Centralisez vos données">
                  Forgez une mémoire collective en regroupant toutes les données essentielles concernant le suivi de vos bénéficiaires dans un dossier
                  personnel, facilement accessible par tous les membres de votre équipe.
                </FaqBox>
                <FaqBox title="N’oubliez plus vos tâches et rendez-vous">
                  Évitez les oublis et gardez le fil de toutes vos actions, suivis et soins à fournir à vos bénéficiaires.
                </FaqBox>
                <FaqBox title="Comprenez votre activité et votre public">
                  Les informations que vous saisissez dans Mano sont instantanément converties en données statistiques. Analyser les besoins de votre
                  public, évaluer votre activité, et rédiger vos rapports n'a jamais été aussi simple.
                </FaqBox>
                <FaqBox title="Entièrement adaptable à vos besoins">
                  Prenez le contrôle en personnalisant les informations que vous recueillez dans les dossiers de vos bénéficiaires, lors de vos
                  consultations, et dans la définition des activités de votre équipe ainsi que des services offerts. Être autonome ne signifie pas
                  être isolé ! Nous sommes là pour vous accompagner dans cette démarche de structuration.
                </FaqBox>
                <FaqBox title="Un dossier médical sécurisé">
                  <p>
                    Les membres de votre équipe médicale ont accès à une section dédiée à la santé des personnes accompagnées dans chaque dossier,
                    restreinte uniquement à ces professionnels.
                  </p>
                  <p className="mt-4">
                    Cela leur permet de regrouper les informations concernant l'accompagnement médical, les traitements, les soins prodigués, le suivi
                    des paramètres vitaux, et de planifier des consultations avec leurs patients.
                  </p>
                </FaqBox>
                <FaqBox title="Disponible où que vous soyez">
                  Mano est accessible aussi bien en déplacement que depuis vos bureaux. Que vous interveniez sur le terrain, en hébergement diffus, en
                  centre de soin ou dans d'autres lieux d'accueil, Mano est à portée de main à tout moment.
                </FaqBox>
              </div>
              <div>
                <img src="/mano-epaule.svg" alt="Screenshot" className="mx-auto bg-white rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 relative">
          <div id="sécurité" className="absolute -top-16"></div>
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-2xl sm:text-right mx-4 py-8">Sécurité des données</h2>
          </div>
          <div className="bg-slate-100 py-8">
            <div className="grid sm:grid-cols-3 items-center max-w-[1000px] mx-auto gap-8">
              <div>
                <img src="/mano-secu.svg" alt="Screenshot" className="mx-auto max-h-56" />
              </div>
              <div className="px-4 sm:px-0 sm:col-span-2 self-start">
                <FaqBox title="Hébergement certifié HDS">
                  <b>Qu'est-ce que l'hébergement HDS&nbsp;?</b> L'hébergement HDS, ou Hébergement de Données de Santé, désigne un type
                  d'infrastructure sécurisée dédiée au stockage et au traitement des données médicales sensibles. Conformément à la réglementation en
                  vigueur, les données de santé doivent être hébergées dans des structures certifiées HDS pour garantir leur confidentialité et leur
                  sécurité.
                  <p className="mt-2">Les caractéristiques de l'hébergement HDS&nbsp;:</p>
                  <ul className="list-disc ml-4 space-y-2 my-2">
                    <li>
                      Sécurité renforcée&nbsp;: Les centres d'hébergement HDS disposent de dispositifs de sécurité avancés, tels que des systèmes de
                      cryptage et de sauvegarde régulière, pour protéger les données médicales contre tout accès non autorisé.
                    </li>
                    <li>
                      Respect de la réglementation&nbsp;: L'hébergement HDS est soumis à des normes strictes définies par la réglementation française
                      en matière de protection des données de santé, notamment le référentiel de sécurité de l'Agence des Systèmes d'Information
                      Partagés de Santé (ASIP Santé).
                    </li>
                    <li>
                      Disponibilité et accessibilité&nbsp;: Les services d'hébergement HDS offrent une disponibilité élevée et une accessibilité
                      permanente aux données médicales, permettant aux professionnels de santé d'y accéder en tout temps et en tout lieu, dans le
                      respect des règles de sécurité.
                    </li>
                    <li>
                      Traçabilité des accès&nbsp;: Les plateformes d'hébergement HDS enregistrent et traçent tous les accès aux données de santé,
                      garantissant ainsi une traçabilité complète des consultations et des modifications effectuées.
                    </li>
                  </ul>
                  <b>Pourquoi choisir l'hébergement HDS&nbsp;?</b> En optant pour l'hébergement HDS, les établissements de santé, les professionnels
                  de santé et les acteurs du secteur médical peuvent bénéficier d'une solution sécurisée et conforme à la réglementation pour la
                  gestion et la protection des données de santé, assurant ainsi la confidentialité et l'intégrité des informations médicales de leurs
                  patients.
                </FaqBox>
                <FaqBox title="Vous êtes les seuls à accéder à vos données">
                  Vos données sont chiffrées de bout en bout, ce qui signifie que vous êtes les seuls à pouvoir y accéder. Votre confidentialité est
                  notre priorité.
                </FaqBox>
                <FaqBox title="Procédure d’effacement de vos données">
                  Un bouton dédié autorise les administrateurs à effacer instantanément toutes les données de la plateforme en cas d'urgence.
                </FaqBox>
                <FaqBox title="Une charte d’utilisation co-écrite avec nos utilisateurs">
                  Avec nos utilisateurs, nous avons élaboré une charte destinée à encadrer l'usage de la plateforme. Elle établit les règles pour la
                  saisie de données, assure le consentement des bénéficiaires, renforce la sécurité et promeut les bonnes pratiques. Notre
                  collaboration vise à améliorer l'expérience pour tous.
                </FaqBox>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 relative">
          <div id="confiance" className="absolute -top-16"></div>
          <div className="container mx-auto">
            <h2 className="text-2xl text-center mx-4 py-8">Ils nous font confiance</h2>
          </div>
          <div className="bg-slate-100 py-8">
            <div className="grid md:grid-cols-2 gap-8 max-w-[1000px] md:px-0 px-2 mx-auto items-center justify-center">
              <div className="flex flex-col items-center justify-center border">
                <div className="py-3 text-lg">Présence sur le territoire</div>
                <iframe
                  width="100%"
                  height="300px"
                  frameborder="0"
                  allowfullscreen
                  allow="geolocation"
                  src="//umap.openstreetmap.fr/fr/map/villes-utilisatrices-de-mano_1053916?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=true&editMode=disabled&moreControl=false&searchControl=false&tilelayersControl=false&embedControl=false&datalayersControl=false&onLoadPanel=none&captionBar=false&captionMenus=false&locateControl=false&measureControl=false&editinosmControl=false&starControl=false#6/46.845/2.120"
                ></iframe>
                <a
                  target="_blank"
                  className="ml-2 -mt-10 self-start bg-white rounded px-4 py-2 text-sm text-mano shadow hover:bg-mano cursor-pointer hover:text-white"
                  href="//umap.openstreetmap.fr/fr/map/villes-utilisatrices-de-mano_1053916?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=true&editMode=disabled&moreControl=false&searchControl=false&tilelayersControl=false&embedControl=false&datalayersControl=false&onLoadPanel=none&captionBar=false&captionMenus=false&locateControl=false&measureControl=false&editinosmControl=false&starControl=false#6/46.845/2.120"
                >
                  Voir en plein écran
                </a>
              </div>

              <div className="flex flex-col items-center justify-center border">
                <div className="py-3 text-lg">Plus de 130 associations utilisatrices</div>
                <img src="/assos.png" alt="Screenshot" className="md:h-[300px] rounded shadow" />
              </div>
            </div>
            <Carousel />
          </div>
        </div>
        <div className="mt-8 relative">
          <div id="qui-sommes-nous" className="absolute -top-16"></div>
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-2xl sm:text-right mx-4 py-8">Qui sommes-nous ?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-[1000px] mx-auto text-sm">
            <div className="bg-mano rounded p-6 text-white md:mx-0 mx-2">
              <h3 className="text-lg font-semibold mb-4">Notre histoire</h3>
              <div>
                Mano, c’est un service public numérique dont la mission est de proposer un outil adapté aux pratiques de ses utilisateurs, pensé par
                et pour ces derniers, afin d’aider à améliorer l’accompagnement proposé aux plus précaires d’entre nous. L’histoire commence avec le
                CAARUD EGO de l’Association Aurore à Paris, continue à travers la France en étant incubé à la Fabrique numérique des ministères
                sociaux, et attérit au GIP Sesan pour péréniser son action au long-cours.
              </div>
            </div>
            <div className="bg-mano rounded p-6 text-white md:mx-0 mx-2">
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
            <div className="bg-mano rounded p-6 text-white md:mx-0 mx-2">
              <h3 className="text-lg font-semibold mb-4">Qui nous finance</h3>
              <div>
                Mano est financé par les agences régionales de santé (ARS) d’Île-de-France, de Bretagne, de Normandie, d’Occitanie, de
                Bourgogne-Franche-Conté, et des Pays de la Loire
              </div>
            </div>
          </div>
          <div className="my-8">
            <div className="max-w-[1000px] mx-auto">
              <h2 className="text-2xl text-center mx-4 py-8">L’équipe</h2>
            </div>
            <div>
              <div className="grid md:grid-cols-5 sm:grid-cols-3 grid-cols-2 gap-y-8 gap-x-2 max-w-[800px] mx-auto">
                <div className="mx-auto flex flex-col items-center justify-center text-center">
                  <img src="/team/a.png" alt="Logo" className="w-16 h-16" />
                  <div>
                    Arnaud
                    <br />
                    AMBROSELLI
                    <div className="text-sm mt-1 h-10">Développeur </div>
                    <div className="mt-2">
                      <a href="mailto:arnaud@ambroselli.io" target="_blank">
                        <img src="/message.png" alt="Mail" className="hover:brightness-125 inline-block w-8 h-8" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="mx-auto flex flex-col items-center justify-center text-center">
                  <img src="/team/g.png" alt="Logo" className="w-16 h-16" />
                  <div>
                    Guillaume
                    <br />
                    DEMIRHAN
                    <div className="text-sm mt-1 h-10">Porteur du projet</div>
                    <div className="mt-2">
                      <a href="mailto:guillaume.demirhan@sesan.fr" target="_blank">
                        <img src="/message.png" alt="Mail" className="hover:brightness-125 inline-block w-8 h-8" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="mx-auto flex flex-col items-center justify-center text-center">
                  <img src="/team/r.png" alt="Logo" className="w-16 h-16" />
                  <div>
                    Raphaël
                    <br />
                    HUCHET
                    <div className="text-sm mt-1 h-10">Développeur</div>
                    <div className="mt-2">
                      <a href="mailto:raph@selego.co" target="_blank">
                        <img src="/message.png" alt="Mail" className="hover:brightness-125 inline-block w-8 h-8" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="mx-auto flex flex-col items-center justify-center text-center">
                  <img src="/team/y.png" alt="Logo" className="w-16 h-16" />
                  <div>
                    Yoann
                    <br />
                    KITTERY
                    <div className="text-sm mt-1 h-10">Chargé de déploiement</div>
                    <div className="mt-2">
                      <a href="mailto:yoann.kittery@sesan.fr" target="_blank">
                        <img src="/message.png" alt="Mail" className="hover:brightness-125 inline-block w-8 h-8" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="mx-auto flex flex-col items-center justify-center text-center">
                  <img src="/team/m.png" alt="Logo" className="w-16 h-16" />
                  <div>
                    Mélissa
                    <br />
                    SAITER
                    <div className="text-sm mt-1 h-10">Chargée de déploiement</div>
                    <div className="mt-2">
                      <a href="mailto:melissa.saiter@sesan.fr" target="_blank">
                        <img src="/message.png" alt="Mail" className="hover:brightness-125 inline-block w-8 h-8" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="my-12 pt-12">
            <a href="https://www.sesan.fr/" target="_blank">
              <img src="/sesan.png" alt="Photo" className="mx-auto md:max-w-[600px]" />
            </a>
          </div>
        </div>
      </main>
      <Footer />
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
      author: ["Valentin Rault", "Maraude Equipe Mobile", "EGO"],
    },
    {
      quote: "Nous avons une une grande liberté pour faire évoluer mano selon nos besoins et cela fait la différence",
      author: ["Laïla", "Infirmière Coordinatrice", "EMSP"],
    },
    {
      quote: "C'est une petite révolution pour nous",
      author: ["Inès", "Cheffe de service", "Maraude d’intervention Sociale"],
    },
    {
      quote: "L’outil est rapide à remplir, il permet de ne pas passer trop de temps administratif pour privilégier le face à face.",
      author: ["Claire", "Coordinatrice", "CAARUD"],
    },
    {
      quote: "Je mettais 4 jours à sortir mes statistiques pour mes rapports d’activité. Maintenant ça me prends 4 minutes.",
      author: ["Françoise", "Cheffe de service CHU", "Veille sociale"],
    },
    {
      quote:
        "Mano me permet de n’avoir qu’un seul outil de travail, où je peux transmettre toutes les informations nécessaires, et d’y stocker tous les documents importants.",
      author: ["Jérémie", "Educateur spécialisé", "CAARUD"],
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
        <div className="text-lg italic font-semibold text-mano min-h-24">«&nbsp;{data[current].quote}&nbsp;»</div>
        <div className="text-right mt-8">
          {data[current].author.map((e) => (
            <div key={e}>{e}</div>
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
