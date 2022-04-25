import Dropdown from "./dropdown";
import Embed from "./embed";

const Mobile = () => (
  <div className="space-y-2">
    <Dropdown
      title="Comment MANO peut-il répondre aux besoins d'équipes si différentes, dont la mienne ?"
      defaultOpen={false}>
      <ul className="mb-4 list-card">
        <li>
          Toutes les équipes de maraude et en charge d'accueils de jour que nous avons rencontré ont
          leurs spécificités. Souvent, elles ont des besoins uniques, qu'aucune autre équipe ne
          présente.
        </li>
        <li>
          MANO propose une série de fonctionnalités (dossiers de suivi de personnes, système
          d'actions, observations de territoires...). Leur complémentarité assure que chaque équipe
          peut utiliser MANO d'une manière différente, qui lui permet de répondre spécifiquement à
          ses besoins.
        </li>
        <li>
          Aucune équipe ne doit se débrouiller avec MANO pour trouver comment l'utiliser à son
          image. Notre équipe vous accompagne le temps qu'il faut pour déterminer avec vous l'usage
          qui vous conviendra le mieux !
        </li>
      </ul>
    </Dropdown>

    <Dropdown title="Comment se connecter pour la première fois à MANO ?" defaultOpen={false}>
      <h4 className="mb-6 text-base font-semibold text-shamrock-400">Dans tous les cas</h4>
      <p className="mb-6 font-semibold">
        1. Se rendre à l’adresse{" "}
        <a
          className="transition-all text-shamrock-400 hover:text-shamrock-500"
          href="https://mano-app.fabrique.social.gouv.fr/download">
          https://mano-app.fabrique.social.gouv.fr/download
        </a>{" "}
        et télécharger MANO.
      </p>

      <Embed
        link="https://www.youtube.com/embed/g_eRkZhHQB8"
        subtitle="Sur le site, vous ne pouvez pas rater le bouton pour télécharger l'application !"
        thumbnail_path="thumbnails/mano_dl_andro.jpg"
      />

      <p className="mb-6 font-semibold">
        2. Retrouver dans le smartphone le téléchargement MANO et l’installer.
      </p>

      <ul className="mb-6 list-card">
        <li>
          L’installation diffère d’un modèle de téléphone à l’autre. Nous sommes joignable pour le
          SAV technique au cas par cas.
        </li>
      </ul>

      <Embed
        link="https://www.youtube.com/embed/ZlxHQeTzcrs"
        subtitle="Quelle surprise que les constructeurs de téléphones ne se soient pas mis d’accord sur une procédure commune."
        thumbnail_path="thumbnails/mano_install_andro.jpg"
      />

      <hr className="mb-6 text-gray-100" />

      <p className="mb-3 font-semibold text-black">
        3. Cliquer sur “mot de passe oublié”, renseigner votre adresse email professionnel et
        cliquer sur “envoyer” puis suivre les instructions du mail automatique envoyé par MANO à
        cette adresse.
      </p>

      <ul className="mb-6 list-card">
        <li>
          Si vous ne recevez pas de mail automatique de MANO, pensez à consulter votre dossier
          “Courriers Indésirables”.
        </li>
        <li>
          Vérifiez auprès de votre chef.fe de service l’adresse qu’il ou elle a associé à votre
          compte MANO.
        </li>
      </ul>

      <Embed
        link="https://www.youtube.com/embed/ZJWbWdEspjE"
        subtitle="Et vous, à quelle fréquence oubliez-vous votre mot de passe ?"
        thumbnail_path="thumbnails/mano_mdp_andro.jpg"
      />

      <hr className="mb-6 text-gray-100" />

      <p className="mb-3 font-semibold text-black">
        4. Retourner à l’écran de connexion et se connecter grâce à son nouveau mot de passe.
      </p>

      <ul className="mb-6 list-card">
        <li>
          Un compte utilisateur ou utilisatrice ne doit pas être partagé afin de bénéficier de
          toutes les fonctionnalités de MANO.
        </li>
      </ul>

      <Embed
        link="https://www.youtube.com/embed/20tnl4PL330"
        subtitle="Il n’y a que les couleurs qui changent entre le web et l’application !"
        thumbnail_path="thumbnails/mano_login_andro.jpg"
      />

      <h4 className="mb-6 text-base font-semibold text-shamrock-400">
        Puis, si votre organisation utilise le chiffrement côté client
      </h4>

      <ul className="mb-6 list-none list-card">
        <li>
          Si un nouveau champ apparaît vous demandant votre “Clé de chiffrement d'organisation”, il
          s’agit d’une phrase de passe commune à toute votre organisation que votre chef.fe de
          service ou coordinateur.rice doit vous avoir transmis à l’oral.
        </li>
      </ul>

      <p className="mb-6 font-semibold">
        Taper cette phrase de passe d’équipe puis cliquez sur “Se connecter” !
      </p>
    </Dropdown>

    <Dropdown title="Pourquoi est-ce que l’installation de MANO, le changement de mot de passe ou une autre fonctionnalité ne fonctionne pas ?">
      <p className="mb-1 font-semibold">
        Vérifier qu’on utilise bien un smartphone ou une tablette Androïd et pas un iPhone, un iPad,
        un Windows Phone ou une tablette Windows.
      </p>
      <p className="mb-3 text-gray-600">
        Essayez aussi de redémarrer votre téléphone ou votre tablette après avoir effectué une
        modification sur l’appareil.
      </p>

      <ul className="list-none list-card">
        <li>Ensuite, nous sommes joignables par téléphone pour vous aider au cas par cas.</li>
      </ul>
    </Dropdown>

    <Dropdown title="Comment créer le dossier de suivi d'une personne ?">
      <p className="mb-6 font-semibold">
        1. Se rendre dans la section “Personnes suivies” grâce au menu du bas, puis toucher le
        bouton “+” en bas à droite.
      </p>

      <Embed
        link="https://www.youtube.com/embed/gRPxhzAGPSQ"
        subtitle="Alors, c'est plus simple que sur le web, non ?"
        thumbnail_path="thumbnails/mano_creadossier_andro.jpg"
      />

      <hr className="mb-6 text-gray-100" />

      <p className="mb-3 font-semibold">
        2. Consulter et modifier les parties successives “dossier social” et “dossier médical”.
      </p>

      <ul className="mb-3 list-card">
        <li>Utilisez le bouton en haut du dossier pour accéder aux sous-dossiers.</li>
        <li>
          Le bouton "modifier" se trouve en haut à droite d’un sous-dossier. Les champs sont
          remplissables au clavier ou par dictée vocale en appuyant le bouton en forme de micro sur
          le clavier du téléphone.
        </li>
      </ul>

      <p className="mb-3 font-semibold text-red-500">
        3. Toucher le bouton "enregistrer" en haut à droite pour ne pas perdre ses notes !
      </p>

      <Embed
        link="https://www.youtube.com/embed/QsSIpeAkbJc"
        subtitle="C'est toujours mieux d'enregistrer ses notes la première fois plutôt que de les réécrire plusieurs fois, non ?"
        thumbnail_path="thumbnails/mano_moddossier_andro.jpg"
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
        Appuyer sur “Agenda” dans le menu du bas puis toucher le bouton “+” en bas à droite.
      </p>

      <ul className="mb-6 list-none list-card">
        <li>
          Dans ce cas, pour associer une action à une personne suivie il faut le faire manuellement
          à l’aide du champ prévu à cet effet.
        </li>
      </ul>

      <hr className="mb-6 border-gray-100" />

      <h4 className="mb-6 text-base font-semibold text-shamrock-400">
        Méthode 2 : Par le dossier d'une personne suivie
      </h4>

      <p className="mb-6 font-semibold">1. Accéder au dossier d'une personne suivie</p>

      <hr className="mb-6 border-gray-100" />

      <p className="mb-3 font-semibold">
        2. Cliquer sur “Créer une nouvelle action” en haut de la section “Actions” vers le milieu du
        dossier.
      </p>

      <ul className="mb-6 list-card">
        <li>
          Dans ce cas, l’action est par défaut associée à une personne suivie dont on consulte la
          fiche.
        </li>
      </ul>
      <p className="mb-3">
        Les seuls champs obligatoires d’une action sont le nom et la date. Tous les autres champs
        sont facultatifs et considérés comme "non-renseignés" par défaut.
        <br />
        <br /> La quantité d’actions et de modifications n’est pas limitée.
      </p>

      <hr className="mb-6 border-gray-100" />

      <p className="mb-3 font-semibold">Facultatif : Modifier les détails de l’action.</p>

      <ul className="mb-6 list-card">
        <li>
          Le menu déroulant “catégorie” est le plus utile pour générer des statistiques sur les
          actions menées.
        </li>
        <li className="text-red-500">
          Si vous modifiez les détails, cliquez sur "Mettre à jour" !
        </li>
      </ul>

      <Embed
        link="https://www.youtube.com/embed/BXqSj7MNz3U"
        subtitle="Commenter les actions permet de garder trace de toutes les fois où un rdv a été déplacé, par exemple."
        thumbnail_path="thumbnails/mano_creaaction_andro.jpg"
      />
    </Dropdown>

    <Dropdown
      title={`Pourquoi la case "commentaire" apparaît dans le dossier d'une personne suivie mais aussi dans les détails d'une action ?`}>
      <ul className="mb-6 list-card">
        <li>
          On peut ajouter un commentaire à l'aide de la case "commentaire" présente dans les
          dossiers des personnes suivies (accessibles lorsqu'on clique sur le nom d'une personne
          suivie).
        </li>
        <li>
          On peut aussi ajouter un commentaire sur une action à l'aide d'une case qui porte le même
          nom mais que l'on retrouve dans les détails d'une action (quand on clique sur une action).
        </li>
        <li>
          Dans les deux cas, les commentaires successifs sont conservés et permettent d’effectuer
          des transmissions. Mais ils apparaissent séparément, respectivement tout en bas du dossier
          d'une personne suivie ou des détails d’une action.
        </li>
        <li>
          On retrouve également ces deux types de commentaires dans le compte-rendu quotidien de
          l'équipe (généré automatique sur l'interface web dans la partie éponyme) où ils sont
          différenciés par la colonne "type" ("personne suivie" ou "action").
        </li>
      </ul>

      <Embed
        link="https://www.youtube.com/embed/vEQarFUs9qk"
        subtitle="Les commentaires sont tous modifiables : l'erreur est humaine, surtout à 2h du matin."
        thumbnail_path="thumbnails/mano_diffcommdossieraction_andro.jpg"
      />
    </Dropdown>

    <Dropdown title="Pourquoi je ne retrouve pas les informations écrites par les collègues ?">
      <p className="mb-3 font-semibold">
        1. Vérifier qu’on appartient bien à la même “organisation” ou à la même “équipe”.
      </p>

      <ul className="mb-3 list-none list-card">
        <li>
          Les notes sur les usagèr.e.s sont partagées entre les membres d’une organisation et
          seulement eux. L’agenda est propre à chaque équipe.
        </li>
      </ul>

      <p className="mb-6">
        L’application permet seulement de choisir une équipe, en appuyant sur “profil” tout en bas
        puis “changer d’équipe”.
      </p>

      <Embed
        link="https://www.youtube.com/embed/qelsK1_4dGE"
        subtitle="Les professionnel.le.s de maraude “flexibilisé.e.s” travaillent sur plusieurs équipes."
        thumbnail_path="thumbnails/mano_switchequipe_andro.jpg"
      />

      <hr className="mb-6 border-gray-100" />

      <p className="mb-3 font-semibold">
        2. Vérifier que le ou la collègue a bien enregistré ses notes.
      </p>

      <ul className="mb-6 list-none list-card">
        <li>En appuyant sur “enregistrer” en haut à droite de ce qu’il ou elle modifie.</li>
      </ul>

      <hr className="mb-6 border-gray-100" />

      <p className="mb-3 font-semibold">
        3. Accéder à la liste des personnes suivies ou à l’agenda grâce au menu du bas puis tirer
        vers le bas avec son doigt pour recharger la liste.
      </p>

      <Embed
        link="https://www.youtube.com/embed/lY5riwi-y1g"
        subtitle="On se croirait sur un réseau social de dernière génération."
        thumbnail_path="thumbnails/mano_refreshlist_andro.jpg"
      />
    </Dropdown>

    <Dropdown title="Comment mettre en place le chiffrement et comment ça marche ?">
      <ul className="mb-3 list-none list-card">
        <li>
          La mise en place initiale du chiffrement s’effectue sur l’interface web et non sur
          l’application Android. Cliquez sur "Sur l'interface web" en haut de la page pour découvrir
          comment faire.
        </li>
      </ul>
    </Dropdown>
  </div>
);

export default Mobile;
