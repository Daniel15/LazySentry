// https://d.sb/lazysentry

import {Integrations} from '@sentry/tracing';
const {BrowserTracing} = Integrations;

export {
  init,
  ErrorBoundary,
  addBreadcrumb,
  captureMessage,
  captureException,
  captureEvent,
  configureScope,
  showReportDialog,
  withScope,
} from '@sentry/react';
export {BrowserTracing};
