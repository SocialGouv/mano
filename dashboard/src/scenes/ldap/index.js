import React from "react";
import { Route, Switch } from "react-router-dom";
import Ldap from "./ldap"
const Router = () => {
  return (
    <Switch>
      <Route path="/ldap" component={Ldap} />
    </Switch>
  );
};

export default Router;
