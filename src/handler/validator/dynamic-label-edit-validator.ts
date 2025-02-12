import { GModelElement, LabelEditValidator, ValidationStatus } from '@eclipse-glsp/server';

import { DynamicModelState } from '../../model/dynamic-model-state';
import { inject, injectable } from 'inversify';

/**
 * A simple edit label validator that verifies that the given name label is not empty.
 */
@injectable()
export class DynamicLabelEditValidator implements LabelEditValidator {
  @inject(DynamicModelState)
  protected modelState!: DynamicModelState;

  validate(label: string, element: GModelElement): ValidationStatus {
    if (label.length < 1) {
      return { severity: ValidationStatus.Severity.ERROR, message: 'Name must not be empty' };
    }
    return { severity: ValidationStatus.Severity.OK };
  }
}
