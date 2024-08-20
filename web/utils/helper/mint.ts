import { PublicKey } from '@solana/web3.js';
import { Scope } from '../enums/das';
import { DAS } from '../types/das';
import { TokenState } from '../types/program';
import { program } from './transcationInstructions';

export function getDerivedMint(address: PublicKey) {
  const [derivedMint] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint'), address.toBuffer()],
    program.programId
  );
  return derivedMint;
}
export function isAuthorized(
  tokenStateData: TokenState | null | undefined,
  publicKey: PublicKey | null,
  metadata: DAS.GetAssetResponse | null | undefined
) {
  if (!tokenStateData || !publicKey || !metadata) {
    return false;
  }
  return (
    publicKey.toBase58() == tokenStateData.admin ||
    metadata?.authorities?.find(
      (x) => x.scopes.includes(Scope.METADATA) || x.scopes.includes(Scope.FULL)
    )?.address == publicKey.toBase58()
  );
}
export function getAssociatedTokenStateAccount(mint: PublicKey) {
  const [tokenState] = PublicKey.findProgramAddressSync(
    [Buffer.from('token'), mint.toBuffer()],
    program.programId
  );

  return tokenState;
}
