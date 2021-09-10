import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { ActionsByStatusProvider, ReportsSelectorsProvider } from '../../contexts/selectors';

import View from './view';

const Router = () => {
  return (
    <ActionsByStatusProvider>
      <ReportsSelectorsProvider>
        <Switch>
          <Route path="/reception" component={View} />
        </Switch>
      </ReportsSelectorsProvider>
    </ActionsByStatusProvider>
  );
};

export default Router;
