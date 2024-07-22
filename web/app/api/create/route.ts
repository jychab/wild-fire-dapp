import { buildTokenMetadata } from '@/components/create/create-data-access';
import { ONE_BILLION } from '@/utils/consts';
import {
  createMint,
  createMintMetadata,
  initializeMint,
} from '@/utils/helper/transcationInstructions';
import { WildFire } from '@/utils/program/types/wild_fire';
import { Program } from '@coral-xyz/anchor';
import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
} from '@solana/actions';
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { NextRequest, NextResponse } from 'next/server';
import Idl from '../../../utils/program/idl/wild_fire.json';

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!);
const program = (connection: Connection) =>
  new Program<WildFire>(Idl as unknown as WildFire, {
    connection,
  });

export async function GET(req: NextRequest) {
  const { icon, title, description } = getCreateAccountInfo();

  const response: ActionGetResponse = {
    icon,
    label: `Create Account`,
    title,
    description: description,
    links: {
      actions: [
        {
          href: `/api/create?displayname={displayname}&username={username}`,
          label: 'Create Account',
          parameters: [
            {
              name: 'displayname',
              label: 'Enter your Display Name',
            },
            {
              name: 'username',
              label: 'Enter your Username',
            },
          ],
        },
      ],
    },
  };
  return NextResponse.json(response);
}

export async function POST(req: NextRequest) {
  const { account } = (await req.json()) as ActionPostRequest;
  const url = new URL(req.url);
  const displayname = url.searchParams.get('displayname');
  const username = url.searchParams.get('username');
  try {
    if (!displayname || !username) {
      throw Error('No displayname or username found!');
    }
    const publicKey = new PublicKey(account);
    const [mint] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint'), publicKey.toBuffer()],
      program(connection).programId
    );

    const metadata = await buildTokenMetadata(
      {
        name: displayname,
        symbol: username,
        picture: 'https://buckets.hashfeed.social/placeholder.png',
        description: '',
      },
      mint
    );

    const [mintIx, metadataIx, initMintIx] = await Promise.all([
      createMint(
        connection,
        new PublicKey('Hc1vbMTbjDmj5QMazL5PUDZWRdpFakBedZvKJfzEp8B7'),
        10,
        undefined,
        publicKey
      ),
      createMintMetadata(connection, metadata, publicKey),
      initializeMint(connection, ONE_BILLION, mint, publicKey),
    ]);

    const transaction = await prepareTransaction(
      [mintIx, metadataIx, initMintIx],
      publicKey
    );
    const response: ActionPostResponse = {
      transaction: Buffer.from(transaction.serialize()).toString('base64'),
    };
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}

function getCreateAccountInfo(): Pick<
  ActionGetResponse,
  'icon' | 'title' | 'description'
> {
  const icon =
    'https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/';
  const title = 'Create an account';
  const description =
    'Create an account & receive your first airdrop on hashfeed.social';
  return { icon, title, description };
}

async function prepareTransaction(
  instructions: TransactionInstruction[],
  payer: PublicKey
) {
  const blockhash = await connection
    .getLatestBlockhash({ commitment: 'max' })
    .then((res) => res.blockhash);
  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  return new VersionedTransaction(messageV0);
}
