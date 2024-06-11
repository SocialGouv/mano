import { useState } from "react";
import { useRecoilState } from "recoil";
import ButtonCustom from "../../components/ButtonCustom";
import { userState } from "../../recoil/auth";
import API, { tryFetchExpectOk } from "../../services/api";
import OpenNewWindowIcon from "../../components/OpenNewWindowIcon";

const CGUs = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useRecoilState(userState);

  const onSigninValidated = async () => {
    setLoading(true);
    const cgusAccepted = Date.now();
    const [error] = await tryFetchExpectOk(async () => API.put({ path: "/user", body: { cgusAccepted } }));
    if (error) return;
    setUser({ ...user, cgusAccepted });
  };

  return (
    <div
      className="tw-flex tw-w-full tw-flex-col tw-items-center tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-lg tw-bg-white tw-py-20 tw-text-black"
      id="cgus"
    >
      <h1 className="tw-mb-4 tw-mt-20 tw-text-center tw-text-3xl tw-font-semibold tw-text-main">Conditions Générales d'Utilisation de Mano</h1>
      <small className="tw-block tw-text-center tw-font-medium tw-italic">
        Veuillez lire et accepter les Conditions Générales d'Utilisation de Mano avant de continuer
      </small>
      <main className="[&_b]:tw-font-weight-normal tw-mt-20 tw-w-full tw-max-w-prose tw-px-5 [&_b]:tw-mt-20 [&_b]:tw-block">
        <p>
          Les présentes conditions générales d'utilisation (dites « CGU ») fixent le cadre juridique de “Mano” et définissent les conditions d'accès
          et d'utilisation des Services par l'Utilisateur.
        </p>
        <p>
          L'outil MANO a pour objectif l'amélioration des conditions de vie et à la réinsertion des personnes sans abri. Le Service permet notamment,
          par l'intermédiaire d'une application mobile, de&nbsp;:
        </p>
        <ol className="tw-list-inside tw-list-disc">
          <li>
            Planifier des actions (soins, accompagnements, démarches, orientations) à réaliser en lien avec les besoins individuels des personnes
            rencontrées sans abri ;
          </li>
          <li>
            Collecter et partager des informations relatives aux populations afin d'améliorer la qualité de l'accompagnement et des soins dispensés
            ainsi que la connaissance de l'usager et de sa situation médico-sociale ;
          </li>
          <li>Mener à bien les démarches administratives relatives aux populations ;</li>
          <li>Orienter au mieux et au plus proche les populations en fonction de leurs besoins.</li>
          <li>Objectifs et approche terrain</li>
        </ol>
        <p>L'outil MANO est destiné :</p>
        <ol className="tw-list-inside tw-list-disc">
          <li>
            Aux organisations et structures qui organisent des maraudes ainsi qu'aux lieux d'accueil et autres structures médico-sociales et sociales
            pour lesquelles la plateforme apportera une plus-value dans l'accompagnement des personnes accueillies ;
          </li>
          <li>Aux professionnels médico-sociaux et sociaux intervenant dans ces structures.</li>
        </ol>
        <section className="tw-mt-20">
          <h2 className="tw-mb-4">Article 1 – Définitions</h2>
          <ol className="tw-list-inside tw-list-disc">
            <li>« L'Utilisateur » est toute maraude inscrite utilisant l'outil Mano. Il ne peut s'agir que d'une personne physique.</li>
            <li>
              « L'Usager » est toute personne vivant dans la rue étant susceptible de bénéficier d'un soin, accompagnement ou une interaction avec une
              maraude, qu'il soit « Utilisateur » de l'outil ou non.
            </li>
            <li>
              « L'Administrateur » est l'organisme qui détient le compte « Organisation » et va gérer les maraudes et tâches, soins et accompagnements
              réalisés.
            </li>
            <li>
              « L'Organisation » est la personne morale responsable des actions réalisées dans Mano. Elle est titulaire de compte « Administrateur ».
            </li>
            <li>«Maraude» est le parcours effectué dans les rues pour porter assistance aux personnes qui y vivent</li>
          </ol>
        </section>
        <section className="tw-mt-20">
          <h2 className="tw-mb-4">Article 2 - Champ d'application</h2>
          <p>
            L'inscription est gratuite et réservée aux maraudes allant à la rencontre des usagers dans la rue et aux structures qui les organisent.
          </p>
        </section>
        <section className="tw-mt-20">
          <h2 className="tw-mb-4">Article 3 – Objet</h2>
          <p>
            Mano a pour objectif d'améliorer l'accompagnement par les structures sociales et médico-sociales. L'outil vise à augmenter la connaissance
            du territoire sur lequel œuvrent les maraudes et autres dispositifs sociaux ou médico-sociaux à l'échelle de leur structure, et de pouvoir
            mieux organiser et suivre leurs équipes, ainsi que les interactions, soins et accompagnements délivrés aux usagers.
          </p>
        </section>
        <section className="tw-mt-20">
          <h2 className="tw-mb-4">Article 4 - Fonctionnalités</h2>
          <h3 className="tw-mb-4">4.1 Création des différents profils</h3>
          <h4 className="tw-mb-4">A – Création du profil « Administrateur »</h4>
          <p>
            Toute structure utilisant « Mano » peut créer un profil « Organisation » qui lui permet de gérer ses équipes et ses maraudes en créant les
            comptes liés à sa structure. Chaque « Organisation » détient une clé de chiffrement qui permet de protéger le compte en chiffrant
            l'intégralité des données relatives aux personnes accompagnées de bout en bout. L'Administrateur créé et gère également les équipes
            auxquelles sont rattachées les Utilisateurs, c'est-à-dire les personnes appartenant à des Organisations.
          </p>
          <h4 className="tw-mb-4">A – Création du profil « Utilisateur »</h4>
          <p>
            La création du profil est réalisée par un compte « Administrateur » de son Organisation. En tant que personne physique, elle peut utiliser
            l'outil dans l'objectif d'accompagner les usagers dans le cadre de son activité professionnelle auprès de ces derniers.
          </p>
          <p>Deux types de profil « Utilisateurs » peuvent être créés :</p>
          <ol className="tw-list-inside tw-list-disc">
            <li>Le profil « normal » ; l'Administrateur choisit si le profil normal est également un « professionnel de santé » ;</li>
            <li>
              Le profil «restreint», pour les personnels de la structure qui ne sont pas professionnels d'accompagnement ou pour la prise en charge
              médico-social. Les profils restreints ne peuvent pas être professionnel de santé.
            </li>
          </ol>
          <h3 className="tw-mb-4">4.2 Fonctionnalités du profil « Administrateur »</h3>
          <p>
            Le compte ou profil « Administrateur » a également accès aux comptes rendus réalisés par les Utilisateurs. Le compte détient une clé de
            chiffrement qui lui permet de se connecter à l'application.
          </p>
          <p>Par ailleurs, le compte peut, notamment via l'onglet « Organisation » :</p>
          <ol className="tw-list-inside tw-list-disc">
            <li>Configurer et Organiser le compte « Organisation » ;</li>
            <li>
              Ajouter et préciser les types de Services susceptibles d'être proposés par l'Organisation, facilitant ainsi un accès aux données
              strictement nécessaires ;
            </li>
            <li>
              Personnaliser les champs des dossiers de personnes suivies, notamment eu égard aux informations médicales. Seuls les professionnels de
              santé ou des personnes habilitées au sein d'établissements de médicaux ou médico-sociaux peuvent partager et accéder à de tels
              informations ;
            </li>
            <li>Créer et supprimer les champs personnalisés utilisés par les Utilisateurs ;</li>
            <li>
              Créer des actions, lorsqu'une action nouvelle et non prévue a été réalisée dans la journée ou doit être réalisée sans qu'elle ne soit
              prévue ;
            </li>
            <li>Accéder aux statistiques de suivi des Organisations et des équipes via l'onglet « Statistique » à gauche de l'outil.</li>
          </ol>
          <p>
            Par ailleurs, le compte ou profil « Organisation » organise les Utilisateurs et les inclut dans des « équipes » différentes. Il peut
            également avoir accès à l'ensemble des comptes créés par sa structure, ainsi qu'à tous les comptes rendus des Utilisateurs, peu importe
            l'équipe de l'utilisateur.
          </p>
          <h3 className="tw-mb-4">4.3 Fonctionnalités du profil « Utilisateur »</h3>
          <p>
            Chaque compte ou profil « Utilisateur » vise à ce que les utilisateurs améliorent le suivi qu'elles délivrent aux usagers. Ils sont
            ouverts aux personnels d'accompagnement social ou médico-social. Pour ce faire, ils peuvent notamment créer de nouveaux comptes rendus
            lorsqu'une action nouvelle et non prévue a été réalisée dans la journée ou doit être réalisée sans qu'elle ne soit prévue. Ils peuvent
            rédiger les comptes rendus qui étaient déjà prévus, une fois l'action réalisée.
          </p>
          <p>Les « Équipes » ne peuvent avoir accès qu'aux comptes rendus réalisés par les Utilisateurs de leur propre équipe.</p>
          <h4 className="tw-mb-4">A - Accès, visualisation et modification de l'agenda</h4>
          <p>
            Chaque profil Utilisateur peut avoir accès à un agenda qui lui permet de savoir les actions et les personnes qui ont été suivies les jours
            précédents, mais également les actions et les personnes à suivre dans les jours qui arrivent. La page « accueil » permet aux profils
            d'avoir une vision d'ensemble. Les profils peuvent, par ailleurs, accéder à la page « agenda » où ils incluent au sein de l'équipe des
            actions à réaliser et des personnes à accompagner. Chaque carte de l'agenda est classée par date, heure et dispose d'un champ libre.
          </p>
          <h4 className="tw-mb-4">B - Gestion des personnes suivies</h4>
          <p>
            Les profils « Utilisateurs » peuvent effectuer de nombreuses actions qui leur permettent d'améliorer le suivi des personnes. Notamment,
            via l'onglet « personnes suivies » ils pourront :
          </p>
          <ol className="tw-list-inside tw-list-disc">
            <li>
              Créer une nouvelle personne accompagnée, lorsqu'ils rencontrent un nouvel usager et préciser. L'utilisateur va intégrer les informations
              identifiantes de la personne accompagnée (nom, prénom, genre, date de naissance, informations de sa situation domiciliaire et depuis
              quand elle est dans la rue, des informations sociales, dont son emploi si elle en a, ses ressources, et les raisons qui l'on conduite à
              être dans la rue)
            </li>
            <li>Réaliser des recherches par mots clés (nom, description, commentaire ou action pour un compte de personne suivie)</li>
            <li>
              Créer des actions à réaliser avec ou pour les personnes et leur suivi. Ces actions sont librement créées par les organismes et prennent
              la forme d'un « champ libre ». Elles sont attachées à une personne et à une date spécifique. Les Organisations et les utilisateurs
              peuvent préciser leur degré d'urgence
            </li>
            <li>Visualiser la liste des personnes suivies et de celles nécessitant une attention particulière.</li>
          </ol>
          <h4 className="tw-mb-4">C - Statistique des équipes</h4>
          <p>
            Les profils « Utilisateurs » peuvent suivre et avoir accès aux statistiques de la prise en charge via un onglet spécifique. La page permet
            :
          </p>
          <ol className="tw-list-inside tw-list-disc">
            <li>Des statistiques générales, sur le nombre de personnes suivies, le nombre d'actions réalisées et le nombre de rencontres</li>
            <li>
              Des statistiques spécifiques sur l'accueil et les actions réalisées (typologie d'accueil, répartition des actions par catégorie et
              nombre de Services rendus)
            </li>
            <li>
              Des statistiques spécifiques sur les personnes suivies (nombre de personnes suivies, temps de suivi moyen, temps d'errance des personnes
              en moyenne, typologie de nationalité, genre, situation personnelle, motif de situation de rue, ressources des personnes suivies, tranche
              d'âges, durée du suivi, temps d'errance, type d'hébergement, couverture médicale des personnes, personnes très vulnérables, pathologies
              chroniques)
            </li>
            <li>Statistiques relatives aux passages, rencontres, observations et comptes-rendus</li>
            <li>Statistiques relatives aux consultations.</li>
          </ol>
          <h4 className="tw-mb-4">D - Accès, création et gestion d'un dossier médical</h4>
          <p>
            Parmi les profils « Utilisateurs », seuls les professionnels de santé peuvent avoir accès aux dossiers médicaux. L'Organisation créatrice
            du compte « Utilisateur » détermine si le compte créé l'est pour un professionnel de santé.
          </p>
          <p>Ces comptes utilisateurs spécifiques vont pouvoir :</p>
          <ol className="tw-list-inside tw-list-disc">
            <li>
              Créer un dossier médical qui ne sera pas visible ou accessible aux autres utilisateurs n'étant pas Utilisateur « professionnel de santé
              »
            </li>
            <li>Paramétrer le dossier médical en ajoutant</li>
            <li>
              Créer des « consultations » médicales qui permettent de personnaliser des champs relatifs aux personnes suivies lors de consultations
            </li>
            <li>Créer des catégories et des actions spécifiques (ex : « orientation » ; « vaccination »)</li>
            <li>
              Entrer et visualiser les informations médicales des personnes suivies (type de couverture médicale, PMU, Sécurité Sociale, catégorie
              d'antécédents, consommation de médicaments et mode de consommation).
            </li>
          </ol>
          <h3 className="tw-mb-4">4.4 Fonctionnalités du profil Utilisateur « restreint »</h3>
          <p>
            L'Utilisateur « restreint » est un agent qui aura accès à un dossier avec des informations très limités : nom, prénom, date de naissance,
            pseudo.
          </p>
          <h3 className="tw-mb-4">4.5 Import et export de document</h3>
          <p>Les fonctions d'import et d'export de document dépendent des différents profils.</p>
          <p>
            Les profils Utilisateur « professionnels de santé » peuvent importer et exporter toutes les informations, y compris celles relatives aux
            dossiers médicaux des personnes suivies.
          </p>
          <p>
            Les profils « accès restreint » n'ont accès qu'aux données d'identifications des personnes. Elles peuvent les importer et les exporter.
          </p>
          <p>
            Les autres profils peuvent importer et exporter l'ensemble des données et informations comprise dans MANO, à l'exception des données des
            dossiers médicaux des personnes suives.
          </p>
        </section>
        <section>
          <h2 className="tw-mb-4 tw-mt-20">Article 5 - Responsabilités</h2>
          <h3 className="tw-mb-4">5.1 Responsabilités de SESAN</h3>
          <p>
            Les sources des informations diffusées sur l'outil sont réputées fiables mais l'outil ne garantit pas qu'elles soient exemptes de défauts,
            d'erreurs ou d'omissions.
          </p>
          <p>
            Le SESAN s'engage à la sécurisation de l'outil, notamment en prenant toutes les mesures nécessaires permettant de garantir la sécurité et
            la confidentialité des informations fournies.
          </p>
          <p>
            Le SESAN fournit les moyens nécessaires et raisonnables pour assurer un accès continu à l'application. Il se réserve la liberté de faire
            évoluer, de modifier ou de suspendre, sans préavis, l'application pour des raisons de maintenance ou pour tout autre motif jugé
            nécessaire.
          </p>
          <p>
            Le SESAN déclare avoir souscrit une police d'assurance auprès d'une compagnie d'assurance notoirement solvable couvrant sa responsabilité
            civile au titre des présentes Conditions Générales d'Utilisation. Le SESAN s'oblige à maintenir en vigueur ladite police d'assurance
            pendant toute la durée de la mise en ligne du Service.
          </p>
          <p>
            En cas de force majeure, telle que définie par la loi française et interprétée par les juridictions françaises, la non- exécution de l'une
            quelconque de ses obligations contractuelles par l'une ou l'autre des Parties n'engage pas sa responsabilité.
          </p>
          <p>
            Le SESAN s'engage à notifier immédiatement à chaque Organisation et/ou Utilisateur, dès qu'il en a connaissance, tout incident grave,
            toute intrusion, divulgation, accès illicite ou altération et toute tentative d'intrusion, divulgation, accès illicite ou altération du
            Service ou toute malveillance contre les données à caractère personnel ayant ou susceptible d'avoir un impact grave pour l'Organisation
            et/ou l'Utilisateur.
          </p>
          <p>
            Par ailleurs, les Organisations et utilisateurs acceptent les caractéristiques et limites d'internet et, en particulier, reconnaissent
            avoir connaissance de la nature du réseau Internet et notamment de ses performances techniques. La responsabilité de SESAN ne saurait être
            engagée à quelque titre que ce soit, sans que cette liste ne soit limitative :{" "}
            <ol className="tw-list-inside tw-list-disc">
              <li>En cas de modification, suspension, interruption volontaire ou non, indisponibilité totale ou partielle du Service ; </li>
              <li>
                Pour tout ce qui est inhérent à la fiabilité de la transmission des données, aux temps d'accès, et éventuelles restrictions du réseau
                Internet ou des réseaux qui lui sont connectés.{" "}
              </li>
              <li>
                En cas d'interruption des réseaux d'accès au Service, d'erreur de transmission ou de problèmes liés à la sécurité des transmissions,
                en cas de défaillance du matériel de réception.
              </li>
            </ol>
          </p>
          <h3 className="tw-mb-4">5.2 Les Organisations</h3>
          <p>
            Les Organisations personnes morales détiennent la clé de chiffrement des données contenues dans MANO. Elles s'assurent de garder la clé
            secrète et d'en limiter l'accès aux personnes habilitées au sein de l'Organisation.
          </p>
          <p>
            Chaque Organisation identifie les professionnels de santé pouvant avoir accès aux dossiers médicaux. Elles demeurent responsables de
            l'habilitation ainsi générée et du respect de la confidentialité des informations inscrites dans MANO.
          </p>
          <p>
            Les Organisations s'assurent de garder leurs mots de passe secret. Toute divulgation du mot de passe, quelle que soit sa forme, est
            interdite. Elles assument les risques liés à l'utilisation de son identifiant et mot de passe.
          </p>
          <p>
            Elles s'engagent à ne pas commercialiser les données reçues et à ne pas les communiquer à des tiers en dehors des cas prévus par la loi.
          </p>
          <p>
            Chaque organisation reconnaît et accepte que le rôle de SESAN se limite au maintien en conditions opérationnelles du Service et à la
            création de comptes Administrateurs et Utilisateur c'est-à-dire à des prestations purement techniques. SESAN n'accède pas aux données des
            usagers ni aux clés de déchiffrement.
          </p>
          <h3 className="tw-mb-4">5.3 L'Utilisateur</h3>
          <p>
            L'Utilisateur s'assure de garder son mot de passe secret. Toute divulgation du mot de passe, quelle que soit sa forme, est interdite. Il
            assume les risques liés à l'utilisation de son identifiant et mot de passe.
          </p>
          <p>Le mot de passe sera composé d'au minimum douze caractères comprenant des majuscules, des minuscules et des caractères spéciaux.</p>
          <p>Il s'engage à ne pas commercialiser les données reçues et à ne pas les communiquer à des tiers en dehors des cas prévus par la loi.</p>
          <p>
            Toute information transmise par l'Utilisateur est de sa seule responsabilité. La Responsabilité de SESAN se limitant uniquement au
            maintien en conditions opérationnelles du Service et à la création de comptes administrateurs et Utilisateurs pour les structures. Il est
            rappelé que toute personne procédant à une fausse déclaration pour elle-même ou pour autrui s'expose, notamment, aux sanctions prévues à
            l'article 441-1 du code pénal, prévoyant des peines pouvant aller jusqu'à trois ans d'emprisonnement et 45 000 euros d'amende.
          </p>
          <p>
            L'Utilisateur s'engage à ne pas mettre en ligne de contenus ou informations contraires aux dispositions légales et réglementaires en
            vigueur.
          </p>
          <h3 className="tw-mb-4">5.4 Le « Professionnel de santé »</h3>
          <p>
            Le Professionnel de santé s'assure de garder son mot de passe secret. Toute divulgation du mot de passe, quelle que soit sa forme, est
            interdite. Il assume les risques liés à l'utilisation de son identifiant et mot de passe. Le mot de passe sera composé d'au minimum douze
            caractères comprenant des majuscules, des minuscules et des caractères spéciaux.
          </p>
          <p>Il s'engage à ne pas commercialiser les données reçues et à ne pas les communiquer à des tiers en dehors des cas prévus par la loi.</p>
          <p>
            Nous rappelons que les Professionnels de santé sont soumis au secret professionnel et ne peuvent communiquer des informations sur des
            personnes prises en charge que conformément aux dispositions de l'article 1110-4 du code de la santé publique.
          </p>
          <p>
            Toute information transmise par le Professionnel de santé est de sa seule responsabilité. Il est rappelé que toute personne procédant à
            une fausse déclaration pour elle-même ou pour autrui s'expose, notamment, aux sanctions prévues à l'article 441-1 du code pénal, prévoyant
            des peines pouvant aller jusqu'à trois ans d'emprisonnement et 45 000 euros d'amende.
          </p>
          <p>
            Il s'engage notamment à ne pas mettre en ligne de contenus ou informations contraires aux dispositions légales et réglementaires en
            vigueur.
          </p>
          <p>Il est rappelé que le SESAN n'a pas accès aux données renseignées par le Professionnel de santé.</p>
        </section>
        <section>
          <h2 className="tw-mb-4 tw-mt-20">Article 6 – Hébergement de données de santé</h2>
          <p>
            Chaque Organisation et Utilisateur de santé déclare être parfaitement informé que le SESAN n'est pas hébergeur de données de Santé. Le
            SESAN fait recours à un tiers hébergeur agréé.
          </p>
          <p>
            Les Utilisateurs de MANO sont seuls responsables de l'utilisation qu'ils font du Service. Le SESAN ne peut garantir la pertinence,
            l'actualité et/ou la véracité des informations et des données à caractère personnel accessibles ou transmises via le Service, celles-ci
            étant fournies par les différentes catégories de personnes concernées sus-indiquées, sans possibilité de contrôle de SESAN.
          </p>
        </section>
        <section>
          <h2 className="tw-mb-4 tw-mt-20">Article 7 Dispositions diverses</h2>
          <h3 className="tw-mb-4">7.1 Stipulations diverses</h3>
          <p>
            Dans l'hypothèse où une seule ou plusieurs stipulations des présentes seraient considérées comme nulles ou non avenues, cette disposition
            sera supprimée. Ni la validité, ni l'opposabilité des autres dispositions n'en seraient affectées.
          </p>
          <p>
            Le fait que l'une ou l'autre des Parties ne se prévale pas un moment donné de l'une des quelconques clauses ou qu'elle tolère
            l'inexécution de façon temporaire ou permanente des obligations de l'autre Partie ne peut être interprété comme valant renonciation à s'en
            prévaloir ultérieurement.
          </p>
          <p>
            Le fait pour l'une ou l'autre des Parties de tolérer une inexécution ou une exécution imparfaite des présentes Conditions Générales
            d'Utilisation ou, plus généralement, de tolérer tout acte, abstention ou omission de l'autre Partie non conforme aux stipulations des
            présentes Conditions Générales d'Utilisation ne saurait conférer un droit quelconque à la Partie bénéficiant de cette tolérance.
          </p>
          <h3 className="tw-mb-4">7.2 Contenus illicites</h3>
          <p>Tout utilisateur ou organisation constatant la présence d'un contenu illicite s'engage à le déclarer à SESAN.</p>
          <p>
            Conformément à l'article 6-I.5 de la loi n°2004-575 pour la confiance dans l'économie numérique, cette notification doit impérativement
            comporter :
          </p>
          <ol className="tw-list-inside tw-list-disc">
            <li>La date de la notification.</li>
            <li>Si le notifiant est une personne physique : ses noms, prénoms, profession, domicile, nationalité, date et lieu de naissance.</li>
            <li>Si le notifiant est une personne morale : sa forme, sa dénomination, son siège social et l'organe qui la représente légalement.</li>
            <li>La description précise des faits litigieux et leur localisation précise.</li>
            <li>Les motifs pour lesquels le contenu doit être retiré.</li>
          </ol>
          <p>
            Le SESAN s'engage à prendre toutes les mesures appropriées s'il considère le contenu contraire à l'ordre public, aux bonnes mœurs ou à la
            finalité du Service.
          </p>
          <h3 className="tw-mb-4">7.3 Cookies</h3>
          <p>
            La Plateforme peut implanter sur le terminal informatique de l'Utilisateur des cookies, dont l'objectif est d'une part d'assurer le bon
            fonctionnement de la Plateforme, d'autre part de mesurer l'audience de la Plateforme.
          </p>
          <h3 className="tw-mb-4">7.4 Disponibilité et maintenance</h3>
          <p>
            SESAN s'engage à faire le nécessaire pour assurer une disponibilité du Service. SESAN se réserve la possibilité d'interrompre, suspendre
            ou modifier temporairement et sans préavis l'accès au Service, et ce notamment pour des raisons de sécurité, pour la maintenance ou
            l'amélioration du Service ou pour améliorer la disponibilité des informations.
          </p>
          <p>
            SESAN s'engage à fournir tous les efforts nécessaires pour informer les utilisateurs ou leurs organisations préalablement à cette
            interruption du Service. L'indisponibilité du Service ne donne droit à aucune indemnité.
          </p>
          <p>
            Par ailleurs, l'utilisateur s'engage à contribuer à l'amélioration du Service, en signalant les défauts éventuels et, le cas échéant, en
            proposant toute amélioration.
          </p>
          <p>
            Dans ce laps de temps, seul SESAN peut corriger ou faire corriger les défauts ou recourir, si nécessaire, à une solution de contournement
            pour remédier aux défauts.
          </p>
          <p>
            Le Service est distribué sous licence « open source » spécifique que l'utilisateur est tenu d'approuver, préalablement à leur utilisation.
          </p>
          <p>
            Les garanties consenties aux utilisateurs dans le cadre des présentes Conditions Générales d'Utilisation sont exclusives de toute autre
            garantie légale ou contractuelle, explicite ou implicite.
          </p>
          <h3 className="tw-mb-4">7.5 Caducité</h3>
          <p>
            La relation contractuelle régie par les présentes Conditions Générales d'Utilisation est indépendante de tout autre contrat, même passé
            entre les parties et/ou si un tel contrat devait être nécessaire à la réalisation d'une opération d'ensemble envisagée par l'une ou
            l'autre des Parties. Partant, la disparition, pour quelle que cause que ce soit, de l'un quelconque des contrats de l'ensemble,
            n'entraînera pas la caducité de la relation contractuelle régie par les présentes Conditions Générales d'Utilisation.
          </p>
          <h3 className="tw-mb-4">7.6 Restriction d'accès</h3>
          <p>
            En cas de manquement aux obligations des présentes Conditions Générales d'Utilisation, SESAN se réserve la possibilité de restreindre
            l'accès au Service concerné en suspendant à titre conservatoire le Compte d'accès concerné ou de suspendre à titre conservatoire le compte
            administrateur créé par un l'organisation.
          </p>
          <p>
            Lorsqu'il envisage de prendre une mesure de restriction ou de suspension, SESAN en informe sans délai et par tout moyen l'organisation
            et/ou l'utilisateur, en lui indiquant le ou les manquements à l'origine de cette décision, les moyens d'y remédier, le cas échéant, et la
            possibilité de faire valoir ses arguments dans un délai de quinze (15) jours suivant la notification. La mesure de restriction ou de
            suspension ne peut être prise que si au terme de ce délai, le ou les manquements persistent et après que l'Utilisateur et/ou
            l'Organisation a été mis en mesure de faire valoir ses arguments.
          </p>
          <p>
            Par exception à ce qui précède, en cas de manquement compromettant la sécurité et la confidentialité des données à caractère personnel, du
            Service ou lorsque le manquement est insusceptible de régularisation, la mesure de restriction ou de suspension peut être prise
            directement et avec effet immédiat par le SESAN. Le cas échéant, la mesure est portée à la connaissance du concerné sans délai et par tout
            moyen. Ce dernier dispose d'un délai de quinze (15) jours, suivant la notification, pour présenter ses arguments et demander la levée de
            la mesure.
          </p>
          <h3 className="tw-mb-4">7.7 Conflit entre les parties</h3>
          <p>
            Tout litige qui surviendrait concernant la conclusion, l'interprétation et l'exécution des présentes devra faire l'objet d'une tentative
            de règlement amiable. Toutefois, pendant la période de règlement amiable, le SESAN conserve la possibilité de prendre des mesures de
            restriction d'accès au Service à titre conservatoire.
          </p>
          <p>
            En cas de non résolution amiable du conflit dans un délai d'un (1) mois, la partie la plus diligente pourra saisir le Tribunal compétent.
          </p>
          <h3 className="tw-mb-4">7.8 Droit applicable</h3>
          <p>Les conditions générales d'utilisation sont soumises à la loi française.</p>
          <h3 className="tw-mb-4">7.9 Mise à jour des conditions d'utilisation</h3>
          <p>
            Les termes des présentes conditions générales d'utilisation peuvent être amendés à tout moment, en fonction des modifications apportées à
            l'outil, de l'évolution de la législation ou pour tout autre motif jugé nécessaire. Chaque modification donne lieu à une nouvelle version
            qui est acceptée par les parties.
          </p>
        </section>
      </main>
      <ButtonCustom
        className="tw-m-auto tw-mt-20 tw-w-56 tw-rounded-3xl tw-text-base"
        loading={loading}
        type="submit"
        color="primary"
        title="Accepter et continuer"
        onClick={onSigninValidated}
      />
      <a className="tw-mb-20 tw-mt-3 tw-block tw-text-xs" href="/cgu.pdf" target="_blank" rel="noreferrer">
        Télécharger le .pdf <OpenNewWindowIcon />
      </a>
    </div>
  );
};

export default CGUs;
