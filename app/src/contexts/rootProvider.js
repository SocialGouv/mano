import React from 'react';
import { AuthProvider } from './auth';
import { PersonsProvider } from './persons';
import { ActionsProvider } from './actions';
import { CommentsProvider } from './comments';
import { TerritoryObservationsProvider } from './territoryObservations';
import { TerritoriesProvider } from './territory';
import { PlacesProvider } from './places';
import { ReportsProvider } from './reports';
import { RefreshProvider } from './refresh';
import { RelsPersonPlaceProvider } from './relPersonPlace';
import { ActionsSelectorsProvider, PersonsSelectorsProvider, TerritoriesSelectorsProvider } from './selectors';

const RootContextsProvider = ({ children }) => (
  <AuthProvider>
    <CommentsProvider>
      <RelsPersonPlaceProvider>
        <PlacesProvider>
          <ActionsProvider>
            <PersonsProvider>
              <TerritoryObservationsProvider>
                <TerritoriesProvider>
                  <ReportsProvider>
                    <RefreshProvider>{children}</RefreshProvider>
                  </ReportsProvider>
                </TerritoriesProvider>
              </TerritoryObservationsProvider>
            </PersonsProvider>
          </ActionsProvider>
        </PlacesProvider>
      </RelsPersonPlaceProvider>
    </CommentsProvider>
  </AuthProvider>
);

export const FullPopulatedSelectorsProvider = ({ children }) => (
  <PersonsSelectorsProvider>
    <ActionsSelectorsProvider>
      <TerritoriesSelectorsProvider>{children}</TerritoriesSelectorsProvider>
    </ActionsSelectorsProvider>
  </PersonsSelectorsProvider>
);

export default RootContextsProvider;
