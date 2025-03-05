import { GLSPServerError, GModelElement, GModelIndex } from '@eclipse-glsp/server';

import { DynamicModel, Edge, Node } from './dynamic-model';
import { injectable } from 'inversify';

@injectable()
export class DynamicModelIndex extends GModelIndex {
  protected idToModelElement = new Map<string, Node | Edge>();

  protected override doIndex(element: GModelElement): void {
    if (!element) return;

    if (this.idToElement.has(element.id)) {
      throw new GLSPServerError('Duplicate ID in model: ' + element.id);
    }

    this.idToElement.set(element.id, element);

    const typeSet = this.typeToElements.get((element['args']?.['elementType'] as string) ?? element.type) ?? [];
    typeSet.push(element);

    this.typeToElements.set((element['args']?.['elementType'] as string) ?? element.type, typeSet);

    element.children?.forEach((child) => {
      if (child) {
        this.doIndex(child);

        // double check wether the parent reference of the child is set correctly
        if (!child.parent) {
          child.parent = element;
        }
      }
    });
  }

  indexModel(model: DynamicModel): void {
    this.idToModelElement.clear();
    for (const element of [...model.nodes, ...model.edges]) {
      this.idToModelElement.set(element.id, element);
    }
  }

  findNode(id: string): Node | undefined {
    const element = this.findNodeOrEdge(id);
    return Node.is(element) ? element : undefined;
  }

  findEdge(id: string): Edge | undefined {
    const element = this.findNodeOrEdge(id);
    return Edge.is(element) ? element : undefined;
  }

  findNodeOrEdge(id: string): Node | Edge | undefined {
    return this.idToModelElement.get(id);
  }
}
