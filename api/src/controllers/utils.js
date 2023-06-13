const express = require("express");
const router = express.Router();
const passport = require("passport");
const { MOBILE_APP_VERSION } = require("../config");

router.get("/check-auth", passport.authenticate("user", { session: false }), async (req, res) => {
  // called when the app / the dashboard get from unfocused to focused
  // to check if the user should be logged out or not
  res.status(200).send({ ok: true });
});

router.get("/now", passport.authenticate("user", { session: false }), async (req, res) => {
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
Cette nouvelle version :
- Fixe un bug de recherche par date d'anniversaire
- Fix un bug de suppression des liens familiaux et de personnes suivies
- Améliore la recherche par numéro de téléphone
- Empêche de renommer une personne avec un nom de personne déjà existant
- Affiche les durées précises de "Suivi(e) depuis" et "En rue depuis"
`,
      [
        { text: "Télécharger", link: "https://mano-app.fabrique.social.gouv.fr/download" },
        { text: "Plus tard", style: "cancel" },
      ],
      { cancelable: true },
    ],
  });
});

module.exports = router;
