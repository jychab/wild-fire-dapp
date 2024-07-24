'use client';

import { AuthenticationBtn } from '@/components/authentication/authentication-ui';
import { Blinks } from '@/components/blinks/blinks-ui';
import { ContentGridFeature } from '@/components/content/content-feature';
import { AppHero } from '@/components/ui/ui-layout';
import { HASHFEED_MINT } from '@/utils/consts';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';

// Register the plugins
export default function Page() {
  const { publicKey } = useWallet();
  const router = useRouter();

  return publicKey ? (
    <div className="flex w-full items-center justify-center">
      <div className="max-w-lg w-full h-full sm:p-4">
        <ContentGridFeature />
      </div>
    </div>
  ) : (
    <AppHero
      title={'Your feed, reimagined.'}
      subtitle={
        <div className="flex flex-col gap-4 items-center lg:items-start">
          <p className="text-lg">
            Discover content curated by the tokens you hold.
          </p>
          <AuthenticationBtn
            children={
              <div className="btn btn-outline bg-base-100 rounded-none">
                Get Started
              </div>
            }
          />
        </div>
      }
      children={
        <div className="mockup-phone w-full max-w-xs">
          <div className="camera"></div>
          <div className="display w-full">
            <div className="artboard artboard-demo h-[600px] overflow-y-scroll scrollbar-none">
              <div className="grid grid-cols-1 h-full w-full">
                <div className="w-full">
                  <Blinks
                    actionUrl={
                      new URL(
                        'https://dial.to/?action=solana-action:https://solana.playspokemon.com/'
                      )
                    }
                    additionalMetadata={{
                      name: 'HashFeed',
                      id: crypto.randomUUID(),
                      symbol: 'HashFeed',
                      image: 'https://buckets.hashfeed.social/placeholder.png',
                      mint: HASHFEED_MINT.toBase58(),
                    }}
                    hideUserPanel={true}
                    hideBorder={true}
                    expandAll={true}
                    hideComment={true}
                  />
                </div>
                <div className="w-full">
                  <Blinks
                    actionUrl={
                      new URL(
                        'https://dial.to/?action=solana-action%3Ahttps%3A%2F%2Fhedgehog.markets%2Fapi%2Fv1%2Fclassic%2Fbuy%2F%3Fmarket%3D2PdyVYFstuFxXedzwHN39V5mh44DQvtXBaP7JgvRUGR9'
                      )
                    }
                    additionalMetadata={{
                      name: 'HashFeed',
                      id: crypto.randomUUID(),
                      symbol: 'HashFeed',
                      image: 'https://buckets.hashfeed.social/placeholder.png',
                      mint: HASHFEED_MINT.toBase58(),
                    }}
                    hideUserPanel={true}
                    hideBorder={true}
                    expandAll={true}
                    hideComment={true}
                  />
                </div>

                <div className="w-full">
                  <Blinks
                    actionUrl={
                      new URL(
                        'https://dial.to/?action=solana-action:https://jupiter.dial.to/swap/SOL-Bonk'
                      )
                    }
                    additionalMetadata={{
                      name: 'HashFeed',
                      id: crypto.randomUUID(),
                      symbol: 'HashFeed',
                      image: 'https://buckets.hashfeed.social/placeholder.png',
                      mint: HASHFEED_MINT.toBase58(),
                    }}
                    hideUserPanel={true}
                    hideBorder={true}
                    expandAll={true}
                    hideComment={true}
                  />
                </div>
                <div className="w-full">
                  <Blinks
                    actionUrl={
                      new URL(
                        'https://dial.to/?action=solana-action:https://tug-of-war.magicblock.app/api/v1/tug/item/DN4PPQ6MxAEy9sfrPRcrrxyoW8S2m5kX3NGfzrN3YMdQ'
                      )
                    }
                    additionalMetadata={{
                      name: 'HashFeed',
                      id: crypto.randomUUID(),
                      symbol: 'HashFeed',
                      image: 'https://buckets.hashfeed.social/placeholder.png',
                      mint: HASHFEED_MINT.toBase58(),
                    }}
                    hideUserPanel={true}
                    hideBorder={true}
                    expandAll={true}
                    hideComment={true}
                  />
                </div>
                <div className="w-full">
                  <Blinks
                    actionUrl={
                      new URL(
                        'https://dial.to/?action=solana-action:https://api-main-mainnet.dreader.io/blink/action-spec/mint/48'
                      )
                    }
                    additionalMetadata={{
                      name: 'HashFeed',
                      id: crypto.randomUUID(),
                      symbol: 'HashFeed',
                      image: 'https://buckets.hashfeed.social/placeholder.png',
                      mint: HASHFEED_MINT.toBase58(),
                    }}
                    hideUserPanel={true}
                    hideBorder={true}
                    expandAll={true}
                    hideComment={true}
                  />
                </div>
                <div className="w-full">
                  <Blinks
                    actionUrl={
                      new URL(
                        'https://dial.to/?action=solana-action%3Ahttps%3A%2F%2Fmeteora.dial.to%2Fswap%2FHtnih5T64YYvwbkNDmeac2jbiAe1Gec7s5MCiUjTwUPw%3Ftoken%3D3dCCbYca3jSgRdDiMEeV5e3YKNzsZAp3ZVfzUsbb4be4%26referrer%3DF1CWpTFAiPZKsYK2DNQ5zzic1CiPBQLuQxGbDMxz53WF'
                      )
                    }
                    additionalMetadata={{
                      name: 'HashFeed',
                      id: crypto.randomUUID(),
                      symbol: 'HashFeed',
                      image: 'https://buckets.hashfeed.social/placeholder.png',
                      mint: HASHFEED_MINT.toBase58(),
                    }}
                    hideUserPanel={true}
                    hideBorder={true}
                    expandAll={true}
                    hideComment={true}
                  />
                </div>
                <div className="carousel-item ">
                  <Blinks
                    actionUrl={
                      new URL(
                        'https://dial.to/?action=solana-action:https://tensor.dial.to/buy-floor/madlads'
                      )
                    }
                    additionalMetadata={{
                      name: 'HashFeed',
                      id: crypto.randomUUID(),
                      symbol: 'HashFeed',
                      image: 'https://buckets.hashfeed.social/placeholder.png',
                      mint: HASHFEED_MINT.toBase58(),
                    }}
                    hideUserPanel={true}
                    hideBorder={true}
                    expandAll={true}
                    hideComment={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
