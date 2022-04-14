import React from 'react';
import { Switch, Route } from 'react-router-dom';

import List from './list';
import View from './view';

const Router = () => {
  return (
    <Switch>
      <Route path="/person/:id" component={View} />
      <Route path="/" component={List} />
    </Switch>
  );
};

export default Router;
