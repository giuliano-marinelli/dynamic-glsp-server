import { DynamicTypes, GDecision, GIteration, GShape } from '@dynamic-glsp/protocol';
import {
  DefaultGModelSerializer,
  GLSPServerError,
  GModelElement,
  GModelElementSchema,
  GModelRoot,
  GModelRootSchema
} from '@eclipse-glsp/server';

import { DynamicDiagramConfiguration } from '../diagram/dynamic-diagram-configuration';
import { ExpressionParser, formula } from 'expressionparser';
import { ExpressionThunk, ExpressionValue } from 'expressionparser/dist/ExpressionParser';
import { inject } from 'inversify';

/**
 * The `DynamicGModelSerializer` class extends the `DefaultGModelSerializer` to provide
 * additional functionality for creating and initializing dynamic graphical model elements.
 *
 * @extends DefaultGModelSerializer
 */
export class DynamicGModelSerializer extends DefaultGModelSerializer {
  @inject(DynamicDiagramConfiguration)
  protected diagramConfiguration!: DynamicDiagramConfiguration;

  authorizedKeys = ['args'];
  protectedKeys = ['aModel', 'model', 'elementType', 'elementLabel'];

  override createElement(
    gModel: GModelElementSchema,
    parent?: GModelElement,
    model?: any,
    path: string = '',
    iterand?: string,
    identifier?: string
  ): GModelElement {
    const constructor = this.getConfiguredConstructor(gModel);
    if (constructor) {
      const element = new constructor();
      if (element instanceof GModelRoot) {
        throw new GLSPServerError(
          `Element with type '${gModel.type}' is a GModelRoot! 'createElement()' is expected to only create child elements!`
        );
      }
      return this.initializeChild(element, gModel, parent, model, path, iterand, identifier);
    }
    throw new GLSPServerError(`No constructor is configured in DiagramConfiguration for type ${gModel.type}`);
  }

  /**
   * Traverse the model object using the bind to get their value.
   * It takes into account nested objects and arrays.
   *
   * @example
   * bind = 'persona.nombre' -> model['persona']['nombre']
   *
   * @example
   * bind = 'persona.nombres[0]' -> model['persona']['nombres'][0]
   */
  getBindValue(bind: string, model: any): any {
    if (!bind || !model) return;
    const bindPath = bind.split('.');

    if (!bindPath) return null;

    return bindPath.reduce((acc, key) => {
      if (key.includes('[')) {
        const index = parseInt(key.match(/\[(.*?)\]/)![1]);
        return acc?.[key.split('[')[0]][index];
      } else return acc?.[key];
    }, model);
  }

  /**
   * If the bind is a relative path, it will be normalized to an absolute path replacing the iterand with the path.
   * If the bind is an absolute path, it will be returned as is.
   *
   * * @example
   * bind = 'class.attributes' -> 'class.attributes'
   *
   * @example
   * bind = 'attribute.name', path = 'class.attributes[0]', iterand = 'attribute' -> 'class.attributes[0].name'
   */
  normalizeBind(bind: string, path?: string, iterand?: string): string {
    if (!bind) return '';
    // if path or iterand are not defined, return the bind as is
    if (!path || !iterand) return bind;

    const bindPath = bind.split('.');
    // if the first element is the iterand, replace it with the path
    if (iterand && bindPath[0] == iterand) {
      bindPath[0] = path ?? '';
    }
    return bindPath.join('.');
  }

  /**
   * Gets the default model value object and the autoincrement value and returns the object with the autoincrement value set.
   *
   * @example
   * defaultModel = { name: 'element_{autoincrement}' }, autoincrement = 1 -> { name: 'element_1' }
   */
  processAutoincrement(defaultModel: any, autoincrement?: number): any {
    if (!defaultModel) return {};
    return JSON.parse(
      JSON.stringify(defaultModel).replace(
        /{autoincrement}/g,
        autoincrement != undefined ? autoincrement.toString() : ''
      )
    );
  }

  /**
   * Returns the value of a single bind variable.
   * It checks if the bindString is a valid bind variable (e.g. {variable}) and returns the value from the model.
   * If the bindString is not a valid bind variable, it returns undefined.
   */
  processValueBind(bindString: string, model: any, path?: string, iterand?: string): any {
    if (!bindString) return undefined;

    // check if bindString is only a variable (e.g. {variable})
    if (!bindString.startsWith('{') || !bindString.endsWith('}')) return undefined;

    return this.getBindValue(this.normalizeBind(bindString.slice(2, -1), path, iterand), model);
  }

  /**
   * Process the bindString replacing the variables between { and } with the values from the model.
   */
  processStringBind(bindString: string, model: any, path?: string, iterand?: string): string {
    if (!bindString || typeof bindString !== 'string') return '';

    return bindString.replace(/{(.*?)}/g, (match, term) => {
      let value = this.getBindValue(this.normalizeBind(term, path, iterand), model) ?? '';
      return value;
    });
  }

  /**
   * Returns the boolean value of the expression based on the conditions and values of the model.
   *
   * If anything goes wrong, it returns false.
   */
  processBooleanBind(bindString: string, model: any, path?: string, iterand?: string): boolean {
    if (!bindString || typeof bindString !== 'string') return false;

    // create a formula parser for analyse conditions
    const parser = formula((term) => term);

    // replace the bind variables in the bindString with their values
    const booleanExp = bindString.replace(/{(.*?)}/g, (match, term) => {
      let value = this.getBindValue(this.normalizeBind(term, path, iterand), model) ?? '';
      if (typeof value === 'boolean' || !value) value = value ? 'TRUE' : 'FALSE';
      return value;
    });

    try {
      // analyze the condition with the parser and return the boolean value
      const result = new ExpressionParser(parser).expressionToValue(booleanExp);
      console.log(`Processing boolean bind: ${bindString} -> ${booleanExp} -> ${result}`);
      return result as boolean;
    } catch (error) {
      console.error(`Error processing boolean bind: ${bindString} -> ${error}`);
      return false; // return false if there is an error in the expression
    }
  }

