import { Route } from 'react-router-dom';
import * as Sentry from '@sentry/react';

const SentryRoute = Sentry.withSentryRouting(Route);

export default SentryRoute;
