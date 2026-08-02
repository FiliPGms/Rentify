import type { IbgeMunicipio } from './types';

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades';

export async function ibgeCidades(uf: string): Promise<IbgeMunicipio[]> {
  const response = await fetch(`${IBGE_BASE}/estados/${uf}/municipios?orderBy=nome`);
  if (!response.ok) throw new Error('Falha ao buscar cidades do IBGE.');
  return response.json() as Promise<IbgeMunicipio[]>;
}
