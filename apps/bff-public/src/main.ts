import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

@Controller('bff-public')
class BffPublicController {
  @Get('portal-map')
  portalMap() {
    return {
      pages: ['Home', 'Materias', 'Detalhe da materia', 'Sessoes', 'Detalhe da sessao', 'Votacoes', 'Vereadores'],
      access: 'Sem login, apenas dados publicados ou finalizados'
    };
  }
}

@Module({ controllers: [BffPublicController] })
class BffPublicModule {}

async function bootstrap() {
  const app = await NestFactory.create(BffPublicModule);
  app.setGlobalPrefix('api');
  await app.listen(3343);
}

bootstrap();
