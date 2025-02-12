import { GEdge, GGraph, GLSPServerError, GModelFactory, GNode } from '@eclipse-glsp/server';

import { DynamicGModelSerializer } from './dynamic-gmodel-serializer';
import { DynamicLanguageSpecification } from './dynamic-language-specification';
import { Edge, Node } from './dynamic-model';
import { DynamicModelState } from './dynamic-model-state';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamicGModelFactory implements GModelFactory {
  @inject(DynamicModelState)
  protected modelState!: DynamicModelState;

  @inject(DynamicLanguageSpecification)
  protected languageSpecification!: DynamicLanguageSpecification;

  @inject(DynamicGModelSerializer)
  protected gModelSerializer!: DynamicGModelSerializer;

  createModel(): void {
    const dynamicModel = this.modelState.sourceModel;
    this.modelState.index.indexModel(dynamicModel);

    const childNodes = dynamicModel.nodes.map((node) => this.createNode(node));
    const childEdges = dynamicModel.edges.map((edge) => this.createEdge(edge));

    const newRoot = GGraph.builder().id(dynamicModel.id).addChildren(childNodes).addChildren(childEdges).build();

    this.modelState.updateRoot(newRoot);
  }

  createNode(node: Node): GNode {
    // make a copy of the node specification from the language specification
    const nodeSpec = node.type
      ? JSON.parse(JSON.stringify(this.languageSpecification?.language?.nodes?.[node.type]))
      : undefined;

    if (!nodeSpec) {
      throw new GLSPServerError(`Node type ${node.type} not found in language specification.`);
    }

    // get the autoincrement value for the node type
    const autoincrement = this.modelState.index.getElements(node.type).length + 1;

    // if the node does not have a model, create a new model with the default values
    if (!node.model) node.model = this.gModelSerializer.processAutoincrement(nodeSpec.default, autoincrement);

    // if the node is the showcase element, process the autoincrement with a fixed value
    if (node.id == 'showcase_element') node.model = this.gModelSerializer.processAutoincrement(nodeSpec.default, 1);

    // set generic gModel properties (this properties can't be setted by the language specification)
    nodeSpec.gModel.id = node.id;
    nodeSpec.gModel.position = node.position;
    nodeSpec.gModel.size = node.size;
    nodeSpec.gModel.layoutOptions = { prefWidth: node.size.width, prefHeight: node.size?.height };
    nodeSpec.gModel.cssClasses = ['node'];

    // set the elementType argument for use in the model index for filtering nodes by type
    if (!nodeSpec.gModel['args']) nodeSpec.gModel['args'] = {};
    nodeSpec.gModel['args']['elementType'] = node.type;
    nodeSpec.gModel['args']['elementLabel'] = nodeSpec.label;

    nodeSpec.gModel['args']['aModel'] = nodeSpec.aModel;
    nodeSpec.gModel['args']['model'] = node.model;

    const gNode = this.gModelSerializer.createElement(nodeSpec.gModel, undefined, node.model) as GNode;

    return gNode;
  }

  createEdge(edge: Edge): GEdge {
    // make a copy of the edge specification from the language specification
    const edgeSpec = edge.type
      ? JSON.parse(JSON.stringify(this.languageSpecification?.language?.edges?.[edge.type]))
      : undefined;

    if (!edgeSpec) {
      throw new GLSPServerError(`Edge type ${edge.type} not found in language specification.`);
    }

    // get the autoincrement value for the edge type
    const autoincrement = this.modelState.index.getElements(edge.type).length + 1;

    // if the edge does not have a model, create a new model with the default values
    if (!edge.model) edge.model = this.gModelSerializer.processAutoincrement(edgeSpec.default, autoincrement);

    // if the edge is the showcase element, process the autoincrement with a fixed value
    if (edge.id == 'showcase_element') edge.model = this.gModelSerializer.processAutoincrement(edgeSpec.default, 1);

    // set generic gModel properties (this properties can't be setted by the language specification)
    edgeSpec.gModel.id = edge.id;
    edgeSpec.gModel.sourceId = edge.sourceId;
    edgeSpec.gModel.targetId = edge.targetId;
    edgeSpec.gModel.cssClasses = ['edge'];
    edgeSpec.gModel.routingPoints = edge.routingPoints ?? [];

    // set the elementType argument for use in the model index for filtering edges by type
    if (!edgeSpec.gModel['args']) edgeSpec.gModel['args'] = {};
    edgeSpec.gModel['args']['elementType'] = edge.type;
    edgeSpec.gModel['args']['elementLabel'] = edgeSpec.label;

    edgeSpec.gModel['args']['aModel'] = edgeSpec.aModel;
    edgeSpec.gModel['args']['model'] = edge.model;

    const gEdge = this.gModelSerializer.createElement(edgeSpec.gModel, undefined, edge.model) as GEdge;

    return gEdge;
  }
}
