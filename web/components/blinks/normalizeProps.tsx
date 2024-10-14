import { proxify } from '@/utils/helper/endpoints';
import { PostContent } from '@/utils/types/post';
import { TypedActionParameter } from '@dialectlabs/blinks';
import { isParameterSelectable } from '@dialectlabs/blinks-core';
import { LinkedAction } from '@solana/actions';
import { useMemo } from 'react';
import type { InnerLayoutProps } from './base-blink-layout';

export const buttonVariantMap: Record<any, 'default' | 'error' | 'success'> = {
  'checking-supportability': 'default',
  blocked: 'default',
  idle: 'default',
  executing: 'default',
  success: 'success',
  error: 'error',
};

export const buttonLabelMap: Record<any, string | null> = {
  'checking-supportability': 'Loading',
  blocked: null,
  idle: null,
  executing: 'Executing',
  success: 'Completed',
  error: 'Failed',
};
const SOFT_LIMIT_BUTTONS = 10;
const SOFT_LIMIT_INPUTS = 3;
const SOFT_LIMIT_FORM_INPUTS = 10;

export const useLayoutPropNormalizer = ({
  post,
}: {
  post: Partial<PostContent> | undefined;
}): InnerLayoutProps => {
  let buttons = useMemo(
    () =>
      post?.links?.actions
        .filter((it) => !it.parameters?.length)
        .slice(0, SOFT_LIMIT_BUTTONS) ?? [],
    [post]
  );
  const inputs = useMemo(
    () =>
      post?.links?.actions
        .filter((it) => it.parameters?.length == 1)
        .slice(0, SOFT_LIMIT_INPUTS) ?? [],
    [post]
  );
  const form = useMemo(() => {
    const [formComponent] =
      post?.links?.actions.filter(
        (it) => it.parameters && it.parameters?.length > 1
      ) ?? [];

    return formComponent;
  }, [post]);

  const asButtonProps = (it: LinkedAction) => {
    return {
      text: it.label,
      loading: false,
      disabled: false,
      variant: buttonVariantMap['idle'],
      ctaType:
        it.type === 'external-link' ? ('link' as const) : ('button' as const),
      onClick: async () => {},
    };
  };

  const asInputProps = (
    it: TypedActionParameter,
    button?: LinkedAction,
    { placement }: { placement: 'form' | 'standalone' } = {
      placement: 'standalone',
    }
  ) => {
    return {
      type: it.type ?? 'text',
      placeholder: it.label,
      disabled: false,
      name: it.name,
      required: it.required,
      min: it.min,
      max: it.max,
      pattern: undefined,
      options: isParameterSelectable(it) ? it.options : undefined,
      description: it.patternDescription,
      button: button ? asButtonProps(button) : undefined,
    };
  };

  const asFormProps = (it: LinkedAction) => {
    return {
      button: asButtonProps(it),
      inputs: it.parameters!.slice(0, SOFT_LIMIT_FORM_INPUTS).map((parameter) =>
        asInputProps(
          it.parameters!.find((x) => x.name == parameter.name)!,
          undefined,
          {
            placement: 'form',
          }
        )
      ),
    };
  };
  if (!post?.links?.actions && post?.label) {
    buttons = [
      {
        label: post.label,
        type: 'post',
        href: '',
      },
    ];
  }

  return {
    websiteText: post?.url ? new URL(post.url).hostname : '',
    websiteUrl: post?.url,
    title: post?.title || '',
    description: post?.description || '',
    image: post?.icon ? proxify(post.icon, true) : '',
    buttons: buttons.map(asButtonProps),
    inputs: inputs.map((i) => asInputProps(i.parameters![0], i)),
    form: form ? asFormProps(form) : undefined,
    securityState: 'trusted',
    supportability: {
      isSupported: true,
    },
    error: '',
    ...{},
  };
};
