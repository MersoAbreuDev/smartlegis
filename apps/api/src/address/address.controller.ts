import { BadRequestException, Controller, Get, NotFoundException, Param } from '@nestjs/common';

type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

@Controller('address')
export class AddressController {
  @Get('cep/:cep')
  async findByCep(@Param('cep') cep: string) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) throw new BadRequestException('CEP invalido.');

    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) throw new BadRequestException('Nao foi possivel consultar o CEP.');

    const data = (await response.json()) as ViaCepResponse;
    if (data.erro) throw new NotFoundException('CEP nao encontrado.');

    return {
      zipCode: data.cep,
      street: data.logradouro,
      complement: data.complemento,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf
    };
  }
}
