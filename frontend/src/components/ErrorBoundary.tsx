import React from "react";

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Keep fallback UI stable even on render crashes.
    // eslint-disable-next-line no-console
    console.error("frontend_error_boundary", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <p>Something went wrong.</p>
          <button
            type="button"
            className="mt-3 rounded-md border border-rose-300 px-3 py-1 text-xs font-semibold"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
