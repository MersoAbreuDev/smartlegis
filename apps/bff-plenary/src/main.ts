import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

@Controller('bff-plenary')
class BffPlenaryController {
  @Get('cockpit')
  cockpit() {
    return {
      roles: ['PRESIDENTE', 'SECRETARIO', 'VEREADOR'],
      actions: ['Abrir sessao', 'Selecionar materia', 'Iniciar votacao', 'Confirmar voto com MFA', 'Encerrar votacao']
    };
  }
}

@Module({ controllers: [BffPlenaryController] })
class BffPlenaryModule {}

async function bootstrap() {
  const app = await NestFactory.create(BffPlenaryModule);
  app.setGlobalPrefix('api');
  await app.listen(3342);
}

bootstrap();
