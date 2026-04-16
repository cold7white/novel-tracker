import React, { useState } from 'react';
import AIConfigPageNew from './AIConfigPageNew';
import './AIConfigPageNew.css';

const AIDemoPage: React.FC = () => {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h1>AI 配置演示</h1>
        <button
          className="demo-btn"
          onClick={() => setShowConfig(!showConfig)}
        >
          {showConfig ? '隐藏配置' : '显示配置'}
        </button>
      </div>

      <div className="demo-content">
        {showConfig && (
          <div className="config-wrapper">
            <AIConfigPageNew
              onClose={() => setShowConfig(false)}
            />
          </div>
        )}

        {!showConfig && (
          <div className="demo-instructions">
            <h2>使用说明</h2>
            <ol>
              <li>点击上方"显示配置"按钮</li>
              <li>在左侧配置 AI API 参数</li>
              <li>在右侧输入 Prompt</li>
              <li>点击"生成"按钮调用 AI</li>
              <li>查看返回的结果</li>
            </ol>

            <h2>支持的 AI 提供商</h2>
            <ul>
              <li><strong>OpenAI Compatible</strong> - OpenAI、DeepSeek、GLM、MiniMax、Moonshot</li>
              <li><strong>Claude</strong> - Anthropic Claude 官方 API</li>
              <li><strong>Gemini</strong> - Google Gemini API</li>
              <li><strong>Custom</strong> - 自定义 API 接口</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDemoPage;