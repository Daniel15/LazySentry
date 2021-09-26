// https://d.sb/lazysentry

import type {BrowserOptions} from '@sentry/browser';
type SentryImportType = typeof import('./LazySentryImports');

import {onSentryLoaded as onSentryLoadedForErrorBoundary} from './LazySentryErrorBoundary';

let queue: Array<(sentry: SentryImportType) => void> = [];
let errorQueue: Array<Parameters<OnErrorEventHandlerNonNull>> = [];
let rejectionQueue: Array<PromiseRejectionEvent> = [];

// Before Sentry has loaded, these functions will push calls into a queue
// After Sentry has loaded, these will be replaced with the real functions
export let addBreadcrumb: SentryImportType['addBreadcrumb'] = (...args) => {
  queue.push(x => x.addBreadcrumb(...args));
};
export let captureMessage: SentryImportType['captureMessage'] = (...args) => {
  queue.push(x => x.captureMessage(...args));
  return '';
};
export let captureException: SentryImportType['captureException'] = (
  ...args
) => {
  queue.push(x => x.captureException(...args));
  return '';
};
export let captureEvent: SentryImportType['captureEvent'] = (...args) => {
  queue.push(x => x.captureEvent(...args));
  return '';
};
export let configureScope: SentryImportType['configureScope'] = (...args) =>
  queue.push(x => x.configureScope(...args));
export let showReportDialog: SentryImportType['showReportDialog'] = (...args) =>
  queue.push(x => x.showReportDialog(...args));
export let withScope: SentryImportType['withScope'] = (...args) =>
  queue.push(x => x.withScope(...args));

export function init(options: BrowserOptions) {
  const oldOnError = window.onerror;
  const oldOnUnhandledRejection = window.onunhandledrejection;
  window.onerror = (...args) => errorQueue.push(args);
  window.onunhandledrejection = (e: PromiseRejectionEvent) =>
    rejectionQueue.push(e);

  import('./LazySentryImports').then(Sentry => {
    window.onerror = oldOnError;
    window.onunhandledrejection = oldOnUnhandledRejection;
    Sentry.init({
      ...options,
      integrations: [new Sentry.BrowserTracing()],
    });

    // Override the placeholder functions with the real ones
    addBreadcrumb = Sentry.addBreadcrumb;
    captureMessage = Sentry.captureMessage;
    captureException = Sentry.captureException;
    captureEvent = Sentry.captureEvent;
    configureScope = Sentry.configureScope;
    showReportDialog = Sentry.showReportDialog;
    withScope = Sentry.withScope;
    onSentryLoadedForErrorBoundary(Sentry.ErrorBoundary);

    // Replay queued calls and errors through Sentry's handlers
    queue.forEach(call => call(Sentry));
    errorQueue.forEach(x => window.onerror?.(...x));
    rejectionQueue.forEach(e => window.onunhandledrejection?.(e));
  });
}
