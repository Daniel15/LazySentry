# LazySentry

This is some code I use to lazy-load the [Sentry JavaScript SDKs](https://github.com/getsentry/sentry-javascript/), including a basic lazy-loaded React `ErrorBoundary`. Currently, Sentry's JavaScript SDK is [very large](https://github.com/getsentry/sentry-javascript/issues/2707). They have built-in basic lazy loading support, however it [does not work for on-premise installations](https://github.com/getsentry/sentry/issues/22715), and also does not support the tight React integration via an ErrorBoundary.

Until the bundle size is reduced ([as part of v7 of the SDK](https://github.com/getsentry/sentry-javascript/issues/2817)), lazy-loading the SDK can at least defer the cost a bit.

# Files in this repo

- `LazySentryImports`: The actual parts of the Sentry module that we want to use
- `LazySentry`: Handles loading Sentry. If Sentry has not been loaded yet, the functions (eg. `captureException`) are buffered in a queue. Once the Sentry library is loaded, all the buffered calls are replayed
- `LazySentryErrorBoundary`: React ErrorBoundary that handles a lazy-loaded Sentry SDK

# Usage

Use `LazySentry` instead of `@sentry/browser` or `@sentry/react` in your code.

Call `init` at some appropriate time, such as after your app has loaded all its main code, or in a `requestIdleCallback` callback.

# Support

There is no warranty nor any support provided for the code in this repository.
