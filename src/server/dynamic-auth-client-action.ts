import { Action } from '@eclipse-glsp/server';

import { MessageConnectionAuth } from './dynamic-websocket-server-launcher';

/**
 * A helper interface that allows the server to mark actions that have been received from authenticated client.
 */
export interface AuthClientAction extends Action {
  __receivedFromClient: true;
  connectionAuth: MessageConnectionAuth;
}

export namespace AuthClientAction {
  export function is(object: unknown): object is AuthClientAction {
    return (
      Action.is(object) &&
      '__receivedFromClient' in object &&
      object.__receivedFromClient === true &&
      'connectionAuth' in object
    );
  }

  /**
   * Mark the given action as {@link AuthClientAction} by attaching the "__receivedFromClient" property
   * and the connectionAuth property
   * @param action The action that should be marked as client action
   * @param connectionAuth The connectionAuth of the client session
   */
  export function mark(action: Action, connectionAuth: MessageConnectionAuth): void {
    (action as AuthClientAction).__receivedFromClient = true;
    (action as AuthClientAction).connectionAuth = connectionAuth;
  }
}
