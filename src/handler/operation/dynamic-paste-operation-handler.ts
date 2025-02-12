import { Command, JsonOperationHandler, MaybePromise, PasteOperation, Point } from '@eclipse-glsp/server';

import { Edge, Node } from '../../model/dynamic-model';
import { DynamicModelState } from '../../model/dynamic-model-state';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';

@injectable()
export class DynamicPasteOperationHandler extends JsonOperationHandler {
  readonly operationType = PasteOperation.KIND;

  @inject(DynamicModelState)
  protected override modelState!: DynamicModelState;

  protected readonly DEFAULT_OFFSET = 0;

  createCommand(operation: PasteOperation): MaybePromise<Command | undefined> {
    const elements = JSON.parse(operation.clipboardData['application/json']);

    return elements.length
      ? this.commandOf(() => {
          const dynamicModel = this.modelState.sourceModel;

          const centerOfBounds = this.getCenterOfBounds(elements);

          const nodesIds: string[] = [];

          // add each node to the model with a new id, update edges, and remove the node from the elements array
          for (let i = elements.length - 1; i >= 0; i--) {
            if (Node.is(elements[i])) {
              // preserve previous id of the pasted node
              const prevId = elements[i].id;

              // update id of the pasted node
              elements[i].id = uuid.v4();

              // relocate the pasted node to the mouse position
              elements[i].position = this.getPositionOffset(
                [elements[i].position],
                centerOfBounds,
                operation.editorContext.lastMousePosition!,
                this.DEFAULT_OFFSET
              )[0];

              dynamicModel.nodes.push(elements[i]);

              // update edges sourceId and targetId if they are connected to the pasted node
              for (let j = 0; j < elements.length; j++) {
                if (Edge.is(elements[j])) {
                  if (elements[j].sourceId === prevId) elements[j].sourceId = elements[i].id;
                  if (elements[j].targetId === prevId) elements[j].targetId = elements[i].id;
                }
              }

              // collect the added nodes ids
              nodesIds.push(elements[i].id);

              // remove the pasted node from the elements
              elements.splice(i, 1);
            }
          }

          // add the remaining edges to the model with a new id
          elements.forEach((element: any) => {
            if (Edge.is(element)) {
              // update id of the pasted edge
              element.id = uuid.v4();

              // update routing points of the pasted edge
              element.routingPoints = this.getPositionOffset(
                element.routingPoints!,
                centerOfBounds,
                operation.editorContext.lastMousePosition!,
                this.DEFAULT_OFFSET
              );

              // check if the sourceId or targetId of the pasted edge is connected to the pasted nodes
              // if so, add the edge to the model
              if (nodesIds.includes(element.sourceId) && nodesIds.includes(element.targetId))
                dynamicModel.edges.push(element);
            }
          });
        })
      : undefined;
  }

  /**
   * Get the center of the bounds of the pasted elements
   * @param elements the elements that are pasted
   * @returns the center of the bounds
   *
   **/
  protected getCenterOfBounds(elements: any): Point {
    // get the min and max x and y of the elements bounds
    let minPoint = { x: Number.MAX_VALUE, y: Number.MAX_VALUE };
    let maxPoint = { x: Number.MIN_VALUE, y: Number.MIN_VALUE };
    elements.forEach((element: any) => {
      if (Node.is(element)) {
        const position = element.position ?? Point.ORIGIN;
        minPoint = { x: Math.min(minPoint.x, position.x), y: Math.min(minPoint.y, position.y) };
        maxPoint = { x: Math.max(maxPoint.x, position.x), y: Math.max(maxPoint.y, position.y) };
      }
    });

    // get the middle point of the bounds
    const middlePoint = { x: (minPoint.x + maxPoint.x) / 2, y: (minPoint.y + maxPoint.y) / 2 };

    return middlePoint;
  }

  /**
   * Get the position offset of the pasted elements
   *
   * @param positions the positions of the pasted elements
   * @param centerOfBounds the center of the bounds of the pasted elements
   * @param mousePosition the position of the mouse where will be located the pasted elements
   * @param offset additional offset to the position
   * @returns the position offset
   *
   **/
  protected getPositionOffset(
    positions: Point[],
    centerOfBounds: Point,
    mousePosition: Point,
    offset: number
  ): Point[] {
    return (
      positions?.map((position) => {
        return {
          x: (position.x ?? Point.ORIGIN.x) - centerOfBounds.x + mousePosition.x + offset,
          y: (position.y ?? Point.ORIGIN.y) - centerOfBounds.y + mousePosition.y + offset
        };
      }) ?? []
    );
  }
}
