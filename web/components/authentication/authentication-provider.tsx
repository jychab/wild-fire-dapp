'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from 'firebase/auth';
import { createContext, ReactNode, useEffect, useRef } from 'react';
import { auth } from '../../utils/firebase/firebase';
import {
  createLoginMessage,
  verifyAndGetToken,
} from '../../utils/firebase/functions';

const AuthenticationContext = createContext<{}>({});

export function AuthenticationProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, disconnect } = useWallet();

  const isLoggingInRef = useRef(false);

  const signOut = async () => {
    if (auth.currentUser) {
      await auth.signOut();
    }
    if (publicKey) {
      await disconnect();
    }
  };
  const handleLogin = async (
    publicKey: PublicKey,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
  ) => {
    if (isLoggingInRef.current) return; // Prevent re-entry if already logging in
    isLoggingInRef.current = true;
    try {
      if (
        (auth.currentUser && publicKey.toBase58() !== auth.currentUser.uid) ||
        !auth.currentUser ||
        auth.currentUser.isAnonymous
      ) {
        let currentUser = auth.currentUser;
        if (!currentUser) {
          currentUser = (await signInAnonymously(auth)).user;
        }
        const sessionKey = await currentUser.getIdToken();
        const message = createLoginMessage(sessionKey);
        const output = await signMessage(new TextEncoder().encode(message));
        const token = await verifyAndGetToken(publicKey, output);
        // Sign in with Firebase Authentication using a custom token.
        await signInWithCustomToken(auth, token);
      }
    } catch (error) {
      signOut();
    } finally {
      isLoggingInRef.current = false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (
        publicKey &&
        signMessage &&
        ((user && publicKey.toBase58() !== user.uid) ||
          !user ||
          user.isAnonymous)
      ) {
        handleLogin(publicKey, signMessage);
      }
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, [publicKey, signMessage]);

  return (
    <AuthenticationContext.Provider value={{}}>
      {children}
    </AuthenticationContext.Provider>
  );
}
