import { useEffect } from 'react';
import type { RefObject } from 'react';

const addScopedClass = (element: HTMLElement | null, className: string) => {
  if (!element) {
    return () => undefined;
  }

  const countAttribute = `data-gql-${className.replace(/[^a-z0-9]+/gi, '-')}-count`;
  const currentCount = Number.parseInt(element.getAttribute(countAttribute) ?? '0', 10);

  if (currentCount === 0) {
    element.classList.add(className);
  }

  element.setAttribute(countAttribute, String(currentCount + 1));

  return () => {
    const nextCount = Number.parseInt(element.getAttribute(countAttribute) ?? '1', 10) - 1;
    if (nextCount <= 0) {
      element.classList.remove(className);
      element.removeAttribute(countAttribute);
      return;
    }

    element.setAttribute(countAttribute, String(nextCount));
  };
};

const addScopedInlineStyle = (
  element: HTMLElement | null,
  propertyName: string,
  value: string,
  priority?: string
) => {
  if (!element) {
    return () => undefined;
  }

  const token = propertyName.replace(/[^a-z0-9]+/gi, '-');
  const countAttribute = `data-gql-style-${token}-count`;
  const valueAttribute = `data-gql-style-${token}-prev`;
  const priorityAttribute = `data-gql-style-${token}-prev-priority`;
  const currentCount = Number.parseInt(element.getAttribute(countAttribute) ?? '0', 10);

  if (currentCount === 0) {
    element.setAttribute(valueAttribute, element.style.getPropertyValue(propertyName));
    element.setAttribute(priorityAttribute, element.style.getPropertyPriority(propertyName));
    element.style.setProperty(propertyName, value, priority);
  }

  element.setAttribute(countAttribute, String(currentCount + 1));

  return () => {
    const nextCount = Number.parseInt(element.getAttribute(countAttribute) ?? '1', 10) - 1;
    if (nextCount > 0) {
      element.setAttribute(countAttribute, String(nextCount));
      return;
    }

    const previousValue = element.getAttribute(valueAttribute);
    const previousPriority = element.getAttribute(priorityAttribute) ?? '';
    if (!previousValue) {
      element.style.removeProperty(propertyName);
    } else {
      element.style.setProperty(propertyName, previousValue, previousPriority);
    }

    element.removeAttribute(countAttribute);
    element.removeAttribute(valueAttribute);
    element.removeAttribute(priorityAttribute);
  };
};

const findAncestorWithClassToken = (element: HTMLElement, token: string) => {
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    if (current.className?.toString().includes(token)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

/**
 * Ensures GraphQL docs render full-width in host Docusaurus sites, including
 * setups that skip plugin theme wrappers.
 */
export const useDocusaurusLayoutBridge = (rootRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const docCol = findAncestorWithClassToken(root, 'docItemCol');
    const container = root.closest('.container') as HTMLElement | null;

    const cleanupBody = addScopedClass(document.body, 'gql-docs-page');
    const cleanupDocCol = addScopedClass(docCol, 'gql-docs-col');
    const cleanupContainer = addScopedClass(container, 'gql-docs-container');
    const cleanupDocColMaxWidth = addScopedInlineStyle(docCol, 'max-width', '100%', 'important');
    const cleanupDocColFlex = addScopedInlineStyle(docCol, 'flex', '0 0 100%', 'important');
    const cleanupDocColFlexBasis = addScopedInlineStyle(docCol, 'flex-basis', '100%', 'important');
    const cleanupDocColIfmWidth = addScopedInlineStyle(
      docCol,
      '--ifm-col-width',
      '100%',
      'important'
    );
    const cleanupContainerMaxWidth = addScopedInlineStyle(
      container,
      'max-width',
      '1800px',
      'important'
    );

    return () => {
      cleanupContainerMaxWidth();
      cleanupDocColIfmWidth();
      cleanupDocColFlexBasis();
      cleanupDocColFlex();
      cleanupDocColMaxWidth();
      cleanupContainer();
      cleanupDocCol();
      cleanupBody();
    };
  }, [rootRef]);
};
