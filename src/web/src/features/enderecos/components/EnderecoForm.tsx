import { ESTADOS_BR } from '../types';
import { useEnderecoForm } from '../hooks/useEnderecoForm';

export function EnderecoForm() {
  const {
    estadoSelecionado,
    setEstadoSelecionado,
    cidades,
    loadingCidades,
    semNumero,
    setSemNumero
  } = useEnderecoForm();

  return (
    <fieldset className="form-fieldset">
      <legend className="eyebrow">Endereço</legend>

      <div className="form-row">
        <div className="form-group">
          <label className="eyebrow" htmlFor="estado">Estado</label>
          <select
            id="estado"
            name="estado"
            required
            value={estadoSelecionado}
            onChange={(e) => setEstadoSelecionado(e.target.value)}
          >
            <option value="">Selecione o estado</option>
            {ESTADOS_BR.map((uf) => (
              <option key={uf.sigla} value={uf.sigla}>
                {uf.sigla} — {uf.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="eyebrow" htmlFor="cidade">Cidade</label>
          <select
            id="cidade"
            name="cidade"
            required
            disabled={!estadoSelecionado || loadingCidades}
          >
            <option value="">
              {!estadoSelecionado
                ? 'Selecione o estado primeiro'
                : loadingCidades
                ? 'Carregando cidades...'
                : 'Selecione a cidade'}
            </option>
            {cidades.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="eyebrow" htmlFor="cep">CEP</label>
        <input
          id="cep"
          name="cep"
          placeholder="00000-000"
          maxLength={9}
          required
        />
      </div>

      <div className="form-group">
        <label className="eyebrow" htmlFor="rua">Rua / Logradouro</label>
        <input id="rua" name="rua" placeholder="Ex: Rua das Flores" maxLength={160} required />
      </div>

      <div className="form-row form-row--numero">
        <div className="form-group">
          <label className="eyebrow" htmlFor="numero">Número</label>
          <input
            id="numero"
            name="numero"
            placeholder="Ex: 123"
            maxLength={10}
            disabled={semNumero}
            value={semNumero ? '' : undefined}
            onChange={semNumero ? undefined : undefined}
          />
        </div>
        <div className="form-group form-group--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={semNumero}
              onChange={(e) => setSemNumero(e.target.checked)}
            />
            Sem número (SN)
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="eyebrow" htmlFor="bairro">Bairro</label>
        <input id="bairro" name="bairro" placeholder="Ex: Centro" maxLength={100} required />
      </div>
    </fieldset>
  );
}
