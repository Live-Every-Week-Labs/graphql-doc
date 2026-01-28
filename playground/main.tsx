import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { TypeViewer } from '../src/components/content/TypeViewer';
import { ExpansionProvider } from '../src/components/context/ExpansionProvider';
import { mocks, mockArgs } from './mocks';
import '../src/components/styles/graphql-docs.css';

import { PropertyTable } from '../src/components/content/PropertyTable';

const App = () => {
  const [selectedMock, setSelectedMock] = useState<string>('Scalar');

  return (
    <div>
      <h1>TypeViewer Playground</h1>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Select Type:</label>
        <select
          value={selectedMock}
          onChange={(e) => setSelectedMock(e.target.value)}
          style={{ padding: '5px', fontSize: '16px' }}
        >
          {Object.keys(mocks).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '4px' }}>
        <ExpansionProvider>
          {/* We will need to make sure TypeViewer is exported/available */}
          <TypeViewer type={mocks[selectedMock]} />
        </ExpansionProvider>
      </div>

      <h2>Property Table (Arguments) Preview</h2>
      <div
        style={{
          border: '1px solid #ddd',
          padding: '20px',
          borderRadius: '4px',
          marginTop: '20px',
        }}
      >
        <ExpansionProvider>
          <PropertyTable properties={mockArgs} />
        </ExpansionProvider>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
