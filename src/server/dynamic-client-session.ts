import { ActionDispatcher, DefaultClientSession } from '@eclipse-glsp/server';

import { Container } from 'inversify';

import { MessageConnectionAuth } from './dynamic-websocket-server-launcher';

export interface AuthClientSession {
  readonly connectionAuth: MessageConnectionAuth;
}

export class DynamicClientSession extends DefaultClientSession implements AuthClientSession {
  constructor(
    readonly id: string,
    readonly diagramType: string,
    readonly actionDispatcher: ActionDispatcher,
    readonly container: Container,
    readonly connectionAuth: MessageConnectionAuth
  ) {
    super(id, diagramType, actionDispatcher, container);
  }
}
