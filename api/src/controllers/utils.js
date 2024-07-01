const express = require("express");
const router = express.Router();
const passport = require("passport");
const { MOBILE_APP_VERSION } = require("../config");

router.get("/check-auth", passport.authenticate("user", { session: false, failWithError: true }), async (req, res) => {
  // called when the app / the dashboard get from unfocused to focused
  // to check if the user should be logged out or not
  res.status(200).send({ ok: true });
});

router.get("/now", passport.authenticate("user", { session: false, failWithError: true }), async (req, res) => {
  const data = Date.now();
  res.status(200).send({ ok: true, data });
});

// Get mobile app version suggested by the server.
// When a new version of the mobile app is released, the server will send the version number
// so the mobile app can send a notification to the user.
// See: app/src/scenes/Login/Login.js
router.get("/version", async (req, res) => {
  if (req.headers.version === MOBILE_APP_VERSION) {
    return res.status(200).send({ ok: true });
  }
  res.status(200).send({
    ok: false,
    data: MOBILE_APP_VERSION,
    inAppMessage: [
      `La nouvelle version ${MOBILE_APP_VERSION} de Mano est disponible !`,
      `Vous avez la version ${req.headers.version} actuellement sur votre téléphone.
Cette nouvelle version apporte ces correctifs :
- Une catégorie d'action supprimée ne doit pas apparaître dans les catégories les plus utilisées
- Dans les comptes-rendus,les rencontres ne sont plus mélangées aux passages
- On peut ajouter une description directement depuis la création d'une nouvelle action
- Une action doit avoir au moins un nom OU une catégorie - on affiche la catégorie à la place du lorsque le nom est absent
- La saisie libre est enfin disponible pour les champs custos autorisés via le paramétrage
- On restreint les commentaires urgents à l'équipe actuelle
`,
      [
        { text: "Télécharger", link: `https://mano.sesan.fr/download?ts=${Date.now()}` },
        { text: "Plus tard", style: "cancel" },
      ],
      { cancelable: true },
    ],
  });
});

module.exports = router;
