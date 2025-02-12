import { ApplyLabelEditOperation } from '@eclipse-glsp/protocol';
import {
  Command,
  GEdge,
  GLSPServerError,
  GLabel,
  GNode,
  JsonOperationHandler,
  MaybePromise,
  toTypeGuard
} from '@eclipse-glsp/server/node';

import { DynamicGModelSerializer } from '../../model/dynamic-gmodel-serializer';
import { DynamicModelState } from '../../model/dynamic-model-state';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamicApplyLabelEditOperationHandler extends JsonOperationHandler {
  readonly operationType = ApplyLabelEditOperation.KIND;

  @inject(DynamicModelState)
  protected override modelState!: DynamicModelState;

  @inject(DynamicGModelSerializer)
  protected gModelSerializer!: DynamicGModelSerializer;

  override createCommand(operation: ApplyLabelEditOperation): MaybePromise<Command | undefined> {
    return this.commandOf(() => {
      const index = this.modelState.index;

      // retrieve the GLabel that should be edited
      const gLabel = index.find(operation.labelId, toTypeGuard(GLabel));

      // retrieve the parent GNode or GEdge of the label that should be edited
      const gNode = index.findParentElement(operation.labelId, toTypeGuard(GNode));
      const gEdge = index.findParentElement(operation.labelId, toTypeGuard(GEdge));

      // retrieve the model element that corresponds to the parent GNode or GEdge
      const modelElement = gNode ? index.findNode(gNode.id) : gEdge ? index.findEdge(gEdge.id) : undefined;

      // if the model element was found, update its name with the new text, otherwise throw an error
      if (modelElement) {
        // set the new text of the label in the model by using the textBind argument
        try {
          this.gModelSerializer.setBindingVariable(
            modelElement.model,
            gLabel?.args?.['textBind'] as string,
            operation.text
          );
        } catch (error) {
          throw new GLSPServerError(
            `Could not retrieve the binding variable for the label with id ${operation.labelId}`
          );
        }
      } else {
        throw new GLSPServerError(`Could not retrieve the parent node for the label with id ${operation.labelId}`);
      }
    });
  }
}
