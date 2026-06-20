const ERROR_TRANSLATIONS: Array<{ match: RegExp; message: string }> = [
  {
    match: /request entity too large|payload too large|entity too large/i,
    message: 'Arquivo muito grande. O limite e de 5MB por logo.'
  },
  {
    match: /^unauthorized$/i,
    message: 'Nao autorizado.'
  },
  {
    match: /^forbidden$/i,
    message: 'Voce nao tem permissao para esta acao.'
  },
  {
    match: /^not found$/i,
    message: 'Registro nao encontrado.'
  },
  {
    match: /^bad request$/i,
    message: 'Requisicao invalida.'
  },
  {
    match: /^internal server error$/i,
    message: 'Erro interno do servidor.'
  },
  {
    match: /^failed to fetch$/i,
    message: 'Nao foi possivel conectar ao servidor.'
  }
];

export function normalizeApiErrorMessage(message: string, status?: number): string {
  const trimmed = message.trim();
  if (!trimmed) return 'Nao foi possivel completar a requisicao.';

  if (status === 413) {
    return 'Arquivo muito grande. O limite e de 5MB por logo.';
  }

  for (const item of ERROR_TRANSLATIONS) {
    if (item.match.test(trimmed)) return item.message;
  }

  return trimmed;
}
