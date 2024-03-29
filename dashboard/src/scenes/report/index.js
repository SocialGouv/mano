import React from 'react';
import { Switch } from 'react-router-dom';
import SentryRoute from '../../components/Sentryroute';

import List from './list';
import ViewOld from './view-old';
import View from './view';

const Router = () => {
  return (
    <Switch>
      <SentryRoute path="/report/:dateString" component={ViewOld} />
      <SentryRoute path="/report-new" component={View} />
      <SentryRoute path="/" component={List} />
    </Switch>
  );
};

export default Router;
