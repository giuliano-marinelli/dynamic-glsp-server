import {
  ChangeRoutingPointsOperation,
  Command,
  GLSPServerError,
  JsonOperationHandler,
  MaybePromise
} from '@eclipse-glsp/server';

import { DynamicModelState } from '../../model/dynamic-model-state';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamicChangeRoutingPointsOperationHandler extends JsonOperationHandler {
  readonly operationType = ChangeRoutingPointsOperation.KIND;

  @inject(DynamicModelState)
  protected override modelState!: DynamicModelState;

  createCommand(operation: ChangeRoutingPointsOperation): MaybePromise<Command | undefined> {
    return this.commandOf(() => {
      if (!operation.newRoutingPoints) {
        throw new GLSPServerError('Incomplete change routing points action');
      }

      const index = this.modelState.index;

      operation.newRoutingPoints.forEach((routingPoints) => {
        const modelEdge = index.findEdge(routingPoints.elementId);
        if (modelEdge) {
          modelEdge.routingPoints = routingPoints.newRoutingPoints;
        } else {
          throw new GLSPServerError(
            `Could not retrieve the edge for the routing points with id ${routingPoints.elementId}`
          );
        }
      });
    });
  }
}
