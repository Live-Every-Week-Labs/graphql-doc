import React, { useMemo, useState, useEffect, useId } from 'react';

export interface TabDefinition {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  hidden?: boolean;
}

interface TabsProps {
  tabs: TabDefinition[];
  defaultIndex?: number;
  className?: string;
  onChange?: (tabId: string) => void;
}

const clampIndex = (index: number, max: number) => Math.max(0, Math.min(index, max));

export const Tabs = React.memo(function Tabs({
  tabs,
  defaultIndex = 0,
  className,
  onChange,
}: TabsProps) {
  const instanceId = useId();
  const visibleTabs = useMemo(() => tabs.filter((tab) => !tab.hidden), [tabs]);
  const [activeIndex, setActiveIndex] = useState(() =>
    clampIndex(defaultIndex, Math.max(visibleTabs.length - 1, 0))
  );

  useEffect(() => {
    if (activeIndex >= visibleTabs.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, visibleTabs.length]);

  const setActive = (index: number) => {
    const next = clampIndex(index, Math.max(visibleTabs.length - 1, 0));
    setActiveIndex(next);
    const tab = visibleTabs[next];
    if (tab) {
      onChange?.(tab.id);
    }
  };

  const moveFocus = (direction: 1 | -1) => {
    if (visibleTabs.length === 0) return;
    let nextIndex = activeIndex;
    for (let i = 0; i < visibleTabs.length; i += 1) {
      nextIndex = clampIndex(nextIndex + direction, visibleTabs.length - 1);
      if (!visibleTabs[nextIndex]?.disabled) {
        setActive(nextIndex);
        break;
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActive(0);
        break;
      case 'End':
        event.preventDefault();
        setActive(visibleTabs.length - 1);
        break;
      default:
        break;
    }
  };

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <div className={`gql-tabs ${className ?? ''}`.trim()}>
      <div className="gql-tab-list" role="tablist" aria-orientation="horizontal">
        {visibleTabs.map((tab, index) => {
          const isActive = index === activeIndex;
          const tabId = `${instanceId}-tab-${tab.id}`;
          const panelId = `${instanceId}-panel-${tab.id}`;

          return (
            <button
              key={tab.id}
              id={tabId}
              role="tab"
              type="button"
              className={`gql-tab ${isActive ? 'is-active' : ''}`}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => setActive(index)}
              onKeyDown={handleKeyDown}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {visibleTabs.map((tab, index) => {
        const isActive = index === activeIndex;
        const tabId = `${instanceId}-tab-${tab.id}`;
        const panelId = `${instanceId}-panel-${tab.id}`;

        return (
          <div
            key={tab.id}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            className="gql-tab-panel"
            hidden={!isActive}
          >
            {isActive && tab.content}
          </div>
        );
      })}
    </div>
  );
});
