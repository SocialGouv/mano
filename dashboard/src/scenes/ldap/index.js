import React from "react";
import { Route, Switch } from "react-router-dom";
import Oidc from "./oidc"
const Router = () => {
  return (
    <Switch>
      <Route path="/ldap" component={Oidc} />
    </Switch>
  );
};

export default Router;
