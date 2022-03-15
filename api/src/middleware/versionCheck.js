const MINIMUM_MOBILE_APP_VERSION = [2, 11, 5];
const MINIMUM_DASHBOARD_APP_VERSION = [1, 72, 0];

module.exports = ({ headers: { version, platform } }, res, next) => {
  if (platform === "website") return next();
  if (platform === "dashboard") {
    const dashVer = version.split(".").map((d) => parseInt(d));

    for (let i = 0; i < 3; i++) {
      console.log(dashVer, MINIMUM_DASHBOARD_APP_VERSION);
      if (dashVer[i] > MINIMUM_DASHBOARD_APP_VERSION[i]) {
        return next();
      } else if (dashVer[i] < MINIMUM_DASHBOARD_APP_VERSION[i]) {
        return res.status(505).send({
          ok: false,
          error: `Veuillez rafraichir votre navigateur jusqu'à ce que la version soit au moins ${MINIMUM_DASHBOARD_APP_VERSION.join(".")}`,
        });
      }
    }
    return next();
  }
  if (!version) return res.status(505).send({ ok: false, message: "Veuillez mettre à jour votre application!" });

  const appVer = version.split(".").map((d) => parseInt(d));

  for (let i = 0; i < 3; i++) {
    if (appVer[i] > MINIMUM_MOBILE_APP_VERSION[i]) {
      return next();
    } else if (appVer[i] < MINIMUM_MOBILE_APP_VERSION[i]) {
      return res.status(505).send({ ok: false, message: "Veuillez mettre à jour votre application!" });
    }
  }

  next();
};
