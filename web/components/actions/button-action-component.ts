import { ActionPostRequest, TypedActionParameter } from '@solana/actions-spec';
import { AbstractActionComponent } from './abstract-action-component';
import { Action } from './action';

export class ButtonActionComponent extends AbstractActionComponent {
  constructor(
    protected _parent: Action | null,
    protected _label: string,
    protected _href: string,
    protected _parameters?: TypedActionParameter[],
    protected _parentComponent?: AbstractActionComponent
  ) {
    super(_parent, _label, _href, _parameters);
  }

  get parentComponent() {
    return this._parentComponent ?? null;
  }

  protected buildBody(account: string): ActionPostRequest {
    return { account };
  }

  get href(): string {
    return this._href;
  }
}
