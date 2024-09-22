'use client';

import { useRelativePathIfPossbile } from '@/utils/helper/endpoints';
import { fetchPost } from '@/utils/helper/post';
import { isTMA, retrieveLaunchParams } from '@telegram-apps/sdk';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useWallet } from 'unified-wallet-adapter-with-telegram';

const TelegramContext = createContext<{ isOnTelegram: boolean }>({
  isOnTelegram: false,
});

export const useTelegramContext = () => useContext(TelegramContext);
export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isOnTelegram, setIsOnTelegram] = useState(false);
  const { publicKey } = useWallet();
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    isTMA().then((result) => {
      setIsOnTelegram(result);

      if (result) {
        const hasNavigated = sessionStorage.getItem('hasNavigated') === 'true';
        if (hasNavigated) return;
        const { startParam } = retrieveLaunchParams();
        const param = startParam?.split('_');
        if (param && param.length == 2) {
          fetchPost(param[0], param[1]).then((x) => {
            if (x) {
              router.push(useRelativePathIfPossbile(x.url));
              sessionStorage.setItem('hasNavigated', 'true');
            }
          });
        }
      }
    });
  }, [path, publicKey, router]);

  return (
    <TelegramContext.Provider value={{ isOnTelegram }}>
      {children}
    </TelegramContext.Provider>
  );
}
