import Dropdown from "./dropdown";
import Embed from "./embed";

const Web = () => (
  <div className="space-y-2">
    <Dropdown title="Comment MANO peut-il répondre aux besoins d'équipes si différentes, dont la mienne ?" defaultOpen={false}>
      <ul className="mb-4 list-card">
        <li>
          Toutes les équipes de maraude et en charge d'accueils de jour que nous avons rencontré ont leurs spécificités. Souvent, elles ont des besoins uniques, qu'aucune autre équipe ne présente.
        </li>
        <li>
          MANO propose une série de fonctionnalités (dossiers de suivi de personnes, système d'actions, observations de territoires...). Leur complémentarité assure que chaque équipe peut utiliser MANO d'une manière différente, qui lui permet de répondre spécifiquement à ses besoins.
        </li>
        <li>
          Aucune équipe ne doit se débrouiller avec MANO pour trouver comment l'utiliser à son image. Notre équipe vous accompagne le temps qu'il faut pour déterminer avec vous l'usage qui vous conviendra le mieux !
        </li>
      </ul>
    </Dropdown>

    <Dropdown title="Comment se connecter pour la première fois à MANO ?" defaultOpen={false}>
      <h4 className="mb-6 text-base font-semibold text-shamrock-400">Dans tous les cas</h4>
      <div className="mb-3 font-semibold">
        <p>
          1. Utiliser n’importe quel navigateur{" "}
          <span class="text-red-400">sauf "Internet Explorer"</span> (ni Google Chrome si jamais on utilise encore Windows 7 ou antérieure) et se rendre à l’adresse
        </p>
        <a
          className="transition-all text-shamrock-400 hover:text-shamrock-500"
          href="https://dashboard-mano.fabrique.social.gouv.fr">
          https://dashboard-mano.fabrique.social.gouv.fr.
        </a>
      </div>

      <ul className="mb-4 list-card">
        <li>
          La dernière version de "Firefox" se télécharge gratuitement{" "}
          <a
            className="underline"
            href="https://www.mozilla.org/fr/firefox/new/"
            target="_blank"
            rel="noreferrer">
            ici
          </a>
          .
        </li>
        <li>
          La dernière version de "Google Chrome" se télécharge gratuitement{" "}
          <a
            className="underline"
            href="https://www.google.com/intl/fr_fr/chrome/"
            target="_blank"
            rel="noreferrer">
            ici
          </a>
          .
        </li>
      </ul>

      <p className="mb-3">Facultatif : Ajouter MANO à vos marques-pages ou favoris.</p>

      <ul className="mb-6 list-card">
        <li>
          Sur Firefox ou Chrome, le bouton pour marquer une page est l’étoile à droite de la barre
          d'adresse.
        </li>
      </ul>

      <Embed
        link="https://www.youtube.com/embed/fMdoMf4VqQo"
        subtitle="Ca sera probablement plus simple que de retaper l’adresse à chaque fois !"
        thumbnail_path="thumbnails/mano_favoris_web.jpg"
      />

      <hr className="mb-6 text-gray-100" />

      <p className="mb-3 font-semibold text-black">
        2. Cliquer sur "Mot de passe oublié", renseigner votre adresse email professionnelle et
        cliquer sur "Envoyer" puis suivre les instructions du mail automatique envoyé par MANO à
        cette adresse.
      </p>

      <ul className="mb-6 list-card">
        <li>
          Si vous ne recevez pas de mail automatique de MANO, pensez à consulter votre dossier
          "Courriers Indésirables".
        </li>
        <li>
          Vérifiez auprès de votre chef.fe de service l’adresse qu’il ou elle a associé à votre
          compte MANO.
        </li>
      </ul>

      <Embed
        link="https://www.youtube.com/embed/ebFQ5exZsyQ"
        subtitle="C'est tout à fait normal de ne pas connaître son mot de passe quand on ne l’a pas encore choisi."
        thumbnail_path="thumbnails/mano_mdp_web.jpg"
      />

      <hr className="mb-6 text-gray-100" />

      <p className="mb-3 font-semibold text-black">
        3. Retourner à l’écran de connexion et se connecter grâce à son nouveau mot de passe.
      </p>

      <ul className="mb-6 list-card">
        <li>
          Un compte utilisateur ou utilisatrice ne doit pas être partagé afin de bénéficier de
          toutes les fonctionnalités de MANO.
        </li>
      </ul>

      <Embed
        link="https://www.youtube.com/embed/5-8hcEKT2ms"
        subtitle={`L'adresse dans la case "adresse" et le mot de passe dans la case "mot de passe"... jusque là, ça va`}
        thumbnail_path="thumbnails/mano_login_web.jpg"
      />

      <h4 className="mb-6 text-base font-semibold text-shamrock-400">Puis, si votre organisation utilise le chiffrement côté client</h4>

      <ul className="mb-6 list-none list-card">
        <li>
          Si un nouveau champ apparaît vous demandant votre “Clé de chiffrement d'organisation”, il s’agit d’une phrase de passe commune à toute votre organisation que votre chef.fe de service ou coordinateur.rice doit vous avoir transmis à l’oral.
        </li>
      </ul>

      <p className="mb-6 font-semibold">
        Taper cette phrase de passe d’équipe puis cliquez sur “Se connecter” !
      </p>
    </Dropdown>

    <Dropdown title="Pourquoi est-ce que l’installation de MANO, le changement de mot de passe ou une autre fonctionnalité ne fonctionne pas ?">
      <p className="mb-3 font-semibold">
        Vérifier qu’on n’utilise pas du tout le logiciel Internet Explorer, ni le logiciel Google Chrome sur Windows 7 ou antérieur, pour se rendre sur le site de MANO.
      </p>

      <ul className="list-none list-card">
        <li>Ensuite, nous sommes joignables par téléphone pour vous aider au cas par cas.</li>
      </ul>
    </Dropdown>

    <Dropdown title="Comment créer le dossier de suivi d'une personne ?">
      <p className="mb-6 font-semibold">
        1. Cliquer sur "Personnes suivies" dans le menu de gauche, puis sur "Créer une nouvelle personne" en haut à
        droite.
      </p>

      <Embed
        link="https://www.youtube.com/embed/75yi4BX4iAk"
        subtitle="Alors, c'est plus simple que sur l'application, non ?"
        thumbnail_path="thumbnails/mano_creadossier_web.jpg"
      />

      <hr className="mb-6 text-gray-100" />

      <p className="mb-6 font-semibold">
        2. Consulter et modifier les parties successives "dossier social" et "dossier médical".
      </p>

      <ul className="mb-4 list-card">
        <li>
          Scrollez la page pour tout découvrir et cliquez directement sur les champs d’un dossier
          pour les modifier.
        </li>
      </ul>

      <p className="mb-6 text-red-500">
        <span class="font-semibold text-red-400">
          3. Cliquer sur "Mettre à jour" en bas de la section "Dossier médical" pour ne pas perdre
          ses notes !
        </span>
      </p>

      <Embed
        link="https://www.youtube.com/embed/eJDhij7fqHM"
        subtitle={`Le bouton "Mettre à jour" tu penseras à cliquer, ou ton tes notes tu perdras.`}
        thumbnail_path="thumbnails/mano_moddossier_web.jpg"
      />

      <ul className="list-card">
        <li>
          Le seul champ obligatoire d’une fiche est le pseudo. Tous les autres champs sont
          facultatifs et considérés comme "non-renseignés" par défaut.
        </li>
        <li>La quantité de dossiers de personnes suivies et de modifications n’est pas limitée.</li>
      </ul>
    </Dropdown>

    <Dropdown title="Comment créer une action ?">
      <h4 className="mb-6 text-base font-semibold text-shamrock-400">Méthode 1 : Par l’agenda</h4>

      <p className="mb-6 font-semibold">
        Cliquer sur "Actions" dans le menu de gauche puis sur "Créer une nouvelle action" en haut
        à droite.
      </p>

      <ul className="mb-6 list-none list-card">
        <li>
          Dans ce cas, pour associer une action à une personne suivie, il faut le faire manuellement à l’aide
          du champ prévu à cet effet.
        </li>
      </ul>

      <hr className="mb-6 border-gray-100" />

      <h4 className="mb-6 text-base font-semibold text-shamrock-400">
        Méthode 2 : Par le dossier d'une personne suivie
      </h4>

      <p className="mb-6 font-semibold">1. Accéder au dossier d'une personne suivie</p>

      <hr className="mb-6 border-gray-100" />

      <p className="mb-3 font-semibold">
        2. Cliquer sur "Créer une nouvelle action" en haut de la section "Actions" vers le milieu du
        dossier.
      </p>

      <ul className="mb-6 list-card">
        <li>Dans ce cas, l’action est par défaut associée une personne dont on consulte le dossier de suivi.</li>
      </ul>
      <p className="mb-3">
        Les seuls champs obligatoires d’une action sont le nom et la date. Tous les autres champs
        sont facultatifs et considérés comme "non-renseignés" par défaut.
        <br />
        <br /> La quantité d’actions et de modifications n’est pas limitée.
      </p>

      <hr className="mb-6 border-gray-100" />

      <p className="mb-3 font-semibold">3. Facultatif : Modifier les détails de l’action.</p>

      <ul className="mb-6 list-card">
        <li>
          Le menu déroulant "catégorie" est le plus utile pour générer des statistiques sur les
          actions menées.
        </li>
        <li className="text-red-500">
          Si vous modifiez les détails, cliquez sur "Mettre à jour" !
        </li>
      </ul>

      <Embed
        link="https://www.youtube.com/embed/QlLbm6ztZOY"
        subtitle='Passer une action de "à faire" à "fait" est super satisfaisant.'
        thumbnail_path="thumbnails/mano_actions_web.jpg"
      />
    </Dropdown>

    <Dropdown
      title={`Pourquoi la case "commentaire" apparaît dans le dossier de suivi d'une personne mais aussi dans les détails d'une action ?`}>
      <ul className="mb-6 list-card">
        <li>
          On peut ajouter un commentaire à l'aide de la case "commentaire" présente dans les
          dossiers des personnes suivies (accessible lorsqu'on clique sur le nom d'une personne suivie).
        </li>
        <li>
          On peut aussi ajouter un commentaire sur une action à l'aide d'une case qui porte le même
          nom mais que l'on retrouve dans les détails d'une action (quand on clique sur une action).
        </li>
        <li>
          Dans les deux cas, les commentaires successifs sont conservés et permettent d’effectuer
          des transmissions. Mais ils apparaissent séparément, respectivement tout en bas du dossier d'une personne suivie ou des détails d’une action.
        </li>
        <li>
          On retrouve également ces deux types de commentaires dans le compte-rendu quotidien de
          l'équipe (généré automatique sur l'interface web dans la partie éponyme) où ils sont
          différenciés par la colonne "type" ("personne suivie" ou "action").
        </li>
      </ul>

      <Embed
        link="https://www.youtube.com/embed/Z-lY1ghXgrY"
        subtitle="On utilise plusieurs fois les même termes exprès pour créer un peu de mystère."
        thumbnail_path="thumbnails/mano_diffcommdossieraction_web.jpg"
      />
    </Dropdown>

    <Dropdown title="Pourquoi je ne retrouve pas les informations écrites par les collègues ?">
      <p className="mb-3 font-semibold">
        1. Vérifier qu’on appartient bien à la même "organisation" ou à la même "équipe".
      </p>
      <ul className="mb-3 list-none list-card">
        <li>
          Les notes sur les usagèr.e.s sont partagées entre les membres d’une organisation et
          seulement eux. L’agenda est propre à chaque équipe.
        </li>
      </ul>

      <p className="mb-6">
        Tout en haut à gauche, on voit son nom d’utilisateur puis son organisation et le menu
        déroulant permet de choisir son équipe.
      </p>
      <Embed
        link="https://www.youtube.com/embed/mgeLr3a43z4"
        subtitle="Changer d’équipe en un clic, si ça c’est pas flex !"
        thumbnail_path="thumbnails/mano_switchequipe_web.jpg"
      />
      <hr className="mb-6 border-gray-100" />
      <p className="mb-3 font-semibold">
        2. Vérifier que le ou la collègue a bien enregistré ses notes.
      </p>
      <ul className="mb-6 list-none list-card">
        <li>En utilisant le bouton "mettre à jour" en bas de la section qu’il ou elle modifie.</li>
      </ul>
      <hr className="mb-6 border-gray-100" />
      <p className="mb-3 font-semibold">
        3. Accéder à la liste des "personnes suivies" ou des "actions" (l’agenda) grâce au menu de gauche puis
        rafraîchir la liste.
      </p>
      <ul className="mb-6 list-none list-card">
        <li>
          Utilisez le bouton "rafraîchir" juste à côté de "Créer une nouvelle personne" ou "Créer une
          nouvelle action".
        </li>
      </ul>
      <Embed
        link="https://www.youtube.com/embed/TMp9ks9MxFI"
        subtitle="Essayer de rafraîchir la liste avant d'appeler les collègues pour se plaindre semble raisonnable."
        thumbnail_path="thumbnails/mano_refreshlist_web.jpg"
      />
    </Dropdown>

    <Dropdown title="Comment mettre en place le chiffrement et comment ça marche ?">
      <p className="mb-3 font-semibold">
        1. Réunir les membres de l’équipe et décider ensemble d’une phrase de passe solide et facilement mémorisable.
      </p>

      <p className="mb-3 font-semibold">
        2. Écrire cette phrase de passe sur une feuille et stocker celle-ci hors de l’ordinateur.
      </p>

      <p className="mb-3 font-semibold">
        3. Transmettre cette phrase de passe à toute l’équipe à l’oral.
      </p>
    
      <ul className="mb-3 list-none list-card">
        <li>
          Cette phrase de passe sera commune à toute l’équipe. Elle sera associée à une clé de chiffrement propre à l’équipe. Plus la phrase de passe sera définie collectivement, moins il y aura d’oubli, a priori !
        </li>
      </ul>

      <p className="mb-3 font-semibold">
        4. Cliquer sur le bouton “Organisation” dans le menu latéral de gauche ; puis cliquer sur son organisation ; puis cliquer sur “Activer le chiffrement”.
      </p>
    
      <ul className="mb-3 list-none list-card">
        <li>
          Cette fonctionnalité n’est accessible qu’aux comptes “admin”. Si vous ne la trouvez pas, vous pouvez commencer par vérifier que vous êtes bien connecté à l'interface web avec un compte "admin".
        </li>
      </ul>

      <p className="mb-3 font-semibold">
        5. Renseigner deux fois la phrase de passe choisie avec l’équipe puis cliquer sur "Activer le chiffrement".
      </p>
      
      <ul className="mb-3 list-none list-card">
        <li>
          Pour des raisons de sécurité, cette opération est techniquement irréversible.
        </li>
        <li>
          Ce chiffrement supplémentaire est un chiffrement “côté client”. Cela signifie que les données entrées par les utilisateur.rice.s de MANO sont chiffrées (rendues illisibles) directement par le téléphone ou l’ordinateur de l’utilisateur.rice puis envoyé sur le serveur dans cet état chiffré.
          Lorsqu’on accède aux données pour les lire, elles sont téléchargées chiffrées puis déchiffrées (rendues lisibles) uniquement sur le téléphone ou l’ordinateur de l’utilisateur.rice de MANO.
        </li>
        <li>
          Seules les personnes disposant de la phrase de passe associée à votre clé de chiffrement uniquement peuvent chiffrer et déchiffrer ces données : même les personnes qui gèrent le serveur sur lequel elles sont stockées ne le peuvent pas !
        </li>
        <li>
          <span class="text-red-400">Attention : si jamais plus personne dans l’organisation n’arrive à retrouver cette phrase de passe, les données seront totalement impossibles à déchiffrer et seront perdues pour toujours.</span>
        </li>
      </ul>

      <p className="mb-3 font-semibold">
        6. En cas de départ d’un collègue ou en cas de suspicion d’une fuite de la phrase de passe, renouveler l’opération pour changer la phrase de passe.
      </p>
    </Dropdown>
  </div>
);

export default Web;
