import {
  ActionHandlerConstructor,
  BindingTarget,
  ComputedBoundsActionHandler,
  DiagramConfiguration,
  DiagramModule,
  GModelFactory,
  GModelIndex,
  GModelSerializer,
  InstanceMultiBinding,
  LabelEditValidator,
  ModelState,
  OperationHandlerConstructor,
  SourceModelStorage,
  ToolPaletteItemProvider,
  applyBindingTarget
} from '@eclipse-glsp/server';

import { DynamicLoadLanguageSpecificationActionHandler } from '../handler/action/dynamic-load-language-specification-action-handler';
import { DynamicRequestClipboardDataActionHandler } from '../handler/action/dynamic-request-clipboard-data-action-handler';
import { DynamicApplyLabelEditOperationHandler } from '../handler/operation/dynamic-apply-label-edit-operation-handler';
import { DynamicChangeBoundsOperationHandler } from '../handler/operation/dynamic-change-bounds-operation-handler';
import { DynamicChangeRoutingPointsOperationHandler } from '../handler/operation/dynamic-change-routing-points-operation-handler';
import { DynamicCreateEdgeOperationHandler } from '../handler/operation/dynamic-create-edge-operation-handler';
import { DynamicCreateNodeOperationHandler } from '../handler/operation/dynamic-create-node-operation-handler';
import { DynamicCutOperationHandler } from '../handler/operation/dynamic-cut-operation-handler';
import { DynamicDeleteElementOperationHandler } from '../handler/operation/dynamic-delete-element-operation-handler';
import { DynamicChangeModelOperationHandler } from '../handler/operation/dynamic-model-change-operation-handler';
import { DynamicRefreshModelOperationHandler } from '../handler/operation/dynamic-model-refresh-operation-handler';
import { DynamicPasteOperationHandler } from '../handler/operation/dynamic-paste-operation-handler';
import { DynamicReconnectEdgeOperationHandler } from '../handler/operation/dynamic-reconnect-edge-operation-handler';
import { DynamicLabelEditValidator } from '../handler/validator/dynamic-label-edit-validator';
import { DynamicGModelFactory } from '../model/dynamic-gmodel-factory';
import { DynamicGModelSerializer } from '../model/dynamic-gmodel-serializer';
import { DynamicLanguageSpecification, LanguageSpecification } from '../model/dynamic-language-specification';
import { DynamicModelIndex } from '../model/dynamic-model-index';
import { DynamicModelState } from '../model/dynamic-model-state';
import { DynamicStorage } from '../model/dynamic-storage';
import { DynamicToolPaletteItemProvider } from '../provider/dynamic-tool-palette-item-provider';
import { DynamicDiagramConfiguration } from './dynamic-diagram-configuration';
import { ExternalServices } from './dynamic-external-services';
import { injectable, interfaces } from 'inversify';

@injectable()
export class DynamicDiagramModule extends DiagramModule {
  readonly diagramType = 'dynamic';
  readonly services: ExternalServices;

  constructor(services: ExternalServices) {
    super();
    this.services = services;
  }

  // redefine the configure method to bind the dynamic language specification
  protected configure(
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): void {
    const context = { bind, isBound };

    // bind the injectable external services (it can provide access to services outside GLSP)
    bind(ExternalServices).toConstantValue(this.services);

    // bind the injectable for dynamic language specification
    applyBindingTarget(context, LanguageSpecification, this.bindLanguageSpecification()).inSingletonScope();

    // call the base class configure method
    super.configure(bind, unbind, isBound, rebind);
  }

  protected bindLanguageSpecification(): BindingTarget<LanguageSpecification> {
    return { service: DynamicLanguageSpecification };
  }

  /**
   * Bind the diagram configuration which is used to define the diagram elements behaviour and restrictions.
   */
  protected bindDiagramConfiguration(): BindingTarget<DiagramConfiguration> {
    return { service: DynamicDiagramConfiguration };
  }

  protected bindSourceModelStorage(): BindingTarget<SourceModelStorage> {
    return DynamicStorage;
  }

  protected bindModelState(): BindingTarget<ModelState> {
    return { service: DynamicModelState };
  }

  protected bindGModelFactory(): BindingTarget<GModelFactory> {
    return { service: DynamicGModelFactory };
  }

  protected bindGModelSerializer(): BindingTarget<GModelSerializer> {
    return { service: DynamicGModelSerializer };
  }

  protected override bindGModelIndex(): BindingTarget<GModelIndex> {
    this.context.bind(DynamicModelIndex).toSelf().inSingletonScope();
    return { service: DynamicModelIndex };
  }

  protected override bindToolPaletteItemProvider(): BindingTarget<ToolPaletteItemProvider> | undefined {
    return DynamicToolPaletteItemProvider;
  }

  protected override bindLabelEditValidator(): BindingTarget<LabelEditValidator> | undefined {
    return DynamicLabelEditValidator;
  }

  //   protected override bindCommandPaletteActionProvider(): BindingTarget<CommandPaletteActionProvider> | undefined {
  //     return CommandPaletteActionProvider;
  //   }

  protected override configureActionHandlers(binding: InstanceMultiBinding<ActionHandlerConstructor>): void {
    super.configureActionHandlers(binding);
    binding.add(ComputedBoundsActionHandler);
    binding.add(DynamicRequestClipboardDataActionHandler);
    binding.add(DynamicLoadLanguageSpecificationActionHandler);
  }

  protected override configureOperationHandlers(binding: InstanceMultiBinding<OperationHandlerConstructor>): void {
    super.configureOperationHandlers(binding);
    binding.add(DynamicRefreshModelOperationHandler);
    binding.add(DynamicChangeModelOperationHandler);
    binding.add(DynamicCreateNodeOperationHandler);
    binding.add(DynamicCreateEdgeOperationHandler);
    binding.add(DynamicDeleteElementOperationHandler);
    binding.add(DynamicChangeBoundsOperationHandler);
    binding.add(DynamicChangeRoutingPointsOperationHandler);
    binding.add(DynamicReconnectEdgeOperationHandler);
    binding.add(DynamicApplyLabelEditOperationHandler);
    binding.add(DynamicCutOperationHandler);
    binding.add(DynamicPasteOperationHandler);
  }
}
