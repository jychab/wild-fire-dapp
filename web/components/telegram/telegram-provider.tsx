'use client';

import { useRelativePathIfPossbile } from '@/utils/helper/endpoints';
import { fetchPost } from '@/utils/helper/post';
import {
  initMainButton,
  isTMA,
  retrieveLaunchParams,
} from '@telegram-apps/sdk';
import { usePathname } from 'next/navigation';
import router from 'next/router';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  useUnifiedWalletContext,
  useWallet,
} from 'unified-wallet-adapter-with-telegram';

const TelegramContext = createContext<{ isOnTelegram: boolean }>({
  isOnTelegram: false,
});

export const useTelegramContext = () => useContext(TelegramContext);
export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isOnTelegram, setIsOnTelegram] = useState(false);
  const { setShowModal } = useUnifiedWalletContext();
  const { publicKey } = useWallet();
  const path = usePathname();

  useEffect(() => {
    isTMA().then((result) => {
      setIsOnTelegram(result);

      if (result) {
        const [mainButton, cleanUp] = initMainButton();
        if (path == '/') {
          if (!publicKey) {
            mainButton.setText('Get Started');
            mainButton.on('click', () => setShowModal(true), true);
            mainButton.enable();
            mainButton.show();
          } else {
            mainButton.hide();
          }
        }

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

        return () => cleanUp();
      }
    });
  }, [path, publicKey]);

  return (
    <TelegramContext.Provider value={{ isOnTelegram }}>
      {children}
    </TelegramContext.Provider>
  );
}
