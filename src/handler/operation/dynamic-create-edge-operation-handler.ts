import {
  Args,
  Command,
  CreateEdgeOperation,
  DefaultTypes,
  JsonCreateEdgeOperationHandler,
  MaybePromise,
  TriggerEdgeCreationAction
} from '@eclipse-glsp/server';

import { DynamicLanguageSpecification } from '../../model/dynamic-language-specification';
import { Edge } from '../../model/dynamic-model';
import { DynamicModelState } from '../../model/dynamic-model-state';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';

@injectable()
export class DynamicCreateEdgeOperationHandler extends JsonCreateEdgeOperationHandler {
  elementTypeIds = [DefaultTypes.EDGE];

  @inject(DynamicModelState)
  protected override modelState!: DynamicModelState;

  @inject(DynamicLanguageSpecification)
  protected languageSpecification!: DynamicLanguageSpecification;

  override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
    return this.commandOf(() => {
      console.log('operation', operation);
      // if edgeType comes as edge subtype, it is necessary to remove the prefix
      const edgeType = (operation.args?.edgeType as string)?.replace('edge:', '') ?? DefaultTypes.EDGE;
      const edge = this.createEdge(edgeType, operation.sourceElementId, operation.targetElementId);
      this.modelState.sourceModel.edges.push(edge);
    });
  }

  protected createEdge(edgeType: string, sourceElementId: string, targetElementId: string): Edge {
    return {
      id: uuid.v4(),
      type: edgeType,
      sourceId: sourceElementId,
      targetId: targetElementId,
      model: undefined
    };
  }

  override getTriggerActions(): TriggerEdgeCreationAction[] {
    this.elementTypeIds = Object.keys(this.languageSpecification.language?.edges) ?? this.elementTypeIds;
    return this.elementTypeIds.map((elementTypeId) =>
      TriggerEdgeCreationAction.create(`edge:${elementTypeId}`, { args: this.createTriggerArgs(elementTypeId) })
    );
  }

  protected createTriggerArgs(elementTypeId: string): Args | undefined {
    return { edgeType: elementTypeId, label: this.languageSpecification.language?.edges?.[elementTypeId]?.label };
  }

  get label(): string {
    return 'Edge';
  }
}
