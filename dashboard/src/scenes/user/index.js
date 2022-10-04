import React from 'react';
import { Switch } from 'react-router-dom';
import SentryRoute from '../../components/Sentryroute';

import List from './list';
import View from './view';

const Router = () => {
  return (
    <Switch>
      <SentryRoute path="/user/:id" component={View} />
      <SentryRoute path="/user" component={List} />
    </Switch>
  );
};

export default Router;
