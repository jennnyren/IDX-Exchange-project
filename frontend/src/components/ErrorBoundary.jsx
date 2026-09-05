import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught a render error:", error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <p className="error">Something went wrong displaying this page.</p>
          <button type="button" onClick={this.handleReset}>
            Try again
          </button>
          <Link to="/">Back to listings</Link>
        </div>
      );
    }

    return this.props.children;
  }
}
