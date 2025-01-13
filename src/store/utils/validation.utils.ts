import { AppError } from '../../common/exceptions/AppError';

export function validateState(state: string): void {
  if (!state || state.length !== 2) {
    throw new AppError(
      "Invalid state format. Use 'UF' (e.g., RS, SP).",
      400,
      'INVALID_STATE_FORMAT',
      { state },
    );
  }
}

export function cleanCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

export function validateCep(cep: string): void {
  if (!cep || cep.trim() === '' || cleanCep(cep).length !== 8) {
    throw new AppError(
      'Invalid CEP format. Please provide a valid 8-digit CEP.',
      400,
      'INVALID_CEP_FORMAT',
      { cep },
    );
  }
}
