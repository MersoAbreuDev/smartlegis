import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

@Controller('bff-admin')
class BffAdminController {
  @Get('navigation')
  navigation() {
    return [
      'Dashboard',
      'Usuarios',
      'Vereadores',
      'Materias Legislativas',
      'Sessoes',
      'Pauta',
      'Auditoria'
    ];
  }

  @Get('dashboard')
  dashboard() {
    return {
      cards: ['Sessoes hoje', 'Materias em tramitacao', 'Votacoes realizadas', 'Logs auditados'],
      primaryFlow: 'Cadastro administrativo e rastreabilidade da Camara'
    };
  }
}

@Module({ controllers: [BffAdminController] })
class BffAdminModule {}

async function bootstrap() {
  const app = await NestFactory.create(BffAdminModule);
  app.setGlobalPrefix('api');
  await app.listen(3341);
}

bootstrap();
