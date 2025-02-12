import { DefaultModelState, JsonModelState } from '@eclipse-glsp/server';

import { inject, injectable } from 'inversify';

import { DynamicModel } from './dynamic-model';
import { DynamicModelIndex } from './dynamic-model-index';

@injectable()
export class DynamicModelState extends DefaultModelState implements JsonModelState<DynamicModel> {
  @inject(DynamicModelIndex)
  override readonly index: DynamicModelIndex;

  protected _model: DynamicModel;

  get sourceModel(): DynamicModel {
    return this._model;
  }

  updateSourceModel(model: DynamicModel): void {
    this._model = model;
    this.index.indexModel(model);
  }
}
