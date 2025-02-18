import { Language, SaveModelAction } from '@dynamic-glsp/protocol';
import { AbstractJsonModelStorage, GLSPServerError, RequestModelAction } from '@eclipse-glsp/server/node';

import { ExternalServices } from '../diagram/dynamic-external-services';
import { AuthClientAction } from '../server/dynamic-auth-client-action';
import { DynamicLanguageSpecification } from './dynamic-language-specification';
import { DynamicModel } from './dynamic-model';
import { DynamicModelState } from './dynamic-model-state';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';

@injectable()
export class DynamicStorage extends AbstractJsonModelStorage {
  @inject(DynamicModelState)
  protected override modelState: DynamicModelState;

  @inject(DynamicLanguageSpecification)
  protected languageSpecification: DynamicLanguageSpecification;

  @inject(ExternalServices)
  protected services: ExternalServices;

  async loadSourceModel(action: RequestModelAction & AuthClientAction): Promise<void> {
    const { connectionAuth } = action;
    const sourceUri = this.getSourceUri(action);

    if (!this.services.modelProvider) {
      throw new GLSPServerError('No model provider was defined');
    }

    const language = this.languageSpecification.language;

    // if language specification has a "showcase" create a model for showcase
    // else language is not for showcase, use the model provider to get the model
    const model =
      language.id == 'showcase'
        ? this.createModelForShowcase(language)
        : await this.services.modelProvider(sourceUri, connectionAuth);

    // update the source model with the new model
    if (language.id != 'showcase' || !this.modelState.sourceModel) this.modelState.updateSourceModel(model);
  }

  async saveSourceModel(action: SaveModelAction & AuthClientAction): Promise<void> {
    const { connectionAuth, preview } = action;
    const sourceUri = this.getFileUri(action);
    const model = this.modelState.sourceModel;

    if (!this.services.modelSaver) {
      throw new GLSPServerError('No model saver was defined');
    }

    // use the model saver to save the model
    await this.services.modelSaver(sourceUri, model, preview, connectionAuth);
  }

  protected override createModelForEmptyFile(): DynamicModel {
    return {
      id: uuid.v4(),
      nodes: [],
      edges: []
    };
  }

  protected createModelForShowcase(language: Language): DynamicModel {
    const model = { id: 'showcase', nodes: [], edges: [] };

    const showcaseNode = Object.values(language.nodes)[0];
    const showcaseEdge = Object.values(language.edges)[0];

    if (showcaseNode && !showcaseEdge) {
      // create showcase node to the model
      const node = {
        id: 'showcase_element',
        type: 'showcaseNode',
        position: { x: 0, y: 0 },
        size: { width: 50, height: 25 }
      };
      model.nodes.push(node);
    } else if (showcaseEdge) {
      // create source and target showcase nodes to the model
      const sourceNode = {
        id: 'source',
        type: 'showcaseNode',
        position: { x: 0, y: 40 },
        size: { width: 0, height: 0 }
      };
      const targetNode = {
        id: 'target',
        type: 'showcaseNode',
        position: { x: 60, y: 0 },
        size: { width: 0, height: 0 }
      };
      // create showcase edge between source and target nodes
      const edge = {
        id: 'showcase_element',
        type: 'showcaseEdge',
        sourceId: 'source',
        targetId: 'target'
      };

      model.nodes.push(sourceNode, targetNode);
      model.edges.push(edge);
    }

    return model;
  }
}
