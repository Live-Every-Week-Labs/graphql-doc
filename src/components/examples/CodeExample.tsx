import React, { useMemo, useState } from 'react';
import type { Example } from '../../core/metadata/types';
import { ResponseBadge } from './ResponseBadge';
import { Tabs, type TabDefinition } from '../ui/Tabs';

interface CodeExampleProps {
  example: Example;
}

const formatJson = (value: unknown) => {
  if (value === undefined) return '';
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const useCopyState = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (id: string, value: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopiedId(null);
    }
  };

  return { copiedId, copy };
};

const CodePanel = ({
  id,
  language,
  code,
  onCopy,
  copied,
}: {
  id: string;
  language: string;
  code: string;
  onCopy: (id: string, value: string) => void;
  copied: boolean;
}) => (
  <div className="gql-code-panel">
    <div className="gql-code-panel-header">
      <span className="gql-code-panel-title">{language.toUpperCase()}</span>
      <button
        type="button"
        className="gql-copy-button"
        onClick={() => onCopy(id, code)}
        aria-label={`Copy ${language}`}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
    <pre className="gql-code-block">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  </div>
);

export const CodeExample = React.memo(function CodeExample({ example }: CodeExampleProps) {
  const { copiedId, copy } = useCopyState();
  const variablesJson = useMemo(() => formatJson(example.variables), [example.variables]);
  const responseJson = useMemo(() => formatJson(example.response?.body), [example.response?.body]);

  const tabs: TabDefinition[] = [
    {
      id: 'query',
      label: 'Query',
      content: (
        <CodePanel
          id="query"
          language="graphql"
          code={example.query}
          onCopy={copy}
          copied={copiedId === 'query'}
        />
      ),
    },
    {
      id: 'variables',
      label: 'Variables',
      hidden: !example.variables || variablesJson.trim().length === 0,
      content: (
        <CodePanel
          id="variables"
          language="json"
          code={variablesJson}
          onCopy={copy}
          copied={copiedId === 'variables'}
        />
      ),
    },
    {
      id: 'response',
      label: 'Response',
      content: (
        <CodePanel
          id="response"
          language="json"
          code={responseJson}
          onCopy={copy}
          copied={copiedId === 'response'}
        />
      ),
    },
  ];

  return (
    <div className="gql-code-example">
      <div className="gql-code-example-header">
        <div>
          <div className="gql-code-example-title">{example.name}</div>
          {example.description && (
            <div className="gql-code-example-description">{example.description}</div>
          )}
        </div>
        <ResponseBadge type={example.response.type} httpStatus={example.response.httpStatus} />
      </div>
      <Tabs tabs={tabs} />
    </div>
  );
});
