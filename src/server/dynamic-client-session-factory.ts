import {
  ClientSession,
  DefaultClientSession,
  DefaultClientSessionFactory,
  InitializeClientSessionParameters
} from '@eclipse-glsp/server';

import { injectable } from 'inversify';

import { DynamicClientSession } from './dynamic-client-session';
import { MessageConnectionAuth } from './dynamic-websocket-server-launcher';

@injectable()
export class DynamicClientSessionFactory extends DefaultClientSessionFactory {
  override create(params: InitializeClientSessionParameters): ClientSession {
    const clientSession: DefaultClientSession = super.create(params);
    return new DynamicClientSession(
      clientSession.id,
      clientSession.diagramType,
      clientSession.actionDispatcher,
      clientSession.container,
      {
        auth: params.args?.auth as string,
        userAgent: params.args?.userAgent as string,
        ip: params.args?.ip as string
      } as MessageConnectionAuth
    );
  }
}
