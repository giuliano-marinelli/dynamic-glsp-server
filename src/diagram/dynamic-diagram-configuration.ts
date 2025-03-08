import { DynamicTypes, GDecision, GIteration, GShape } from '@dynamic-glsp/protocol';
import {
  DefaultTypes,
  DiagramConfiguration,
  EdgeTypeHint,
  GButton,
  GCompartment,
  GEdge,
  GForeignObjectElement,
  GGraph,
  GHtmlRoot,
  GIssueMarker,
  GLabel,
  GModelElement,
  GModelElementConstructor,
  GNode,
  GPort,
  ServerLayoutKind,
  ShapeTypeHint
} from '@eclipse-glsp/server';

import { DynamicLanguageSpecification } from '../model/dynamic-language-specification';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamicDiagramConfiguration implements DiagramConfiguration {
  @inject(DynamicLanguageSpecification)
  protected languageSpecification: DynamicLanguageSpecification;

  layoutKind = ServerLayoutKind.MANUAL;
  needsClientLayout = true;
  animatedUpdate = true;

  get typeMapping(): Map<string, GModelElementConstructor<GModelElement>> {
    const mapping = new Map<string, GModelElementConstructor>();

    // adecuated types
    mapping.set(DefaultTypes.GRAPH, GGraph);
    mapping.set(DefaultTypes.NODE, GNode);
    mapping.set(DefaultTypes.EDGE, GEdge);
    mapping.set(DefaultTypes.COMPARTMENT, GCompartment);
    mapping.set(DefaultTypes.LABEL, GLabel);

    // non-adequated types
    mapping.set(DefaultTypes.PORT, GPort);
    mapping.set(DefaultTypes.BUTTON, GButton);
    mapping.set(DefaultTypes.ISSUE_MARKER, GIssueMarker);

    // others
    mapping.set(DefaultTypes.HTML, GHtmlRoot);
    mapping.set(DefaultTypes.FOREIGN_OBJECT, GForeignObjectElement);

    // add dynamic types
    mapping.set(DynamicTypes.ITERATION, GIteration);
    mapping.set(DynamicTypes.DECISION, GDecision);
    mapping.set(DynamicTypes.SHAPE, GShape);

    // add language specification types
    if (this.languageSpecification?.language?.nodes) {
      Object.keys(this.languageSpecification.language.nodes).forEach((nodeType) => {
        mapping.set(`node:${nodeType}`, GNode);
      });
    }

    if (this.languageSpecification?.language?.edges) {
      Object.keys(this.languageSpecification.language.edges).forEach((edgeType) => {
        mapping.set(`edge:${edgeType}`, GEdge);
      });
    }

    return mapping;
  }

  get shapeTypeHints(): ShapeTypeHint[] {
    // use language specification to get the shape type hints for each node type
    if (!this.languageSpecification?.language?.nodes) return [];
    return Object.keys(this.languageSpecification.language.nodes).map((nodeType) => {
      const nodeSpec = this.languageSpecification.language.nodes[nodeType];
      return {
        elementTypeId: `node:${nodeType}`,
        resizable: !nodeSpec.gModel?.layoutOptions?.resizable ? false : true,
        reparentable: true,
        repositionable: true,
        deletable: true
      };
    });
  }

  get edgeTypeHints(): EdgeTypeHint[] {
    // use language specification to get edge types and return an edge type hint for each constraint in each edge
    if (!this.languageSpecification?.language?.edges) return [];
    const edgeTypeHints: EdgeTypeHint[] = [];
    Object.keys(this.languageSpecification.language.edges).forEach((edgeType) => {
      const edgeSpec = this.languageSpecification.language.edges[edgeType];
      edgeSpec.constraints?.forEach((constraint) => {
        edgeTypeHints.push({
          elementTypeId: `edge:${edgeType}`,
          sourceElementTypeIds: constraint.source.map((source) => `node:${source}`),
          targetElementTypeIds: constraint.target.map((target) => `node:${target}`),
          deletable: true,
          repositionable: true,
          routable: true
        });
      });
    });

    return edgeTypeHints;
  }
}
