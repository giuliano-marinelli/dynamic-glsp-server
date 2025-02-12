import { BindingTarget, ClientSessionFactory, GLSPServer, ServerModule } from '@eclipse-glsp/server';

import { DynamicClientSessionFactory } from './dynamic-client-session-factory';
import { DynamicGLSPServer } from './dynamic-glsp-server';

export class DynamicServerModule extends ServerModule {
  protected override bindGLSPServer(): BindingTarget<GLSPServer> {
    return DynamicGLSPServer;
  }

  protected override bindClientSessionFactory(): BindingTarget<ClientSessionFactory> {
    return DynamicClientSessionFactory;
  }
}
