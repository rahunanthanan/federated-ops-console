import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Standalone entry so the remote can be developed/tested in isolation,
// with the shell running against real or mocked remotes. This file is
// NOT part of the federated bundle.
const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
