import React from "react";
import { Switch, Route } from "react-router-dom";
import { PaginationProvider } from "../../contexts/pagination";

import List from "./list";
import View from "./view";

const Router = () => {
  return (
    <PaginationProvider>
      <Switch>
        <Route path="/place/:id" component={View} />
        <Route path="/" component={List} />
      </Switch>
    </PaginationProvider>
  );
};

export default Router;
