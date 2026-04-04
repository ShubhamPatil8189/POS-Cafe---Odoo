import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import CustomerDisplay from './customer-display/CustomerDisplay.jsx';
import { OrderProvider } from './components/restaurant/OrderContext.jsx';

export default function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/customer-display" 
          element={
            <OrderProvider>
              <CustomerDisplay />
            </OrderProvider>
          } 
        />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}
