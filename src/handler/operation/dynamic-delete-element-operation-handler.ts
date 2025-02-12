import {
  Command,
  DeleteElementOperation,
  GEdge,
  GNode,
  JsonOperationHandler,
  MaybePromise,
  remove,
  toTypeGuard
} from '@eclipse-glsp/server';

import { Edge, Node } from '../../model/dynamic-model';
import { DynamicModelState } from '../../model/dynamic-model-state';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamicDeleteElementOperationHandler extends JsonOperationHandler {
  readonly operationType = DeleteElementOperation.KIND;

  @inject(DynamicModelState)
  protected override modelState!: DynamicModelState;

  override createCommand(operation: DeleteElementOperation): MaybePromise<Command | undefined> {
    return this.commandOf(() => {
      operation.elementIds.forEach((elementId) => this.delete(elementId));
    });
  }

  protected delete(elementId: string): void {
    const index = this.modelState.index;
    const gModelElement = this.getGModelElementToDelete(elementId);
    const gModelElementId = gModelElement?.id ?? elementId;
    const gEdgeIds = this.getIncomingAndOutgoingEdgeIds(gModelElement);

    [...gEdgeIds, gModelElementId]
      .map((id) => index.findNodeOrEdge(id))
      .forEach((modelElement) => this.deleteModelElement(modelElement));
  }

  private getGModelElementToDelete(elementId: string): GNode | GEdge | undefined {
    const index = this.modelState.index;
    const element = index.get(elementId);
    if (element instanceof GNode || element instanceof GEdge) {
      return element;
    }
    return (
      index.findParentElement(elementId, toTypeGuard(GNode)) ?? index.findParentElement(elementId, toTypeGuard(GEdge))
    );
  }

  protected getIncomingAndOutgoingEdgeIds(node: GNode | GEdge | undefined): string[] {
    return this.getIncomingAndOutgoingEdges(node).map((edge) => edge.id);
  }

  protected getIncomingAndOutgoingEdges(node: GNode | GEdge | undefined): GEdge[] {
    if (node instanceof GNode) {
      return [...this.modelState.index.getIncomingEdges(node), ...this.modelState.index.getOutgoingEdges(node)];
    }
    return [];
  }

  private deleteModelElement(modelElement: Node | Edge | undefined): void {
    if (Node.is(modelElement)) {
      remove(this.modelState.sourceModel.nodes, modelElement);
    } else if (Edge.is(modelElement)) {
      remove(this.modelState.sourceModel.edges, modelElement);
    }
  }
}
