import { AnyObject, Point, hasArrayProp, hasObjectProp, hasStringProp } from '@eclipse-glsp/server';

/**
 * The source model for `dynamic` GLSP diagrams. A `DynamicModel` is a
 * plain JSON objects that contains a set of {@link Node nodes} and {@link Edge edges}.
 */
export interface DynamicModel {
  id: string;
  nodes: Node[];
  edges: Edge[];
}

export namespace DynamicModel {
  export function is(object: any): object is DynamicModel {
    return AnyObject.is(object) && hasStringProp(object, 'id') && hasArrayProp(object, 'nodes');
  }
}

export interface Node {
  type: string;
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  model: any;
}

export namespace Node {
  export function is(object: any): object is Node {
    return (
      AnyObject.is(object) &&
      hasStringProp(object, 'id') &&
      hasObjectProp(object, 'position') &&
      hasObjectProp(object, 'size')
    );
  }
}

export interface Edge {
  type: string;
  id: string;
  sourceId: string;
  targetId: string;
  routingPoints?: Point[];
  model: any;
}

export namespace Edge {
  export function is(object: any): object is Edge {
    return (
      AnyObject.is(object) &&
      hasStringProp(object, 'id') &&
      hasStringProp(object, 'sourceId') &&
      hasStringProp(object, 'targetId')
    );
  }
}
