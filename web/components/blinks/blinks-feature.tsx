import {
  checkSecurity,
  DEFAULT_OPTIONS,
  isInterstitial,
  normalizeOptions,
} from '@/utils/helper/blinks';
import {
  ActionCallbacksConfig,
  ACTIONS_REGISTRY_URL_ALL,
  ObserverOptions,
} from '@/utils/types/blinks';
import { PostBlinksDetail } from '@/utils/types/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { FC, useMemo } from 'react';
import {
  getActionRegistryLookUp,
  useGetActionRegistry,
  useGetBlinkAction,
  useGetBlinkActionJsonUrl,
} from './blink-data-access';
import { ActionContainer } from './blinks-container';

interface BlinksProps {
  actionUrl: URL;
  blinksDetail?: PostBlinksDetail;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
  hideComment?: boolean;
  expandAll?: boolean;
  hideUserPanel?: boolean;
  hideCaption?: boolean;
  hideCarousel?: boolean;
  hideBorder?: boolean;
  callbacks?: Partial<ActionCallbacksConfig>;
  options?: Partial<ObserverOptions>;
  preview?: boolean;
}
export const Blinks: FC<BlinksProps> = ({
  actionUrl,
  blinksDetail,
  showMintDetails = true,
  hideUserPanel = false,
  editable = false,
  multiGrid = false,
  hideComment = false,
  expandAll = false,
  hideCaption = false,
  hideCarousel = false,
  hideBorder = false,
  callbacks = {},
  options = DEFAULT_OPTIONS,
  preview = false,
}) => {
  const { publicKey } = useWallet();
  const { data: actionsRegistry } = useGetActionRegistry({
    registryUrl: ACTIONS_REGISTRY_URL_ALL,
  });

  // Memoize merged options
  const mergedOptions = useMemo(
    () => normalizeOptions({ securityLevel: 'only-trusted' }),
    []
  );
  const interstitialData = useMemo(
    () =>
      actionUrl
        ? isInterstitial(actionUrl)
        : { isInterstitial: false, decodedActionUrl: '' },
    [actionUrl]
  );

  const interstitialState = useMemo(() => {
    if (!!actionsRegistry && interstitialData.isInterstitial) {
      return getActionRegistryLookUp({
        url: actionUrl,
        type: 'interstitial',
        actionsRegistry,
      });
    } else {
      return null;
    }
  }, [actionUrl, interstitialData, actionsRegistry]);

  // Determine the final action URL based on interstitial or website checks
  const actionApiUrl = useMemo(
    () =>
      actionUrl &&
      interstitialData.isInterstitial &&
      interstitialState &&
      checkSecurity(
        interstitialState.state,
        mergedOptions.securityLevel.interstitials
      )
        ? interstitialData.decodedActionUrl
        : null,
    [actionUrl, interstitialData, interstitialState, mergedOptions]
  );

  const websiteState = useMemo(() => {
    if (!!actionsRegistry && !interstitialData.isInterstitial) {
      return getActionRegistryLookUp({
        url: actionUrl,
        type: 'website',
        actionsRegistry,
      });
    } else {
      return null;
    }
  }, [actionUrl, actionsRegistry, interstitialData]);

  const { data: actionsUrlMapperApiUrl } = useGetBlinkActionJsonUrl({
    actionUrl: actionUrl,
    enabled:
      !!actionsRegistry &&
      !interstitialData.isInterstitial &&
      !!websiteState &&
      checkSecurity(websiteState.state, mergedOptions.securityLevel.websites),
  });

  const finalActionApiUrl = useMemo(
    () =>
      actionsUrlMapperApiUrl ||
      actionApiUrl ||
      (preview ? actionUrl.toString() : ''),
    [actionsUrlMapperApiUrl, preview, actionApiUrl]
  );

  // Get action state and action data
  const actionState = useMemo(() => {
    if (!!actionsRegistry && !!finalActionApiUrl) {
      return getActionRegistryLookUp({
        url: finalActionApiUrl,
        type: 'action',
        actionsRegistry,
      });
    } else {
      return null;
    }
  }, [finalActionApiUrl, actionsRegistry]);

  const { data: action } = useGetBlinkAction({
    actionUrl: finalActionApiUrl,
    publicKey: publicKey,
    options: options,
    enabled:
      !!options &&
      !!finalActionApiUrl &&
      !!actionState &&
      checkSecurity(actionState.state, mergedOptions.securityLevel.actions),
  });

  return (
    <ActionContainer
      preview={preview}
      actionsRegistry={actionsRegistry}
      action={action}
      websiteText={actionUrl?.hostname}
      websiteUrl={actionUrl?.toString()}
      normalizedSecurityLevel={{ ...mergedOptions.securityLevel }}
      blinksDetail={blinksDetail}
      multiGrid={multiGrid}
      showMintDetails={showMintDetails}
      hideBorder={hideBorder}
      hideCarousel={hideCarousel}
      hideCaption={hideCaption}
      hideUserPanel={hideUserPanel}
      hideComment={hideComment}
      expandAll={expandAll}
      editable={editable}
    />
  );
};
