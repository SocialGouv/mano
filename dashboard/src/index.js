import React from 'react';
import { createRoot } from 'react-dom/client';
import 'react-redux-toastr/lib/css/react-redux-toastr.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.scss';
import App from './app';
import './services/sentry';
import './services/api';

const root = createRoot(document.getElementById('root'));
root.render(<App tab="home" />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
