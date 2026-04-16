import React, { useState } from 'react';

interface AIConfigurationProps {
  onClose?: () => void;
}

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

export default function AIConfiguration({ onClose }: AIConfigurationProps) {
  // State for AI configuration
  const [config, setConfig] = useState<AIConfig>({
    provider: '',
    apiKey: '',
    baseURL: '',
    model: '',
    temperature: 0.7,
    top_p: 1,
    maxTokens: 4096,
    stream: false,
  });

  // State for prompt configuration
  const [promptConfig, setPromptConfig] = useState<PromptConfig>({
    systemPrompt: '',
    userPrompt: '',
  });

  // UI states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Handle provider change
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value;
    setConfig(prev => ({ ...prev, provider }));
  };

  // Handle configuration changes
  const handleConfigChange = (field: keyof AIConfig, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // Handle prompt changes
  const handlePromptChange = (field: keyof PromptConfig, value: string) => {
    setPromptConfig(prev => ({ ...prev, [field]: value }));
  };

  // Clear prompt
  const clearPrompt = () => {
    setPromptConfig({ systemPrompt: '', userPrompt: '' });
    setResult('');
    setError('');
  };

  // Generate AI response
  const generateResponse = async () => {
    setIsCalling(true);
    setError('');
    setResult('');

    try {
      // Prepare the configuration
      const requestConfig = {
        ...config,
        baseUrl: config.baseURL, // Correct field name for adapter
        input: {
          messages: [
            { role: 'system', content: promptConfig.systemPrompt },
            { role: 'user', content: promptConfig.userPrompt },
          ],
        },
      };

      // Import and call the AI service
      const { streamBookInfoWithAdapter } = await import('../lib/ai/service-adapter');

      // Call the AI with streaming
      await streamBookInfoWithAdapter(
        requestConfig,
        '', // Title placeholder
        '', // Author placeholder
        {
          onChunk: (text) => {
            setResult(prev => prev + text);
          },
          onDone: () => {
            setIsCalling(false);
          },
          onError: (err) => {
            setError(err.message);
            setIsCalling(false);
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsCalling(false);
    }
  };

  return (
    <div className="ai-configuration-container">
      <div className="configuration-layout">
        {/* 左侧配置面板 */}
        <div className="config-panel">
          <div className="panel-header">
            <h2>AI 配置</h2>
            {onClose && (
              <button className="close-button" onClick={onClose}>
                ×
              </button>
            )}
          </div>

          <div className="panel-content">
            {/* Provider 选择 */}
            <div className="form-group">
              <label>Provider</label>
              <select
                value={config.provider}
                onChange={handleProviderChange}
                className="form-select"
              >
                <option value="">请选择</option>
                <option value="openai-compatible">OpenAI Compatible</option>
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* API Key */}
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                className="form-input"
                placeholder="输入 API 密钥"
              />
            </div>

            {/* Base URL */}
            <div className="form-group">
              <label>Base URL</label>
              <input
                type="text"
                value={config.baseURL}
                onChange={(e) => handleConfigChange('baseURL', e.target.value)}
                className="form-input"
                placeholder="输入 API 基础地址"
              />
            </div>

            {/* Model */}
            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                className="form-input"
                placeholder="输入模型名称"
              />
            </div>

            {/* 高级配置 */}
            <div className="advanced-toggle">
              <button
                className="toggle-button"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '隐藏' : '显示'}高级配置
              </button>
            </div>

            {showAdvanced && (
              <div className="advanced-settings">
                {/* Temperature */}
                <div className="form-group">
                  <label>Temperature</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                      className="form-range"
                    />
                    <span className="slider-value">{config.temperature}</span>
                  </div>
                </div>

                {/* Top P */}
                <div className="form-group">
                  <label>Top P</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.top_p}
                      onChange={(e) => handleConfigChange('top_p', parseFloat(e.target.value))}
                      className="form-range"
                    />
                    <span className="slider-value">{config.top_p}</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div className="form-group">
                  <label>Max Tokens</label>
                  <input
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                    className="form-input"
                  />
                </div>

                {/* Stream */}
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.stream}
                      onChange={(e) => handleConfigChange('stream', e.target.checked)}
                    />
                    Stream
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="content-area">
          {/* Prompt 输入区 */}
          <div className="prompt-section">
            <h3>Prompt</h3>
            <div className="prompt-inputs">
              <div className="prompt-group">
                <label>System Prompt</label>
                <textarea
                  value={promptConfig.systemPrompt}
                  onChange={(e) => handlePromptChange('systemPrompt', e.target.value)}
                  className="prompt-textarea"
                  rows={10}
                  placeholder="输入系统提示..."
                />
              </div>
              <div className="prompt-group">
                <label>User Prompt</label>
                <textarea
                  value={promptConfig.userPrompt}
                  onChange={(e) => handlePromptChange('userPrompt', e.target.value)}
                  className="prompt-textarea"
                  rows={8}
                  placeholder="输入用户提示..."
                />
              </div>
            </div>
          </div>

          {/* 结果展示区 */}
          {result && (
            <div className="result-section">
              <h3>Result</h3>
              <div className="result-content">
                <pre>{result}</pre>
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="error-section">
              <h3>Error</h3>
              <div className="error-content">
                <pre>{error}</pre>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="action-buttons">
            <button
              className="cancel-button"
              onClick={clearPrompt}
              disabled={isCalling}
            >
              取消
            </button>
            <button
              className="generate-button"
              onClick={generateResponse}
              disabled={
                isCalling ||
                !config.apiKey ||
                !config.provider ||
                !config.baseURL ||
                !promptConfig.userPrompt
              }
            >
              {isCalling ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}