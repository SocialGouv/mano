import { useState, useEffect } from "react";
import { HiCheckCircle } from "react-icons/hi";
import Header from "../components/header";
import Footer from "../components/footer";

export default function Index() {
  const [actions, setActions] = useState(0);
  const [persons, setPersons] = useState(0);
  const [comments, setComments] = useState(0);

  const getData = async () => {
    const response = await fetch(
      "https://mano.fabrique.social.gouv.fr/public/stats",
      {
        headers: { platform: "website" },
      }
    ).then((res) => res.json());

    setActions(response.data.actions);
    setPersons(response.data.persons);
    setComments(response.data.comments);
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div>
      <Header />
      <div className="w-full h-18"></div>
      <section className="relative">
        <div className="block w-full h-60 md:hidden">
          <img
            className="object-cover w-full h-full"
            src="/hero.jpg"
            alt="Crédits photo: Nathan Dumlao @https://unsplash.com/photos/i__uqGnARyI"
          />
        </div>
        <div className="container flex items-center h-auto overflow-hidden md:h-160 lg:h-184">
          <div className="w-full px-5 py-12 lg:py-24 md:w-7/12">
            <h1 className="mb-4 text-2xl font-semibold text-black md:text-3xl lg:text-4xl">
              Faciliter notre travail pour mieux agir auprès de nos publics
              précaires.
            </h1>
            <p className="text-sm text-gray-600 opacity-90">
              <i>
                Un service gratuit dédié aux professionnels de maraude et de
                lieux d’accueil.
                <br /> MANO c’est une application smartphone pour être
                accessible en rue lors des maraudes et une interface web pour
                plus d’ergonomie sur ordinateur.
              </i>
              <br />
              <br />
              Jeanne, rencontrée en rue, a "complètement oublié où est [son]
              rendez-vous super important d’aujourd’hui !" et vous n'arrivez pas
              à joindre le collègue qui le lui avait organisé.
              <br />
              <br />
              Karim vous demande de renouveler sa demande d’AME. Pour la
              cinquième année consécutive vous allez devoir lui redemander
              toutes ses informations personnelles.
              <br />
              <br />
              <span className="font-medium text-black">
                Ces scènes vous rappellent quelque chose ? MANO a été conçu pour
                les éviter !
              </span>
            </p>
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 hidden md:block w-35/100">
          <img
            className="object-cover w-full h-full"
            src="/hero.jpg"
            alt="Crédits photo: Nathan Dumlao @https://unsplash.com/photos/i__uqGnARyI"
          />
        </div>
      </section>

      <section className="bg-gray-50" id="pourquoi-mano">
        <div className="px-5 py-12 lg:py-24 md:container">
          <div className="mb-20 text-center md:mx-auto md:w-8/12">
            <h3 className="mb-5 text-2xl font-semibold text-center text-black md:text-3xl lg:text-4xl">
              MANO, à quoi ça sert ?
            </h3>
            <p className="text-sm text-gray-600 md:text-base">
              MANO renforce la continuité de suivi au cœur du travail des
              maraudes et des lieux d’accueil.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-20">
            <div className="grid grid-cols-12">
              <div className="mb-6 col-span-full flex-center md:col-span-6 md:col-start-7 md:row-start-1">
                <img className="w-40" src="/mockup/one.png" alt="" />
              </div>
              <div className="text-center col-span-full md:col-span-5 md:text-left md:row-start-1 md:flex md:flex-col md:justify-center">
                <h4 className="mb-2 text-xl font-semibold text-black md:text-2xl lg:text-3xl">
                  Un dossier usager
                </h4>
                <p className="text-sm text-gray-600 md:text-base">
                  Vous pouvez remplir et consulter des dossiers médico-sociaux
                  sur les personnes que vous suivez. Il est accessible également
                  à vos collègues et à eux seuls. Plus d’informations perdues
                  sur un post-it ou dans une boîte mail !
                </p>
              </div>
              <div className="col-span-5 col-start-7"></div>
            </div>
            <div className="grid grid-cols-12">
              <div className="mb-6 col-span-full md:col-span-6 flex-center">
                <img className="w-40" src="/mockup/two.png" alt="" />
              </div>
              <div className="text-center col-span-full md:col-span-5 md:col-start-8 md:flex md:text-left md:justify-center md:flex-col">
                <h4 className="mb-2 text-xl font-semibold text-black md:text-2xl lg:text-3xl">
                  Un agenda des tâches à réaliser
                </h4>
                <p className="text-sm text-gray-600 md:text-base">
                  Toutes les tâches effectuées et celles prévues par les autres
                  membres de votre équipe se retrouvent résumées et détaillées,
                  jour par jour. Plus possible de rater une échéance ou
                  d’oublier un engagement !
                </p>
              </div>
              <div className="col-span-5 col-start-7"></div>
            </div>
            <div className="grid grid-cols-12">
              <div className="mb-6 col-span-full flex-center md:col-span-6 md:col-start-7 md:row-start-1">
                <img className="w-full" src="/mockup/three.png" alt="" />
              </div>
              <div className="text-center col-span-full md:col-span-5 md:text-left md:row-start-1 md:flex md:flex-col md:justify-center">
                <h4 className="mb-2 text-xl font-semibold text-black md:text-2xl lg:text-3xl">
                  Des statistiques d’activité automatisées
                </h4>
                <p className="text-sm text-gray-600 md:text-base">
                  Les statistiques anonymisées et les comptes rendus sont
                  générés automatiquement. Les transmissions et les rapports
                  d’activités n’ont jamais été aussi simples !
                </p>
              </div>
              <div className="col-span-5 col-start-7"></div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="px-5 py-12 lg:py-24 md:container"
        id="la-protection-des-donnees"
      >
        <div className="mb-10 text-center md:mx-auto md:w-8/12">
          <h3 className="mb-2 text-2xl font-semibold text-center text-black md:text-3xl lg:text-4xl">
            La protection des données
          </h3>
          <p className="text-sm text-gray-600 md:text-base">
            La protection des données est un enjeu crucial pour l’équipe MANO et
            les structures qui l’utilisent. Voici ce qui la garantie :
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 md:gap-4">
          <DataProtectionCard
            number="1"
            content="Dans le logiciel, les dossiers des personnes suivies sont accessibles uniquement par les utilisateurs de l'organisation qui les a créées."
          />
          <DataProtectionCard
            number="2"
            content="Les données sont hébergées sur des serveurs agréés données de santé (HDS), en France. La norme HDS implique un système de protection contre les cyberattaques."
          />
          <DataProtectionCard
            number="3"
            content="Les données enregistrées dans MANO sont chiffrées et déchiffrées directement sur le téléphone ou l'ordinateur de l'utilisateur ou utilisatrice, selon une phrase de passe connue seulement des collègues d'une même organisation. Même les administrateurs du serveur n'ont pas accès aux données déchiffrées."
          />
          <DataProtectionCard
            number="4"
            content="Les chefs de service peuvent déclencher une procédure pour effacer la totalité des données enregistrées par leur équipe."
          />
          <DataProtectionCard
            number="5"
            content="Une charte encadre l’utilisation de MANO. Elle explicite notamment l’obligation de recueillir le consentement préalable de la personne suivie pour créer un dossier la concernant, lorsque cela est possible."
          />
        </div>
      </section>

      <section className="bg-gray-50" id="qui-sommes-nous">
        <div className="px-5 py-12 lg:py-24 md:container">
          <div className="mb-10 text-center">
            <h3 className="mb-2 text-2xl font-semibold text-center text-black md:text-3xl lg:text-4xl">
              Qui sommes-nous ?
            </h3>
            <p className="text-sm text-gray-600 md:text-base">
              Cet outil a été créé par M. Guillaume DEMIRHAN, infirmier au sein
              du CAARUD EGO de l’association AURORE et est encadré par M. Léon
              GOMBEROFF, directeur de ce service. Il est financé par l’Agence
              Régionale de Santé d’Ile de France et le guichet « Transformation
              numérique des écosystèmes » du plan France Relance. Les
              fonctionnalités de MANO ont été conçues par ses utilisateurs et
              l’outil est en amélioration continue. Il est incubé au sein de la{" "}
              <a href="" className="text-shamrock-400">
                Fabrique numérique du Ministère de la Santé et des Solidarités
              </a>
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <CompanyLogo logoName="ars" />
            <CompanyLogo logoName="fabrique" />
            <CompanyLogo logoName="aurore" />
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-24" id="ils-nous-font-confiance">
        <div className="px-5 mb-16 md:container">
          <div className="mb-8 text-center md:w-10/12 md:mx-auto">
            <h3 className="mb-2 text-2xl font-semibold text-center text-black md:text-3xl lg:text-4xl">
              Ils nous font confiance
            </h3>
            <p className="text-sm text-gray-600 md:text-base">
              Certaines maraudes sont en charge de territoires éclatés (comme
              les différentes gares SNCF de Paris), d'autres d'un micro
              territoire resseré (par exemple une portion des maréchaux entre
              deux portes du périphérique parisien). Certains équipes ne
              travaillent qu'en rue, d'autres gèrent{" "}
              <a
                href="https://www.lesenfantsducanal.fr/nos-actions/busabri/"
                className="text-shamrock-400"
              >
                un accueil de jour
              </a>
              . Certains professionnels suivent uniquement des personnes en
              difficulté psychologique (comme les EMPP), d'autres des personnes
              usagères de drogue (comme{" "}
              <a
                href="https://www.drogues-info-service.fr/Tout-savoir-sur-les-drogues/Se-faire-aider/La-reduction-des-risques#.VJQ7Xl4A8"
                className="text-shamrock-400"
              >
                une SCMR
              </a>
              ). Dans tous les cas, MANO s'adapte à leurs spécificités.{" "}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-10 md:gap-0 md:grid-cols-3">
            <StatisticCard
              number={persons}
              content="Nombre cumulé de personnes suivies"
            />
            <StatisticCard number={actions} content="Nombre cumulé d'actions" />
            <StatisticCard
              number={comments}
              content="Nombre cumulé de commentaires"
            />
          </div>
        </div>

        <div className="flex px-5 space-x-5 overflow-x-auto">
          <TestimonialCard
            name="Marie Lepinoux"
            company="CAARUD Custine"
            // img="one"
            content="“MANO m'aide dans mon travail quotidien auprès des usagers, en nous permettant d'avoir une continuité dans nos suivis”"
          />
          <TestimonialCard
            name="Valentin Rault"
            company="Maraude Equipe Mobile EGO"
            // img="one"
            content="“C’est excellent de pouvoir participer développement de l'outil en tant que professionnel du terrain”"
          />
          <TestimonialCard
            name="Mathilda"
            company="Maraude hôtel PHRH EGO"
            // img="one"
            content={`“On a énormément apprécié l’appli, car même si ce n'était pas fait pour [des équipes en centre d’hébergement], MANO s'est tout à fait adapté à nos besoins. Grâce à l'utilisation de l'agenda partagé entre les équipes, nous n'avons plus les \"ratés\" qu'on pouvait connaître avant.”`}
          />
          <TestimonialCard
            name="Inès Bedrani"
            company="Coordinatrice de maraude les Enfants du Canal"
            img="logo_HD_EnfantsDuCanal.jpg"
            content="“C'est une petite révolution pour nous”"
          />
          <TestimonialCard
            name="Thomas Papin"
            company="Espace de repos Chapelle Aurore-Gaïa"
            img="logo_gaia.jpg"
            img2="aurore.png"
            content="“MANO est vraiment pratique et simple d'utilisation”"
          />
        </div>
      </section>

      <section className="bg-shamrock-50" id="ils-nous-apprecient">
        <div className="container grid grid-cols-12 px-5 py-12 lg:py-24">
          <div className="mb-2 md:flex md:items-center md:col-span-6 col-span-full">
            <h3 className="text-2xl font-semibold text-center text-black md:text-left lg:text-3xl">
              Ils apprécient aussi
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-5 col-span-full md:col-span-6">
            <AppriciateCheck content="la liste des structures spécialisées avec contacts, horaires et itinéraire pour s’y rendre" />
            <AppriciateCheck content="l’outil de suivi de l’évolution des territoires" />
            <AppriciateCheck content="la formation des utilisateurs et utilisatrices par l’équipe de MANO directement en maraude et sur les lieux d'accueil du public ainsi que le support téléphonique" />
            <AppriciateCheck content="le développement toujours en cours de l’application et à l’écoute exclusive des besoins des professionnels du terrain" />
            <AppriciateCheck content="les réunions inter-services des utilisateurs de MANO" />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

const DataProtectionCard = ({ number, content }) => (
  <div className="flex flex-col items-center justify-center px-6 pt-5 pb-6 text-center md:text-left bg-gray-50 md:items-start md:justify-start rounded-2xl">
    <div className="w-8 h-8 mb-4 rounded-full flex-center bg-shamrock-400">
      <span className="text-base font-medium text-white">{number}</span>
    </div>
    <p className="text-sm text-black">{content}</p>
  </div>
);

const CompanyLogo = ({ logoName }) => (
  <div className="w-full h-24 flex-center">
    <img className="h-full" src={`company/${logoName}.png`} alt="" />
  </div>
);

const StatisticCard = ({ number, content }) => (
  <div className="text-center">
    <h4 className="mb-2 text-2xl font-semibold text-shamrock-400">{number}</h4>
    <p className="text-sm text-black text-medium">{content}</p>
  </div>
);

const TestimonialCard = ({ content, img, img2, name, company, target }) => (
  <div className="flex flex-col justify-between flex-none p-4 space-y-4 md:w-96 md:p-8 w-72 bg-gray-50 rounded-xl">
    <p className="text-base text-black">{content}</p>
    <div className="flex items-center">
      {!!img && (
        <div className="w-12 h-12 mr-4 overflow-hidden rounded-full">
          <img
            className="object-contain w-full h-full"
            src={`company/${img}`}
            alt={company}
          />
        </div>
      )}
      {!!img2 && (
        <div className="w-12 h-12 mr-4 overflow-hidden rounded-full">
          <img
            className="object-contain w-full h-full"
            src={`company/${img2}`}
            alt={company}
          />
        </div>
      )}
      <div>
        <p className="text-base font-medium text-black">{name}</p>
        <div className="flex items-center">
          <p className="mr-1 text-sm font-medium text-shamrock-400">
            {company}
          </p>
        </div>
      </div>
    </div>
  </div>
);

const AppriciateCheck = ({ content }) => (
  <div className="flex">
    <HiCheckCircle className="flex-none mr-1 text-shamrock-400 p-0.5 text-xl" />
    <p className="text-sm font-medium text-black">{content}</p>
  </div>
);
