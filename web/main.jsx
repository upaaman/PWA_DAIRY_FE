import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import './styles.css';

class AppBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error(error);
  }
  render() {
    if (this.state.failed)
      return (
        <main className="startup-error">
          <h1>Something went wrong</h1>
          <p>Please reload FeDairy to try again.</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </main>
      );
    return this.props.children;
  }
}
createRoot(document.getElementById('root')).render(
  <AppBoundary>
    <App />
  </AppBoundary>,
);
