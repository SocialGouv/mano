/**
 * This comments are here because we have no typescript.
 * @param {string} name
 * @param {string} email
 * @param {string} token
 * @returns {string}
 */
function mailBienvenueHtml(name, email, organisationName, token) {
  return `<img src="https://espace-mano.sesan.fr/banner-top.png" width="700" alt="Mano" style="magin-bottom: 16px;" />
<div style="max-width: 700px; padding: 8px">
<p>👋 Bonjour${name ? " " + name : ""},</p>
<p>Nous vous souhaitons la bienvenue sur Mano !<br />
Pour accéder à votre compte sur l'organisation ${organisationName},
vous devez utiliser votre identifiant <b>${email}</b> et créer votre mot de passe de connexion.<br />
Suivez les étapes ci-dessous pour définir votre mot de passe et accéder à votre compte en toute sécurité.</p>
<br />
<p><b>Étape 1&nbsp;: Créer votre mot de passe</b></p>
<p>Cliquez sur le lien ci-dessous pour accéder à la page de création de mot de passe&nbsp;:</p>
<p><a href="https://espace-mano.sesan.fr/auth/reset?token=${token}&newUser=true">👉 Créer votre mot de passe 👈</a></p>
<p>Vous serez redirigé vers une page où vous pourrez définir votre mot de passe. Assurez-vous de choisir un mot de passe fort, composé d'au moins huit caractères, comprenant des lettres majuscules et minuscules, des chiffres et des caractères spéciaux pour garantir la sécurité de votre compte.</p>
<br />
<p><b>Étape 2&nbsp;: Si le lien ne fonctionne pas</b></p>
<p>Note&nbsp;: Le lien de création de mot de passe est valable pendant 24 heures. Si vous ne créez pas votre mot de passe dans ce délai, vous devrez demander un nouveau lien de réinitialisation.<br />
Si le lien ci-dessus ne fonctionne pas, vous pouvez cliquer sur le lien suivant&nbsp;:</p>
<p><a href="https://espace-mano.sesan.fr/auth/forgot">👉 Je clique ici si le lien précédent ne fonctionne pas 👈</a></p>
<br />
<p><b>Étape 3&nbsp;: Se connecter à Mano ! 🤗</b></p>
<p>Ça y est ! Une fois votre mot de passe créé avec succès, vous pourrez accéder à votre compte en utilisant votre adresse e-mail (${email}), le mot de passe que vous avez défini ET la clé de chiffrement que votre équipe vous a communiquée. Si vous ne la connaissez pas, demandez aux autres membres de votre équipe qui utilisent déjà l'outil.</p>
<p>Pour vous connecter, cliquez sur le lien suivant&nbsp;:</p>
<p><a href="https://espace-mano.sesan.fr/">👉 Me connecter à Mano 👈</a></p>
<br />
<p><b>Étape 4&nbsp;: Téléchargez l'app 📲</b></p>
<p><a href="https://mano.sesan.fr/download">
Pour télécharger l’application, c’est PAR ICI !
</a>
<br />
<br />
<br />
<br />
<p>Si vous avez des questions ou avez besoin d'assistance, n'hésitez pas à nous contacter votre chargé·e de déploiement&nbsp;:</p>
<p>Melissa Saiter&nbsp;:<br />
melissa.saiter@sesan.fr - 07 49 08 27 10<br />
<span style="font-size: 12px;">Île-de-France, Hauts-de-France, Auvergne&nbsp;Rhone&nbsp;Alpes, Grand&nbsp;Est, Normandie, Bretagne, Guadeloupe et Martinique</span></p>
<br />
<p>Yoann Kittery&nbsp;:<br />
yoann.kittery@sesan.fr - 07 45 16 40 04<br />
<span style="font-size: 12px;">Île-de-france, PACA, Occitanie, Nouvelle&nbsp;Aquitaine, Pays&nbsp;de&nbsp;la&nbsp;Loire, Centre&nbsp;Val&nbsp;de&nbsp;Loire, Corse,
Réunion</span></p>
<br />
<p>Nous vous conseillons vivement de rajouter le lien de connexion à Mano à votre barre de favoris (en cliquant sur la petite étoile en haut à droite de la barre de recherche): cela va devenir pour vous un outil du quotidien !</p>
<p>Si vous n'avez pas encore été formé à Mano, inscrivez-vous à une session de formation (environ 1h30) (C'est obligatoire et gratuit !) en sélectionnant un créneau via le lien ci-dessous&nbsp;:</p>
<ul>
<li>
<a href="https://cal.com/m-saiter-mano/je-souhaite-une-demonstration-de-l-outil-mano?duration=60">
Reservez un temps de présentation de l’outil MANO (Melissa)
</a>
</li>
<li>
<a href="https://cal.com/ykittery-mano/reservez-un-temps-de-presentation-de-l-outil-mano?duration=60">
Reservez un temps de présentation de l’outil MANO (Yoann)
</a>
</li>
</ul>
<br />
<p>Nous vous remercions de rejoindre la communauté Mano et espérons répondre à vos besoins pour accompagner au mieux votre public.</p>
<p>Cordialement,</p>
<p>Toute l'équipe Mano</p>
<a href="https://espace-mano.sesan.fr/" style="magin-top: 16px;">
<img src="https://espace-mano.sesan.fr/banner-bottom.png" width="700" alt="Mano" />
</a>
</div>
`;
}

module.exports = {
  mailBienvenueHtml,
};
