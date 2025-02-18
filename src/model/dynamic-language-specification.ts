import {
  Language,
  LanguageEdge,
  LanguageElement,
  LanguageElementType,
  LanguageNode,
  LoadLanguageSpecificationAction
} from '@dynamic-glsp/protocol';
import { GLSPServerError } from '@eclipse-glsp/server';

import { ExternalServices } from '../diagram/dynamic-external-services';
import { AuthClientAction } from '../server/dynamic-auth-client-action';
import { inject, injectable } from 'inversify';

export const LanguageSpecification = Symbol('LanguageSpecification');

export interface LanguageSpecification {
  language: Language;
  load(action: LoadLanguageSpecificationAction & AuthClientAction): void;
}

@injectable()
export class DynamicLanguageSpecification implements LanguageSpecification {
  language: Language;

  @inject(ExternalServices)
  protected services: ExternalServices;

  async load(action: LoadLanguageSpecificationAction & AuthClientAction) {
    const { showcaseMode, connectionAuth } = action;

    const newLanguage = action.language;

    if (!this.services.languageProvider) {
      throw new GLSPServerError('No language provider was defined');
    }

    let language: Language;

    if (typeof newLanguage === 'string') {
      // if the language is a string, get the language from the language provider using it as the language id
      language = await this.services.languageProvider(newLanguage, connectionAuth);
    } else if (typeof newLanguage === 'object') {
      // if showcase mode is false, use the the language directly
      if (!showcaseMode) {
        language = newLanguage as Language;
      }
      // if showcase mode is true, create a showcase language with the language element
      else {
        const languageElement = newLanguage as LanguageElement;
        language = this.createLanguageForShowcase(languageElement);
      }
    }

    this.language = language;
  }

  protected createLanguageForShowcase(languageElement: LanguageElement): Language {
    return {
      id: 'showcase',
      name: 'Showcase',
      title: 'Showcase',
      version: '0.0.0',
      nodes:
        languageElement.type == LanguageElementType.NODE
          ? { showcaseNode: languageElement as LanguageNode }
          : {
              showcaseNode: {
                type: LanguageElementType.NODE,
                name: 'showcaseNode',
                label: 'Showcase Node',
                gModel: {
                  type: 'node'
                },
                aModel: {},
                default: {}
              } as LanguageNode
            },
      edges: languageElement.type == LanguageElementType.EDGE ? { showcaseEdge: languageElement as LanguageEdge } : {}
    };
  }
}
