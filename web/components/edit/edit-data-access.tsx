'use client';

import { db } from '@/utils/firebase/firebase';
import { checkIfMetadataExist } from '@/utils/helper/format';
import { DAS } from '@/utils/types/das';
import { TokenState } from '@/utils/types/program';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  setTemporaryProfile,
  updateMetadataInstruction,
  uploadMedia,
  uploadMetadata,
} from '../../utils/firebase/functions';
import { buildAndSendTransaction } from '../../utils/program/transactionBuilder';
import { useTransactionToast } from '../ui/ui-layout';

interface EditMintArgs {
  name: string;
  symbol: string;
  picture: File | null;
  description: string;
}

export function useEditData({
  mint,
  metadata,
}: {
  mint: PublicKey | null;
  metadata: DAS.GetAssetResponse | null | undefined;
}) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: [
      'edit-mint',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async (input: EditMintArgs) => {
      if (!wallet.publicKey || !mint || !wallet.signTransaction) return;
      let imageUrl;
      if (input.picture) {
        imageUrl = await uploadMedia(input.picture, wallet.publicKey);
      }
      if (checkIfMetadataExist(metadata)) {
        await setTemporaryProfile(input.name, input.description, imageUrl);
        return 'Success';
      }
      let signature: TransactionSignature = '';
      let partialTx;
      try {
        if (!metadata?.content?.json_uri) {
          return;
        }
        const uriMetadata = await (
          await fetch(metadata?.content?.json_uri)
        ).json();

        const payload = {
          ...uriMetadata,
          name: input.name || uriMetadata.name,
          symbol: input.symbol || uriMetadata.symbol,
          description: input.description || uriMetadata.description,
          image: imageUrl || uriMetadata.image,
        };
        const uri = await uploadMetadata(
          JSON.stringify(payload),
          wallet.publicKey
        );

        partialTx = await updateMetadataInstruction(
          mint.toBase58(),
          payload.name,
          payload.symbol,
          uri
        );

        const partialSignedTx = VersionedTransaction.deserialize(
          Buffer.from(partialTx, 'base64')
        );
        signature = await buildAndSendTransaction({
          connection,
          partialSignedTx,
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
        });
        return signature;
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },

    onSuccess: async (signature) => {
      if (signature) {
        transactionToast(signature);
        router.push(`/profile?mintId=${mint?.toBase58()}`);
        return await Promise.all([
          client.invalidateQueries({
            queryKey: ['get-token-details', { mint: mint }],
          }),
        ]);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${JSON.stringify(error)}`);
    },
  });
}

export function useGetMintToken({ mint }: { mint: PublicKey | null }) {
  return useQuery({
    queryKey: ['get-mint-token', { mint }],
    queryFn: async () => {
      if (!mint) return null;
      const mintData = await getDoc(doc(db, `Mint/${mint.toBase58()}`));
      if (!mintData.exists) {
        return null;
      } else {
        return {
          memberMint: mintData.data()!.memberMint,
          mint: mintData.data()!.mint,
          admin: mintData.data()!.admin,
        } as TokenState;
      }
    },
    staleTime: Infinity,
    enabled: !!mint,
  });
}
