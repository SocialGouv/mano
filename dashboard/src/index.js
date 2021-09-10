import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import ReduxToastr, { reducer as toastr } from 'react-redux-toastr';
import 'react-redux-toastr/lib/css/react-redux-toastr.min.css';
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './datepicker.css';
import './index.scss';
import 'moment/min/locales.min';
import App from './app';
import './services/sentry';
import './services/api-interface-with-dashboard';
import RootContextsProvider, { FullPopulatedSelectorsProvider } from './contexts/rootProvider';

const store = createStore(combineReducers({ toastr }));

ReactDOM.render(
  <Provider store={store}>
    <RootContextsProvider>
      <FullPopulatedSelectorsProvider>
        <App />
        <ReduxToastr transitionIn="fadeIn" transitionOut="fadeOut" />
      </FullPopulatedSelectorsProvider>
    </RootContextsProvider>
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
