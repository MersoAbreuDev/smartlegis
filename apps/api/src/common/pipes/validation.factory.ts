import { BadRequestException, ValidationError } from '@nestjs/common';

const VALIDATION_TRANSLATIONS: Array<{ match: RegExp; message: string }> = [
  { match: /must be an email/i, message: 'Informe um e-mail valido.' },
  { match: /must be a URL/i, message: 'Informe uma URL valida.' },
  { match: /must be one of the following values/i, message: 'Valor invalido.' },
  { match: /must be a string/i, message: 'Campo invalido.' },
  { match: /must be an integer number/i, message: 'Informe um numero inteiro.' },
  { match: /must not be less than/i, message: 'Valor abaixo do minimo permitido.' },
  { match: /must be longer than or equal to/i, message: 'Texto muito curto.' },
  { match: /must be shorter than or equal to/i, message: 'Texto muito longo.' }
];

function translateValidationMessage(message: string) {
  for (const item of VALIDATION_TRANSLATIONS) {
    if (item.match.test(message)) return item.message;
  }
  return message;
}

function collectValidationMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints).map(translateValidationMessage));
    }
    if (error.children?.length) {
      messages.push(...collectValidationMessages(error.children));
    }
  }

  return messages;
}

export function validationExceptionFactory(errors: ValidationError[]) {
  const messages = collectValidationMessages(errors);
  return new BadRequestException(messages.join(' ') || 'Dados invalidos.');
}
