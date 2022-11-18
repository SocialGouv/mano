import React from 'react';
import { Switch } from 'react-router-dom';
import SentryRoute from '../../components/Sentryroute';

import List from './list';
import View from './view';
import NewView from './new-view';
import { ENV } from '../../config';

const Router = () => {
  return (
    <Switch>
      {/* <SentryRoute path="/person/:personId" component={ENV !== 'production' ? NewView : View} /> */}
      <SentryRoute path="/person/:personId" component={NewView} />
      <SentryRoute path="/" component={List} />
    </Switch>
  );
};

export default Router;
