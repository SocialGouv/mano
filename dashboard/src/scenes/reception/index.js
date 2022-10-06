import React from 'react';
import { Switch } from 'react-router-dom';
import SentryRoute from '../../components/Sentryroute';

import View from './view';

const Router = () => {
  return (
    <Switch>
      <SentryRoute path="/reception" component={View} />
    </Switch>
  );
};

export default Router;
