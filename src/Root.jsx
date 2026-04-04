import React, { useSyncExternalStore } from 'react';
import App from './App.jsx';
import CustomerDisplay from './customer-display/CustomerDisplay.jsx';
import { OrderProvider } from './components/restaurant/OrderContext.jsx';

function subscribe(onChange) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

function getPath() {
  return window.location.pathname;
}

function getServerPath() {
  return '/';
}

/**
 * Standalone routes without modifying App.jsx:
 * - /customer-display → TV / signage (shares OrderProvider + localStorage with POS when both used)
 */
export default function Root() {
  const path = useSyncExternalStore(subscribe, getPath, getServerPath);

  if (path === '/customer-display') {
    return (
      <OrderProvider>
        <CustomerDisplay />
      </OrderProvider>
    );
  }

  return <App />;
}
