import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';

function extractMessage(response: string | object): string {
  if (typeof response === 'string') return response;
  if (Array.isArray((response as { message?: unknown }).message)) {
    return ((response as { message: string[] }).message).join(' ');
  }
  if (typeof (response as { message?: unknown }).message === 'string') {
    return (response as { message: string }).message;
  }
  return 'Nao foi possivel completar a requisicao.';
}

function translateMessage(message: string, status: number): string {
  const normalized = message.trim().toLowerCase();

  if (
    status === HttpStatus.PAYLOAD_TOO_LARGE ||
    normalized.includes('entity too large') ||
    normalized.includes('payload too large') ||
    normalized.includes('request entity too large')
  ) {
    return 'Arquivo muito grande. O limite e de 5MB por logo.';
  }

  if (status === HttpStatus.UNAUTHORIZED && normalized.includes('unauthorized')) {
    return 'Nao autorizado.';
  }

  if (status === HttpStatus.FORBIDDEN && normalized.includes('forbidden')) {
    return 'Voce nao tem permissao para esta acao.';
  }

  if (status === HttpStatus.NOT_FOUND && normalized.includes('not found')) {
    return 'Registro nao encontrado.';
  }

  if (status === HttpStatus.BAD_REQUEST && normalized.includes('bad request')) {
    return 'Requisicao invalida.';
  }

  if (status === HttpStatus.INTERNAL_SERVER_ERROR && normalized.includes('internal server error')) {
    return 'Erro interno do servidor.';
  }

  return message;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = extractMessage(exception.getResponse());
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'type' in exception &&
      (exception as { type?: string }).type === 'entity.too.large'
    ) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = 'Arquivo muito grande. O limite e de 5MB por logo.';
    }

    message = translateMessage(message, status);

    response.status(status).json({
      statusCode: status,
      message,
      error: message
    });
  }
}
