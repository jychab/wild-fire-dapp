'use client';

import { ActionConfig, useActionsRegistryInterval } from '@dialectlabs/blinks';
import { useActionSolanaWalletAdapter } from '@dialectlabs/blinks/hooks/solana';
import { createContext, ReactNode, useContext } from 'react';
import { useConnection } from 'unified-wallet-adapter-with-telegram';

// Create context
const ActionsRegistryContext = createContext<{
  isRegistryLoaded: boolean;
  adapter: ActionConfig | null;
}>({
  isRegistryLoaded: false,
  adapter: null,
});

// Provider component
export const ActionsRegistryProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { connection } = useConnection();
  const { isRegistryLoaded } = useActionsRegistryInterval();
  const { adapter } = useActionSolanaWalletAdapter(connection);

  // Pass values to context
  return (
    <ActionsRegistryContext.Provider value={{ isRegistryLoaded, adapter }}>
      {children}
    </ActionsRegistryContext.Provider>
  );
};

// Custom hook to use the context
export const useActionsRegistry = () => {
  return useContext(ActionsRegistryContext);
};
