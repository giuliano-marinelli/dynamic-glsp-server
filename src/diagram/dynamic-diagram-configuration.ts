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

import { injectable } from 'inversify';

@injectable()
export class DynamicDiagramConfiguration implements DiagramConfiguration {
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

    return mapping;
  }

  get shapeTypeHints(): ShapeTypeHint[] {
    return [
      {
        elementTypeId: DefaultTypes.NODE,
        deletable: true,
        reparentable: false,
        repositionable: true,
        resizable: true
      }
    ];
  }

  get edgeTypeHints(): EdgeTypeHint[] {
    return [
      {
        elementTypeId: DefaultTypes.EDGE,
        deletable: true,
        repositionable: true,
        routable: true,
        sourceElementTypeIds: [DefaultTypes.NODE],
        targetElementTypeIds: [DefaultTypes.NODE]
      }
    ];
  }
}
