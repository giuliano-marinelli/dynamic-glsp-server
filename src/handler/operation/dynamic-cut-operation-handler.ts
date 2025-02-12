import {
  ActionDispatcher,
  Command,
  CutOperation,
  DeleteElementOperation,
  JsonOperationHandler,
  MaybePromise
} from '@eclipse-glsp/server';

import { inject, injectable } from 'inversify';

@injectable()
export class DynamicCutOperationHandler extends JsonOperationHandler {
  readonly operationType = CutOperation.KIND;

  @inject(ActionDispatcher)
  protected actionDispatcher!: ActionDispatcher;

  createCommand(operation: CutOperation): MaybePromise<Command | undefined> {
    // get the selected element ids from the operation
    const cuttableElementIds = operation.editorContext.selectedElementIds;
    // if we have cuttable elements we dispatch a DeleteElementOperation otherwise do nothing
    if (cuttableElementIds.length > 0) {
      this.actionDispatcher.dispatch(DeleteElementOperation.create(cuttableElementIds));
    }
    return undefined;
  }
}
