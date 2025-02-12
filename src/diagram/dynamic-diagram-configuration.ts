import {
  DefaultTypes,
  DiagramConfiguration,
  EdgeTypeHint,
  GButton,
  GCompartment,
  GEdge,
  GGraph,
  GHtmlRoot,
  GIssueMarker,
  GLabel,
  GModelElement,
  GModelElementConstructor,
  GNode,
  GPort,
  GPreRenderedElement,
  GShapedPreRenderedElement,
  ServerLayoutKind,
  ShapeTypeHint,
} from "@eclipse-glsp/server";

import { DynamicTypes, GDecision, GIteration } from "@dynamic-glsp/protocol";
import { injectable } from "inversify";

@injectable()
export class DynamicDiagramConfiguration implements DiagramConfiguration {
  layoutKind = ServerLayoutKind.MANUAL;
  needsClientLayout = true;
  animatedUpdate = true;

  get typeMapping(): Map<string, GModelElementConstructor<GModelElement>> {
    const mapping = new Map<string, GModelElementConstructor>();
    mapping.set(DefaultTypes.GRAPH, GGraph);
    mapping.set(DefaultTypes.NODE, GNode);
    mapping.set(DefaultTypes.EDGE, GEdge);
    mapping.set(DefaultTypes.PORT, GPort);
    mapping.set(DefaultTypes.LABEL, GLabel);
    mapping.set(DefaultTypes.COMPARTMENT, GCompartment);
    mapping.set(DefaultTypes.BUTTON, GButton);
    mapping.set(DefaultTypes.ISSUE_MARKER, GIssueMarker);

    mapping.set(DefaultTypes.HTML, GHtmlRoot);
    mapping.set(DefaultTypes.PRE_RENDERED, GPreRenderedElement);
    mapping.set(DefaultTypes.FOREIGN_OBJECT, GShapedPreRenderedElement);

    // add dynamic types
    mapping.set(DynamicTypes.ITERATION, GIteration);
    mapping.set(DynamicTypes.DECISION, GDecision);

    return mapping;
  }

  get shapeTypeHints(): ShapeTypeHint[] {
    return [
      {
        elementTypeId: DefaultTypes.NODE,
        deletable: true,
        reparentable: false,
        repositionable: true,
        resizable: true,
      },
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
        targetElementTypeIds: [DefaultTypes.NODE],
      },
    ];
  }
}
