import {
  Args,
  Command,
  CreateNodeOperation,
  DefaultTypes,
  GModelSerializer,
  GhostElement,
  JsonCreateNodeOperationHandler,
  MaybePromise,
  Point,
  TriggerNodeCreationAction
} from '@eclipse-glsp/server';

import { DynamicGModelFactory } from '../../model/dynamic-gmodel-factory';
import { DynamicLanguageSpecification } from '../../model/dynamic-language-specification';
import { Node } from '../../model/dynamic-model';
import { DynamicModelState } from '../../model/dynamic-model-state';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';

@injectable()
export class DynamicCreateNodeOperationHandler extends JsonCreateNodeOperationHandler {
  elementTypeIds = [DefaultTypes.NODE];

  @inject(DynamicModelState)
  protected override modelState!: DynamicModelState;

  @inject(GModelSerializer)
  protected serializer!: GModelSerializer;

  @inject(DynamicGModelFactory)
  protected modelFactory!: DynamicGModelFactory;

  @inject(DynamicLanguageSpecification)
  protected languageSpecification!: DynamicLanguageSpecification;

  override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
    return this.commandOf(() => {
      // if nodeType comes as node subtype, it is necessary to remove the prefix
      const nodeType = (operation.args?.nodeType as string)?.replace('node:', '') ?? DefaultTypes.NODE;
      const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
      const node = this.createNode(nodeType, relativeLocation);
      this.modelState.sourceModel.nodes.push(node);
    });
  }

  protected createNode(nodeType: string, position?: Point): Node {
    return {
      id: uuid.v4(),
      type: nodeType,
      position: position ?? Point.ORIGIN,
      size: { width: 50, height: 25 },
      model: undefined
    };
  }

  override getTriggerActions(): TriggerNodeCreationAction[] {
    this.elementTypeIds = Object.keys(this.languageSpecification.language?.nodes) ?? this.elementTypeIds;
    return this.elementTypeIds.map((elementTypeId) => this.createTriggerNodeCreationAction(elementTypeId));
  }

  protected override createTriggerNodeCreationAction(elementTypeId: string): TriggerNodeCreationAction {
    return TriggerNodeCreationAction.create(DefaultTypes.NODE, {
      ghostElement: this.createTriggerGhostElement(elementTypeId),
      args: this.createTriggerArgs(elementTypeId)
    });
  }

  protected override createTriggerArgs(elementTypeId: string): Args | undefined {
    return { nodeType: elementTypeId, label: this.languageSpecification?.language?.nodes?.[elementTypeId]?.label };
  }

  protected override createTriggerGhostElement(elementTypeId: string): GhostElement | undefined {
    return {
      template: this.serializer.createSchema(this.modelFactory.createNode(this.createNode(elementTypeId))),
      dynamic: true
    };
  }

  get label(): string {
    return 'Node';
  }
}
