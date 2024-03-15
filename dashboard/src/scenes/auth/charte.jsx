import React, { useState } from "react";
import { useRecoilState } from "recoil";
import ButtonCustom from "../../components/ButtonCustom";
import { userState } from "../../recoil/auth";
import API from "../../services/api";
import OpenNewWindowIcon from "../../components/OpenNewWindowIcon";

const Charte = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useRecoilState(userState);

  const onSigninValidated = async () => {
    setLoading(true);
    const termsAccepted = Date.now();
    const response = await API.put({ path: "/user", body: { termsAccepted } });
    if (!response.ok) return;
    setUser({ ...user, termsAccepted });
  };

  return (
    <div
      className="tw-flex tw-w-full tw-flex-col tw-items-center tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-lg tw-bg-white tw-py-20 tw-text-black"
      id="cgus"
    >
      <h1 className="tw-mb-4 tw-mt-20 tw-text-center tw-text-3xl tw-font-semibold tw-text-main">Charte d'Utilisation de Mano</h1>
      <small className="tw-block tw-text-center tw-font-medium tw-italic">
        Veuillez lire et accepter la Charte d'Utilisation de Mano avant de continuer
      </small>
      <main className="[&_b]:tw-font-weight-normal tw-w-full tw-max-w-prose tw-px-5 [&_b]:tw-mt-20 [&_b]:tw-block [&_ol_>_li]:tw-mb-8 [&_ol_>_li]:tw-mt-20 [&_ol_>_li]:tw-font-bold [&_span]:tw-mb-8 [&_span]:tw-block [&_ul>li]:tw-mb-4">
        <ol>
          <li>Présentation du dispositif et propriété des données</li>
          <p>
            MANO est un outil destiné aux maraudes, équipes mobiles et professionnel·le·s intervenant sur des lieux d’accueil. Il comprend une
            application accessible en rue et une interface web.
            <br />
            <br />
            Les données (personnes suivies, actions, territoires, statistiques, comptes-rendus) sont stockées par MANO sur des serveurs protégés et
            agréés “données de santé” et sont la propriété de chaque structure utilisatrice. Le présent document est une charte encadrant la création,
            le stockage et l'utilisation de ces données. Cette charte a été créée avec les utilisateurs et continuera d'évoluer au fur et à mesure des
            retours des utilisateurs.
            <br />
            <br />
            MANO est un outil gratuit.
          </p>
          <li>Objectifs et approche terrain</li>
          <ul>
            <li>
              MANO a pour finalité d’outiller ses utilisateurs dans l’accompagnement de leurs publics et ainsi faciliter l’accompagnement de ces
              personnes.
            </li>
            <li>
              L’équipe MANO s’engage à penser tout développement en cherchant à être au plus proche de l’éthique professionnelle inhérente au travail
              médico-social des utilisateurs.
            </li>
            <li>
              L’équipe MANO s’engage à organiser un écosystème&nbsp;: des réunions inter-services utilisant l’outil sont organisées une fois par mois.
              Ces points sont l'occasion d’échanger sur les pratiques et expériences avec MANO et de remonter les besoins du terrain.
            </li>
            <li>
              L’équipe MANO s’engage à prendre en compte les retours du terrain et à inclure les professionnel·le·s dans le processus de développement
              de l'outil.
            </li>
          </ul>
          <li>Installation et prise en main</li>
          <ul>
            <li>L’équipe MANO s’engage à présenter l’outil et à former les équipes utilisatrices.</li>
            <li>L’équipe MANO s’engage à accompagner les équipes dans l'utilisation de MANO sur le terrain.</li>
            <li>L’équipe MANO s’engage à fournir une assistance téléphonique.</li>
          </ul>
          <li>Évolution de l'outil</li>
          <p>
            MANO évolue en continu. Les modifications apportées sont faites sur la base des retours des utilisateurs. A cet effet, ils et elles
            peuvent remonter des besoins ou des propositions d'évolution au travers des questionnaires disponibles dans l'onglet "Profil". L'équipe
            MANO s'engage à en prendre connaissance sous 3 jours ouvrés. Les équipes peuvent également regrouper leurs retours et les soumettre lors
            des réunions mensuelles inter-services.
          </p>
          <li>Aspects techniques</li>
          <ul>
            <li>Les utilisateurs peuvent signaler tout dysfonctionnement ou soumettre toute idée via le formulaire de satisfaction dans l'outil.</li>
            <li>L’équipe MANO s’engage à effectuer la maintenance du produit.</li>
          </ul>
          <li>Aspects juridiques et protection des données</li>
          <ul>
            <li>Les administrateurs des équipes ont la possibilité d'écraser l’ensemble de leurs données à tout moment.</li>
            <li>L’équipe MANO s’engage à chiffrer les données côté client et les sauvegardes.</li>
            <li>
              L’équipe MANO s’engage à limiter les accès aux informations. Chaque structure accède à ses données, sans pouvoir accéder aux données des
              autres structures.
            </li>
            <li>
              L’homologation du service par le ministère de la santé est initiée et couvrira une période intermédiaire jusqu'au développement du
              service sous sa forme définitive.
            </li>
            <li>
              L’équipe MANO ne peut accéder aux données des équipes et des personnes suivies. Elle peut cependant accéder aux statistiques globales
              d’utilisation de l’outil ne contenant aucune information personnelle concernant les personnes suivies par les structures.
            </li>
            <li>
              L’équipe MANO s’engage à stocker les données sur des serveurs agréés données de santé et à maintenir un niveau de sécurité optimal afin
              de prévenir toute fuite de données pouvant porter préjudice aux personnes suivies et aux utilisateurs.
            </li>
          </ul>
          <li>Engagement des utilisateurs</li>
          <span>Tout utilisateur de MANO s'engage à protéger les données des personnes suivies&nbsp;:</span>
          <ul>
            <li>
              Toute personne suivie devra être informée et donner son accord oral pour figurer dans MANO, après une brève présentation de l’outil. Il
              est cependant possible de déroger à cette règle, notamment si la personne présente un danger pour autrui ou pour elle-même, et nécessite
              donc une prise en charge particulière par les équipes, dont la traçabilité apportera un bénéfice dans l’accompagnement.
            </li>
            <li>
              Vigilance lors de la saisie d'informations concernant les personnes suivies&nbsp;: les professionnel·le·s ne saisissent que le strict
              nécessaire à l'accompagnement (en anonymisant notamment au maximum les dossiers). Il est cependant possible d’utiliser l’identité de la
              personne, si elle est nécessaire à l’accompagnement.
            </li>
            <li>Les notions de secret professionnel et de secret professionnel partagé s'appliquent à l'utilisation de MANO.</li>
            <li>Les identifiants et mots de passe sont personnels. Il est formellement interdit de les partager.</li>
            <li>
              Il est formellement interdit de partager les données d'une personne suivie sans son consentement avec des individus n'appartenant pas à
              son équipe ou n’ayant aucun lien avec son suivi médico-social.
            </li>
            <li>
              Création de compte et clôture de compte&nbsp;: les personnes qui ont un rôle d'administrateur s'engagent à maintenir à jour les accès à
              MANO. En cas de départ d'un membre de l'équipe, son compte doit être désactivé le jour même. De même, seul·e·s les professionnel·le·s en
              contact avec les personnes suivies ont le droit d'avoir accès à leurs données personnelles.
            </li>
            <li>
              La duplication des données pour un autre usage que celui prévu par l'équipe, dans le strict cadre de sa mission est interdite. L'accès
              au service se fait dans un contexte professionnel et non personnel. Ainsi, l’accès à l’interface web se fait exclusivement depuis un
              poste de travail professionnel et l’accès à l’application se fait sur un téléphone professionnel. Des ordinateurs ou téléphones
              personnels ne doivent pas être utilisés pour accéder au service.
            </li>
            <li>Falsification des données&nbsp;: tout utilisateur de MANO s'engage à la véracité des données qu'il renseigne.</li>
            <li>
              Les équipes utilisatrices s’assurent d’utiliser des ordinateurs, smartphones, tablettes, protégées par des mots de passe, ainsi que par
              un antivirus, afin d’éviter tout risque de violation de données.
            </li>
          </ul>
        </ol>
        <b>
          Tout manquement à ces engagements pourra conduire MANO à retirer l'utilisation de l'outil à un·e professionnel·le, une équipe ou une
          organisation.
        </b>
      </main>
      <ButtonCustom
        className="tw-m-auto tw-mt-20 tw-w-56 tw-rounded-3xl tw-text-base"
        loading={loading}
        type="submit"
        color="primary"
        title="Accepter et continuer"
        onClick={onSigninValidated}
      />
      <a className="tw-mb-20 tw-mt-3 tw-block tw-text-xs" href="/charte.pdf" target="_blank" rel="noreferrer">
        Télécharger le .pdf <OpenNewWindowIcon />
      </a>
    </div>
  );
};

export default Charte;
