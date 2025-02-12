import {
  Action,
  ActionHandler,
  ClipboardData,
  MaybePromise,
  RequestClipboardDataAction,
  SetClipboardDataAction
} from '@eclipse-glsp/server';

import { DynamicModelState } from '../../model/dynamic-model-state';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamicRequestClipboardDataActionHandler implements ActionHandler {
  readonly actionKinds = [RequestClipboardDataAction.KIND];

  @inject(DynamicModelState)
  protected modelState!: DynamicModelState;

  execute(action: RequestClipboardDataAction): MaybePromise<Action[]> {
    const index = this.modelState.index;

    const selectedModelElements = action.editorContext.selectedElementIds.map((elementId) => {
      return index.findNodeOrEdge(elementId);
    });

    const clipboardData: ClipboardData = { format: 'application/json' };
    clipboardData['application/json'] = JSON.stringify(selectedModelElements, undefined, 2);

    return [SetClipboardDataAction.create(clipboardData)];
  }
}
