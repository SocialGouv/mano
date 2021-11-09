import React from 'react';
import { Switch, Route } from 'react-router-dom';

import View from './view';

const Router = () => {
  return (
    <Switch>
      <Route path="/reception" component={View} />
    </Switch>
  );
};

export default Router;
