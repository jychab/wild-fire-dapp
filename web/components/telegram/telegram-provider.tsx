'use client';

import { useRelativePathIfPossbile } from '@/utils/helper/endpoints';
import { fetchPost } from '@/utils/helper/post';
import {
  expandViewport,
  isTMA,
  retrieveLaunchParams,
  swipeBehavior,
} from '@telegram-apps/sdk';
import { useRouter } from 'next/navigation';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

const TelegramContext = createContext<{ isOnTelegram: boolean }>({
  isOnTelegram: false,
});

export const useTelegramContext = () => useContext(TelegramContext);
export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isOnTelegram, setIsOnTelegram] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      isTMA().then((result) => {
        setIsOnTelegram(result);
        if (result) {
          try {
            swipeBehavior.mount();
            swipeBehavior.disableVertical();
            expandViewport();
          } catch (e) {
            console.error('Telegram swipe/viewport setup error:', e);
          }
          const hasNavigated =
            sessionStorage.getItem('hasNavigated') === 'true';
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
    }
  }, [router]);

  return (
    <TelegramContext.Provider value={{ isOnTelegram }}>
      {children}
    </TelegramContext.Provider>
  );
}
