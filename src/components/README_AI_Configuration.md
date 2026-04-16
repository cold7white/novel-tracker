# AI Configuration Page

A clean, modern AI configuration interface with a left-right layout.

## Features

### Left Panel - Configuration
- **Provider Selection**: Dropdown with OpenAI Compatible, Claude, Gemini, Custom
- **API Key**: Password input field
- **Base URL**: Text input for API endpoint
- **Model**: Text input for model name
- **Advanced Settings** (Collapsible):
  - Temperature: Slider (0-2)
  - Top P: Slider (0-1)
  - Max Tokens: Number input
  - Stream: Toggle switch

### Right Panel - Content
- **System Prompt**: Large textarea for system instructions
- **User Prompt**: Medium textarea for user input
- **Result Display**: Shows AI response with clean formatting
- **Error Display**: Shows error messages in red
- **Action Buttons** (Fixed at bottom right):
  - **Cancel**: Clears user prompt
  - **Generate**: Calls AI with current configuration

## Usage

### Basic Implementation
```tsx
import AIConfiguration from './components/AIConfiguration';

function App() {
  return <AIConfiguration onClose={() => console.log('Closed')} />;
}
```

### Modal Implementation
```tsx
import { useState } from 'react';
import AIConfiguration from './components/AIConfiguration';

function App() {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <>
      <button onClick={() => setShowConfig(true)}>Open AI Config</button>
      
      {showConfig && (
        <div className="modal" onClick={() => setShowConfig(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <AIConfiguration onClose={() => setShowConfig(false)} />
          </div>
        </div>
      )}
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| onClose | () => void | No | Callback when configuration is closed |

## Data Structure

```typescript
interface AIConfig {
  provider: string;
  apiKey: string;
  baseURL: string;
  model: string;
  temperature: number;
  top_p: number;
  maxTokens: number;
  stream: boolean;
}

interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
}
```

## Styling

The component uses CSS variables for easy theming. Default colors:
- Primary: #007bff (blue)
- Background: #ffffff
- Border: #e9ecef
- Text: #212529

## Mobile Responsive

On mobile devices, the layout changes to a vertical stack:
- Configuration panel on top (50% height)
- Content area on bottom (50% height)
- Action buttons become bottom navigation

## Dependencies

- React
- The adapter-based AI service (`/lib/ai/service-adapter.ts`)

## Notes

- No preset templates are included
- Clean, minimal design focused on user input
- Real-time result display
- Error handling with clear feedback
- Auto-scrolling for long results