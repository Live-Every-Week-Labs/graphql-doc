import React from 'react';
import { render, within, cleanup, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { TwoColumnContent } from './TwoColumnContent';
import { OperationView } from '../content/OperationView';
import { mockExampleSuccess, mockOperation } from '../__tests__/fixtures';

describe('TwoColumnContent', () => {
  afterEach(() => {
    cleanup();
  });

  const operationWithoutExamples = { ...mockOperation, examples: [] };

  it('renders examples panel for the active operation', () => {
    const { container } = render(
      <TwoColumnContent examplesByOperation={{ getUser: [mockExampleSuccess] }}>
        <OperationView operation={mockOperation} />
      </TwoColumnContent>
    );

    const sidePanel = container.querySelector('.gql-docs-examples');
    expect(sidePanel).toBeInTheDocument();
    expect(
      within(sidePanel as HTMLElement).getByLabelText('Examples for getUser')
    ).toBeInTheDocument();
  });

  it('uses renderExamples when provided', () => {
    render(
      <TwoColumnContent
        initialOperation="getUser"
        renderExamples={(operationName) => <div>Custom {operationName}</div>}
      >
        <OperationView operation={operationWithoutExamples} />
      </TwoColumnContent>
    );

    expect(screen.getByText('Custom getUser')).toBeInTheDocument();
  });

  it('supports Map sources and initialOperation', () => {
    const examples = new Map([['getUser', [mockExampleSuccess]]]);

    const { container } = render(
      <TwoColumnContent examplesByOperation={examples} initialOperation="getUser">
        <OperationView operation={operationWithoutExamples} />
      </TwoColumnContent>
    );

    const sidePanel = container.querySelector('.gql-docs-examples');
    expect(sidePanel).toBeInTheDocument();
    expect(
      within(sidePanel as HTMLElement).getByLabelText('Examples for getUser')
    ).toBeInTheDocument();
  });

  it('sets the active operation when examples arrive after first render', () => {
    const { container, rerender } = render(
      <TwoColumnContent>
        <OperationView operation={operationWithoutExamples} />
      </TwoColumnContent>
    );

    const emptyPanel = container.querySelector('.gql-docs-examples');
    expect(emptyPanel).toBeNull();

    rerender(
      <TwoColumnContent examplesByOperation={{ getUser: [mockExampleSuccess] }}>
        <OperationView operation={operationWithoutExamples} />
      </TwoColumnContent>
    );

    const sidePanel = container.querySelector('.gql-docs-examples');
    expect(sidePanel).toBeInTheDocument();
    expect(
      within(sidePanel as HTMLElement).getByLabelText('Examples for getUser')
    ).toBeInTheDocument();
  });

  it('renders no side examples when none are available', () => {
    const { container } = render(
      <TwoColumnContent examplesByOperation={{}} initialOperation="getUser">
        <OperationView operation={operationWithoutExamples} />
      </TwoColumnContent>
    );

    const sidePanel = container.querySelector('.gql-docs-examples');
    expect(sidePanel).toBeNull();
  });
});
