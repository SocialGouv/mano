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
  res.status(200).send({
    ok: false,
    data: MOBILE_APP_VERSION,
    inAppMessage: [
      `Mano ne sera pas accessible le 5 mars dès 9h.`,
      `Comme vous le savez peut-être déjà, Mano et toute l'équipe quittent la Fabrique numérique des ministères sociaux pour rejoindre le groupement d'intérêt public Sesan (https://www.sesan.fr) et ainsi pérenniser notre action au long-cours !
Concrètement, pas de changements pour vous :
- Mano restera chiffré de bout en bout pour protéger les données des personnes que vous accompagnez et leurs données seront toujours stockés sur des serveurs agréés données de santé (certification HDS) situés en France
- Nous continuerons à vous accompagner
- Nous continuerons à développer Mano en fonction de vos besoins
Mano sera cependant indisponible la journée du 5 mars 2024 dès 9h, le temps de réaliser la bascule technique de Mano.
L'application sera quand à elle indisponible dès le 4 Mars. Vous pourrez de nouveau l'utiliser le 5 Mars en fin de journée.
Nous restons bien entendu joignables pour répondre à toutes vos questions.
Toute l'équipe Mano`,
      [{ text: "Continuer", style: "cancel" }],
      { cancelable: true },
    ],
  });
});

module.exports = router;
