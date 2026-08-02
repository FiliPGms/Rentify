import { useEffect, useState } from 'react';
import { ibgeCidades } from '../api';
import type { IbgeMunicipio } from '../types';

export function useEnderecoForm() {
  const [estadoSelecionado, setEstadoSelecionado] = useState('');
  const [cidades, setCidades] = useState<IbgeMunicipio[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [semNumero, setSemNumero] = useState(false);

  useEffect(() => {
    if (!estadoSelecionado) {
      setCidades([]);
      return;
    }

    let cancelled = false;
    setLoadingCidades(true);
    setCidades([]);

    ibgeCidades(estadoSelecionado)
      .then((data) => {
        if (!cancelled) setCidades(data);
      })
      .catch(() => {
        if (!cancelled) setCidades([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCidades(false);
      });

    return () => {
      cancelled = true;
    };
  }, [estadoSelecionado]);

  return {
    estadoSelecionado,
    setEstadoSelecionado,
    cidades,
    loadingCidades,
    semNumero,
    setSemNumero
  };
}
