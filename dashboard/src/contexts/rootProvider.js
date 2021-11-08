import React from 'react';
import { RefreshProvider } from './refresh';
import { ActionsSelectorsProvider, PersonsSelectorsProvider, TerritoriesSelectorsProvider } from './selectors';

const RootContextsProvider = ({ children }) => <RefreshProvider>{children}</RefreshProvider>;

export const FullPopulatedSelectorsProvider = ({ children }) => (
  <PersonsSelectorsProvider>
    <ActionsSelectorsProvider>
      <TerritoriesSelectorsProvider>{children}</TerritoriesSelectorsProvider>
    </ActionsSelectorsProvider>
  </PersonsSelectorsProvider>
);

export default RootContextsProvider;
