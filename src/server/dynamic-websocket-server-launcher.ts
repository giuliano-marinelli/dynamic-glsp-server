import {
  DisposeClientSessionParameters,
  GLSPServer,
  InitializeClientSessionParameters,
  InitializeParameters,
  JsonRpcServerInstance,
  JsonrpcGLSPClient,
  WebSocketServerLauncher,
  WebSocketServerOptions
} from '@eclipse-glsp/server/node';

import { injectable } from 'inversify';
import { MessageConnection } from 'vscode-jsonrpc';
import { Server } from 'ws';

export interface MessageConnectionAuth {
  /**
   * The auth of the client session.
   */
  auth: string;
  /**
   * The user agent of the client session.
   * This is the value of the `User-Agent` header of the HTTP request.
   */
  userAgent: string;
  /**
   * The ip of the client session.
   * This is the value of the `remoteAddress` of the HTTP request
   */
  ip: string;
}

@injectable()
export class DynamicWebSocketServerLauncher extends WebSocketServerLauncher {
  protected override async run(options: WebSocketServerOptions): Promise<void> {
    const resolvedOptions = await this.resolveOptions(options);
    this.server = new Server({ server: resolvedOptions.server, path: resolvedOptions.path });
    const endpoint = `ws://${resolvedOptions.host}:${resolvedOptions.port}:${resolvedOptions.path}`;
    this.logger.info(`The GLSP Websocket launcher is ready to accept new client requests on endpoint '${endpoint}'`);
    console.log(this.startupCompleteMessage.concat(resolvedOptions.port.toString()));

    this.server.on('connection', (ws, req) => {
      const connection = this.createConnection(ws);

      this.createServerInstance(connection, {
        auth: req.headers['sec-websocket-protocol'],
        userAgent: req.headers['user-agent'],
        ip: req.socket.remoteAddress
      });
    });

    return new Promise((resolve, reject) => {
      this.server.on('close', () => resolve(undefined));
      this.server.on('error', (error) => reject(error));
    });
  }

  protected override createServerInstance(
    clientConnection: MessageConnection,
    connectionAuth?: MessageConnectionAuth
  ): void {
    const container = this.createContainer(this.createJsonRpcModule(clientConnection));
    const server = container.get<GLSPServer>(GLSPServer);
    const instance = { container, clientConnection, server };
    this.serverInstances.set(clientConnection, instance);
    this.configureClientConnection(instance, connectionAuth);
  }

  protected override configureClientConnection(
    serverInstance: JsonRpcServerInstance,
    connectionAuth?: MessageConnectionAuth
  ): void {
    const { clientConnection, server } = serverInstance;

    clientConnection.onRequest(JsonrpcGLSPClient.InitializeRequest.method, (params: InitializeParameters) =>
      server.initialize(params)
    );
    clientConnection.onRequest(
      JsonrpcGLSPClient.InitializeClientSessionRequest,
      (params: InitializeClientSessionParameters) => {
        // adds the connectionAuth to the args if it's available
        if (connectionAuth) {
          params.args = { ...params.args, ...connectionAuth };
        }
        server.initializeClientSession(params);
      }
    );
    clientConnection.onRequest(
      JsonrpcGLSPClient.DisposeClientSessionRequest,
      (params: DisposeClientSessionParameters) => server.disposeClientSession(params)
    );
    clientConnection.onNotification(JsonrpcGLSPClient.ActionMessageNotification, (message) => server.process(message));

    clientConnection.listen();

    serverInstance.clientConnection.onNotification(JsonrpcGLSPClient.ShutdownNotification, () =>
      this.disposeServerInstance(serverInstance)
    );

    this.logger.info('Starting GLSP server connection');
  }
}