  protected override initializeElement(
    element: GModelElement,
    gModel: GModelRootSchema,
    model?: any,
    path?: string,
    iterand?: string
  ): GModelElement {
    for (const key in gModel) {
      if (!this.isReserved(element, key)) {
        const value = (gModel as any)[key];
        if (typeof value !== 'function') {
          // here we have to translate binding variables to values if they are used in the schema
          if (typeof value === 'string' && value.includes('{') && !this.isProtected(key)) {
            (element as any)[key] = this.processStringBind(value, model, path, iterand);

            // NEXT IS COMMENTED OUT BECAUSE IT IS NOT NEEDED AT THE MOMENT
            // IT IS USED ON APPLY LABEL EDIT OPERATION (WHICH IS FOR EDIT PROPERTIES DIRECTLY ON THE DIAGRAM)
            // THIS OPERATION IS NOT USED BECAUSE OF COMPOSED BINDING STRINGS

            // add argument for flag that the element property is bind to a model property
            // if (!gModel['args']) element.args = {};
            // if (!element.args) element.args = {};
            // // create keyBind variable full path
            // const keyBind = this.getBindingVariable(value, path, iterand);
            // gModel['args'] = { ...gModel['args'], [key + 'Bind']: keyBind };
            // element.args = { ...element.args, [key + 'Bind']: keyBind };
          } else if (typeof value === 'object' && this.isAuthorized(key)) {
            (element as any)[key] = this.initializeElement((element as any)[key] ?? {}, value, model, path, iterand);
          } else {
            (element as any)[key] = value;
          }
        }
      }
    }

    // if the element is a shape, we have to initialize their size (using layoutOptions)
    // this is for the case the shape is a relative child
    if (element instanceof GShape) {
      let width = (gModel as GShape).layoutOptions?.relWidth;
      let height = (gModel as GShape).layoutOptions?.relHeight;
      if ((width as string).includes('%') || (width as string) == '') width = 1;
      if ((height as string).includes('%') || (height as string) == '') height = 1;
      element.size = { width: parseFloat(width as string), height: parseFloat(height as string) };
    }

    return element;
  }

  protected initializeChild(
    child: GModelElement,
    gModel: GModelElementSchema,
    parent?: GModelElement,
    model?: any,
    path?: string,
    iterand?: string,
    identifier?: string
  ): GModelElement {
    if (child.type == DynamicTypes.ITERATION) {
      if (!parent) {
        // throw new GLSPServerError(`Iteration element must have a parent.`);
        // if it doesn't have a parent, we simply return undefined
        return;
      }

      const iteration = gModel as GIteration;
      if (!iteration.iterable) return;
      const iterable = this.getBindValue(this.normalizeBind(iteration.iterable, path, iterand), model);

      if (iterable && iteration.template) {
        // check if iterable is an array
        if (!Array.isArray(iterable)) {
          // throw new GLSPServerError(`Iteration iterable must be an array.`);
          // if it's not an array, we simple return undefined
          return;
        }

        // compute iteration children
        // filter out undefined children (e.g. if the child is an iteration element without content)
        // and add them to parent children list
        iterable
          .map((modelItem, index) => {
            return this.createElement(
              iteration.template!,
              parent,
              model,
              this.normalizeBind(iteration.iterable, path, iterand) + '[' + index + ']',
              iteration.iterand,
              identifier + '_' + (iteration.iterand ?? 'iterand') + index
            );
          })
          .filter((child) => child != undefined)
          .forEach((child) => {
            parent.children.push(child);
          });
      }

      return undefined;
    } else if (child.type == DynamicTypes.DECISION) {
      if (!parent) {
        // throw new GLSPServerError(`Decision element must have a parent.`);
        // if it doesn't have a parent, we simply return undefined
        return undefined;
      }

      const decision = gModel as GDecision;

      if (!decision.condition) return;
      const condition = this.processBooleanBind(decision.condition, model);

      // add the child to the parent children list if the condition is true
      // otherwise add the else child if it exists
      if (condition && decision.then) {
        const thenChild = this.createElement(decision.then, parent, model, path, iterand, identifier);
        if (thenChild != undefined) {
          parent.children.push(thenChild);
        }
      } else if (!condition && decision.else) {
        const elseChild = this.createElement(decision.else, parent, model, path, iterand, identifier);
        if (elseChild != undefined) {
          parent.children.push(elseChild);
        }
      }

      return;
    } else {
      if (parent) {
        child.parent = parent;
        child.id = parent.id + '_' + identifier;
      }
      this.initializeParent(child, gModel, model, path, iterand);
      return child;
    }
  }

  protected override initializeParent(
    parent: GModelElement,
    gModel: GModelElementSchema,
    model?: any,
    path?: string,
    iterand?: string
  ): GModelElement {
    this.initializeElement(parent, gModel, model, path, iterand);

    if (gModel?.children) {
      parent.children = [];
      gModel.children.forEach((childSchema, index) => {
        const child = this.createElement(childSchema, parent, model, path, iterand, 'child' + index);
        if (child) parent.children.push(child);
      });
    }

    return parent;
  }

  protected isAuthorized(key: string): boolean {
    return this.authorizedKeys.includes(key);
  }

  protected isProtected(key: string): boolean {
    return this.protectedKeys.includes(key);
  }
}
