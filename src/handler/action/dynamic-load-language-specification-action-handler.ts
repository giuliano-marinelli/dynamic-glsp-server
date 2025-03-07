import { LoadLanguageSpecificationAction, ReadyLanguageSpecificationAction } from '@dynamic-glsp/protocol';
import { Action, ActionHandler } from '@eclipse-glsp/server';

import { DynamicLanguageSpecification } from '../../model/dynamic-language-specification';
import { AuthClientAction } from '../../server/dynamic-auth-client-action';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamicLoadLanguageSpecificationActionHandler implements ActionHandler {
  readonly actionKinds = [LoadLanguageSpecificationAction.KIND];

  @inject(DynamicLanguageSpecification)
  protected languageSpecification!: DynamicLanguageSpecification;

  async execute(action: LoadLanguageSpecificationAction): Promise<Action[]> {
    const language = await this.languageSpecification.load(
      action as LoadLanguageSpecificationAction & AuthClientAction
    );

    return [ReadyLanguageSpecificationAction.create(language)];
  }
}
