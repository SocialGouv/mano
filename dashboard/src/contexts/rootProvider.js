import React from 'react';
import { RefreshProvider } from './refresh';

const RootContextsProvider = ({ children }) => <RefreshProvider>{children}</RefreshProvider>;

export default RootContextsProvider;
