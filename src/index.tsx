// index.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import BingoApp from './BingoApp';
import VRMViewer from './VRMViewer';

ReactDOM.render(
  <React.StrictMode>
    <BingoApp />
    <VRMViewer />
  </React.StrictMode>,
  document.getElementById('root')
);
