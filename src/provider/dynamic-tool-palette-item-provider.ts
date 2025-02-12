import { CreateOperationHandler, DefaultToolPaletteItemProvider, PaletteItem } from '@eclipse-glsp/server';

import { injectable } from 'inversify';

@injectable()
export class DynamicToolPaletteItemProvider extends DefaultToolPaletteItemProvider {
  override createPaletteItem(handlers: CreateOperationHandler[], kind: string): PaletteItem[] {
    return handlers
      .filter((handler) => handler.operationType === kind)
      .map((handler) =>
        // use the label from the trigger action args if available, otherwise use the handler label
        handler.getTriggerActions().map((action) => this.create(action, action.args?.label ?? handler.label))
      )
      .reduce((accumulator, value) => accumulator.concat(value), [])
      .sort((a, b) => a.sortString.localeCompare(b.sortString));
  }
}
