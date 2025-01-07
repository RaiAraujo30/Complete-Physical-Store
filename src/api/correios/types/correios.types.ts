interface FreightRequestPayload {
    cepDestino: string;
    cepOrigem: string;
    comprimento: string;
    largura: string;
    altura: string;
  }
  

  interface FreightResponse {
    status: number;
    mensagemPrecoAgencia: string;
    prazo: string;
    url: string;
    mensagemPrecoPPN: string;
    codProdutoAgencia: string;
    precoPPN: string;
    codProdutoPPN: string;
    mensagemPrazo: string;
    msg: string;
    precoAgencia: string;
    urlTitulo: string;
  }
  