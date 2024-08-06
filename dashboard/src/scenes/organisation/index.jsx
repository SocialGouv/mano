import { Switch } from "react-router-dom";
import SentryRoute from "../../components/Sentryroute";

import Superadmin from "./superadmin";
import View from "./view";

const Router = () => {
  return (
    <Switch>
      <SentryRoute path="/organisation/:id" component={View} />
      <SentryRoute path="/" component={Superadmin} />
    </Switch>
  );
};

export default Router;
