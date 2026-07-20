import React from 'react';
import type { ObservabilityClient, ErrorContext } from '@platform/contracts';

interface Props {
  fallback: React.ReactNode;
  observability?: ObservabilityClient;
  errorContext?: Omit<ErrorContext, 'category'>;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Generic React error boundary. Catches render/lifecycle errors thrown by a
 * mounted remote so a single failing domain never takes down the shell or
 * unrelated remotes.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (this.props.observability && this.props.errorContext) {
      this.props.observability.captureError(error, { ...this.props.errorContext, category: 'react_render' });
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
