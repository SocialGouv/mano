import React from "react";
import { Switch, Route } from "react-router-dom";

import List from "./list";
import View from "./view";

const Router = () => {
  return (
    <Switch>
      <Route path="/user/:id" component={View} />
      <Route path="/user" component={List} />
    </Switch>
  );
};

export default Router;
