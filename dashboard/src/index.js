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
import { AuthProvider } from './contexts/auth';
import { PersonsProvider } from './contexts/persons';
import { ActionsProvider } from './contexts/actions';
import { CommentsProvider } from './contexts/comments';
import { TerritoryObservationsProvider } from './contexts/territoryObservations';
import { TerritoriesProvider } from './contexts/territory';
import { PlacesProvider } from './contexts/places';
import './services/sentry';
import './services/api-interface-with-dashboard';
import { ReportsProvider } from './contexts/reports';
import { RefreshProvider } from './contexts/refresh';
import { SelectorsProvider } from './contexts/selectors';
import { RelsPersonPlaceProvider } from './contexts/relPersonPlace';

const store = createStore(combineReducers({ toastr }));

ReactDOM.render(
  <Provider store={store}>
    <AuthProvider>
      <CommentsProvider>
        <ActionsProvider>
          <PersonsProvider>
            <TerritoryObservationsProvider>
              <TerritoriesProvider>
                <PlacesProvider>
                  <RelsPersonPlaceProvider>
                    <ReportsProvider>
                      <RefreshProvider>
                        <SelectorsProvider>
                          <App />
                          <ReduxToastr transitionIn="fadeIn" transitionOut="fadeOut" />
                        </SelectorsProvider>
                      </RefreshProvider>
                    </ReportsProvider>
                  </RelsPersonPlaceProvider>
                </PlacesProvider>
              </TerritoriesProvider>
            </TerritoryObservationsProvider>
          </PersonsProvider>
        </ActionsProvider>
      </CommentsProvider>
    </AuthProvider>
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
