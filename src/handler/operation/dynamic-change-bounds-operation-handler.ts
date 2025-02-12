import {
  ChangeBoundsOperation,
  Command,
  Dimension,
  GNode,
  JsonOperationHandler,
  MaybePromise,
  Point
} from '@eclipse-glsp/server';

import { DynamicModelState } from '../../model/dynamic-model-state';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamicChangeBoundsOperationHandler extends JsonOperationHandler {
  readonly operationType = ChangeBoundsOperation.KIND;

  @inject(DynamicModelState)
  protected override modelState!: DynamicModelState;

  override createCommand(operation: ChangeBoundsOperation): MaybePromise<Command | undefined> {
    return this.commandOf(() => {
      operation.newBounds.forEach((element) =>
        this.changeElementBounds(element.elementId, element.newSize, element.newPosition)
      );
    });
  }

  protected changeElementBounds(elementId: string, newSize: Dimension, newPosition?: Point): void {
    const index = this.modelState.index;
    const gNode = index.findByClass(elementId, GNode);
    const node = gNode ? index.findNode(gNode.id) : undefined;
    if (node) {
      node.size = newSize;
      if (newPosition) {
        node.position = newPosition;
      }
    }
  }
}
