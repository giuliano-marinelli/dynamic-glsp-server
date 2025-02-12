import { ActionMessage, DefaultGLSPServer } from '@eclipse-glsp/server';

import { injectable } from 'inversify';

import { AuthClientAction } from './dynamic-auth-client-action';
import { DynamicClientSession } from './dynamic-client-session';

@injectable()
export class DynamicGLSPServer extends DefaultGLSPServer {
  override process(message: ActionMessage): void {
    this.validateServerInitialized();
    this.logger.info(`process [action=${message.action.kind}, clientId=${message.clientId}]`);
    const clientSessionId = message.clientId;
    const clientSession = this.clientSessions.get(clientSessionId);
    if (!clientSession) {
      throw new Error(`No client session has been initialized for client id: ${clientSessionId}`);
    }
    const action = message.action;

    // add the connectionAuth of the clientSession to the action using the AuthClientAction.mark method
    AuthClientAction.mark(action, (clientSession as DynamicClientSession).connectionAuth);

    clientSession.actionDispatcher.dispatch(action).catch((error) => this.handleProcessError(message, error));
  }
}
