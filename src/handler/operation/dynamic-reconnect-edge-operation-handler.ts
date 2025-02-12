import {
  Command,
  GLSPServerError,
  JsonOperationHandler,
  MaybePromise,
  ReconnectEdgeOperation
} from '@eclipse-glsp/server';

import { DynamicModelState } from '../../model/dynamic-model-state';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamicReconnectEdgeOperationHandler extends JsonOperationHandler {
  readonly operationType = ReconnectEdgeOperation.KIND;

  @inject(DynamicModelState)
  protected override modelState!: DynamicModelState;

  createCommand(operation: ReconnectEdgeOperation): MaybePromise<Command | undefined> {
    return this.commandOf(() => {
      if (!operation.edgeElementId || !operation.sourceElementId || !operation.targetElementId) {
        throw new GLSPServerError('Incomplete reconnect connection action');
      }

      const index = this.modelState.index;

      const modelEdge = index.findEdge(operation.edgeElementId);
      const modelSourceNode = index.findNode(operation.sourceElementId);
      const modelTargetNode = index.findNode(operation.targetElementId);

      if (!modelEdge) {
        throw new Error(`Invalid edge: edge ID ${operation.edgeElementId}`);
      }
      if (!modelSourceNode) {
        throw new Error(`Invalid source: source ID ${operation.sourceElementId}`);
      }
      if (!modelTargetNode) {
        throw new Error(`Invalid target: target ID ${operation.targetElementId}`);
      }

      modelEdge.sourceId = modelSourceNode.id;
      modelEdge.targetId = modelTargetNode.id;
      //   modelEdge.routingPoints = [];
    });
  }
}
