import React, { createContext, useContext, useMemo } from 'react';
import type { ExpandedType } from '../../core/transformer/types';

interface TypeRegistryContextValue {
  typesByName: Record<string, ExpandedType>;
}

const TypeRegistryContext = createContext<TypeRegistryContextValue | undefined>(undefined);

interface TypeRegistryProviderProps {
  typesByName?: Record<string, ExpandedType>;
  children: React.ReactNode;
}

export function TypeRegistryProvider({ typesByName, children }: TypeRegistryProviderProps) {
  const value = useMemo<TypeRegistryContextValue>(() => {
    if (!typesByName) {
      return { typesByName: {} };
    }

    return { typesByName };
  }, [typesByName]);

  return <TypeRegistryContext.Provider value={value}>{children}</TypeRegistryContext.Provider>;
}

export function useTypeRegistry() {
  return useContext(TypeRegistryContext);
}
