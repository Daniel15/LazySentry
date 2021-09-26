// https://d.sb/lazysentry

import type {ErrorBoundary as RealErrorBoundary} from '@sentry/react';
import type {ErrorBoundaryProps as RealErrorBoundaryProps} from '@sentry/react/dist/errorboundary';
import {captureException} from './LazySentry';
import * as React from 'react';

type Props = RealErrorBoundaryProps;
type State = {
  componentStack: string | null;
  error: Error | null;
  eventId: string | null;
};

const INITIAL_STATE = {
  componentStack: null,
  error: null,
  eventId: null,
};

let realErrorBoundary: typeof RealErrorBoundary | null = null;
export function onSentryLoaded(newRealErrorBoundary: typeof RealErrorBoundary) {
  realErrorBoundary = newRealErrorBoundary;
}

/**
 * A modified version of Sentry's ErrorBoundary that handles a lazy-loaded Sentry.
 *
 * A ErrorBoundary component that logs errors to Sentry. Requires React >= 16.
 * NOTE: If you are a Sentry user, and you are seeing this stack frame, it means the
 * Sentry React SDK ErrorBoundary caught an error invoking your application code. This
 * is expected behavior and NOT indicative of a bug with the Sentry React SDK.
 */
export class LazySentryErrorBoundary extends React.Component<Props, State> {
  public state: State = INITIAL_STATE;

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (realErrorBoundary) {
      realErrorBoundary.prototype.componentDidCatch.call(
        this,
        error,
        errorInfo,
      );
      return;
    }

    // Just put it in the queue for the basic Sentry error logging
    const componentError = new Error(error.message);
    componentError.name = `React ErrorBoundary ${componentError.name}`;
    componentError.stack = errorInfo.componentStack;
    (error as any).cause = componentError;
    captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
    this.setState({
      error,
      componentStack: errorInfo.componentStack,
      eventId: null,
    });
  }

  public componentDidMount(): void {
    const {onMount} = this.props;
    if (onMount) {
      onMount();
    }
  }

  public componentWillUnmount(): void {
    const {error, componentStack, eventId} = this.state;
    const {onUnmount} = this.props;
    if (onUnmount) {
      onUnmount(error, componentStack, eventId);
    }
  }

  public resetErrorBoundary: () => void = () => {
    const {onReset} = this.props;
    const {error, componentStack, eventId} = this.state;
    if (onReset) {
      onReset(error, componentStack, eventId);
    }
    this.setState(INITIAL_STATE);
  };

  public render(): React.ReactNode {
    const {fallback, children} = this.props;
    const {error, componentStack, eventId} = this.state;

    if (error) {
      let element: React.ReactElement | undefined = undefined;
      if (typeof fallback === 'function') {
        element = fallback({
          error,
          componentStack,
          resetError: this.resetErrorBoundary,
          eventId,
        });
      } else {
        element = fallback;
      }

      if (React.isValidElement(element)) {
        return element;
      }

      if (fallback) {
        console.warn('fallback did not produce a valid ReactElement');
      }

      // Fail gracefully if no fallback provided or is not valid
      return null;
    }

    if (typeof children === 'function') {
      return children();
    }
    return children;
  }
}
