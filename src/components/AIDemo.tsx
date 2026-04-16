import { useState } from 'react';
import AIConfiguration from './AIConfiguration';
import './AIConfiguration.css';

export default function AIDemo() {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h1>AI Configuration Demo</h1>
        <button
          className="demo-button"
          onClick={() => setShowConfig(true)}
        >
          Open AI Configuration
        </button>
      </div>

      <div className="demo-content">
        {showConfig && (
          <div className="modal-overlay" onClick={() => setShowConfig(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <AIConfiguration onClose={() => setShowConfig(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}