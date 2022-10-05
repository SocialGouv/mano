import React from 'react';
import { Switch } from 'react-router-dom';
import SentryRoute from '../../components/Sentryroute';

import List from './list';
import View from './view';

const Router = () => {
  return (
    <Switch>
      <SentryRoute path="/organisation/:id" component={View} />
      <SentryRoute path="/" component={List} />
    </Switch>
  );
};

export default Router;
