import {
  checkSecurity,
  isInterstitial,
  normalizeOptions,
} from '@/utils/helper/blinks';
import { ACTIONS_REGISTRY_URL_ALL } from '@/utils/types/blinks';
import { PostBlinksDetail } from '@/utils/types/post';
import { FC } from 'react';
import {
  useGetActionRegistry,
  useGetActionRegistryLookUp,
  useGetBlinkAction,
  useGetBlinkActionJsonUrl,
} from './blink-data-access';
import { ActionContainer } from './blinks-ui';

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
}) => {
  const { data: actionsRegistry } = useGetActionRegistry({
    registryUrl: ACTIONS_REGISTRY_URL_ALL,
  });
  const mergedOptions = normalizeOptions({ securityLevel: 'only-trusted' });
  const interstitialData = actionUrl
    ? isInterstitial(actionUrl)
    : { isInterstitial: false, decodedActionUrl: '' };

  const { data: interstitialState } = useGetActionRegistryLookUp({
    url: actionUrl,
    type: 'interstitial',
    actionsRegistry,
    enabled: !!actionsRegistry && interstitialData.isInterstitial,
  });

  const actionApiUrl =
    actionUrl &&
    interstitialData.isInterstitial &&
    interstitialState &&
    checkSecurity(
      interstitialState.state,
      mergedOptions.securityLevel.interstitials
    )
      ? interstitialData.decodedActionUrl
      : null;

  const { data: websiteState } = useGetActionRegistryLookUp({
    url: actionUrl,
    type: 'website',
    actionsRegistry,
    enabled: !!actionsRegistry && !interstitialData.isInterstitial,
  });
  const { data: actionsUrlMapperApiUrl } = useGetBlinkActionJsonUrl({
    actionUrl: actionUrl,
    enabled:
      !!actionsRegistry &&
      !interstitialData.isInterstitial &&
      !!websiteState &&
      checkSecurity(websiteState.state, mergedOptions.securityLevel.websites),
  });

  const finalActionApiUrl = actionsUrlMapperApiUrl
    ? actionsUrlMapperApiUrl
    : actionApiUrl;

  const { data: actionState } = useGetActionRegistryLookUp({
    url: finalActionApiUrl,
    type: 'action',
    actionsRegistry,
    enabled: !!actionsRegistry && !!finalActionApiUrl,
  });

  const { data: action } = useGetBlinkAction({
    actionUrl: finalActionApiUrl,
    enabled:
      !!finalActionApiUrl &&
      !!actionState &&
      checkSecurity(actionState.state, mergedOptions.securityLevel.actions),
  });

  return (
    <ActionContainer
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
