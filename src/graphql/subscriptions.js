/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateOperador = /* GraphQL */ `
  subscription OnCreateOperador($filter: ModelSubscriptionOperadorFilterInput) {
    onCreateOperador(filter: $filter) {
      id
      nome
      apelido
      ativo
      foto_url
      embalagens {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateOperador = /* GraphQL */ `
  subscription OnUpdateOperador($filter: ModelSubscriptionOperadorFilterInput) {
    onUpdateOperador(filter: $filter) {
      id
      nome
      apelido
      ativo
      foto_url
      embalagens {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteOperador = /* GraphQL */ `
  subscription OnDeleteOperador($filter: ModelSubscriptionOperadorFilterInput) {
    onDeleteOperador(filter: $filter) {
      id
      nome
      apelido
      ativo
      foto_url
      embalagens {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateEmbalagem = /* GraphQL */ `
  subscription OnCreateEmbalagem(
    $filter: ModelSubscriptionEmbalagemFilterInput
  ) {
    onCreateEmbalagem(filter: $filter) {
      id
      nf_number
      cliente_nome
      start_time
      end_time
      tempo_total_segundos
      foto_danfe_url
      foto_conteudo_url
      foto_caixa_url
      observacao
      operador_id
      operador_nome
      operador {
        id
        nome
        apelido
        ativo
        foto_url
        createdAt
        updatedAt
        __typename
      }
      pendente_extracao
      status
      tem_avaria
      tipo_avaria
      observacao_avaria
      avaria_registrada_por
      avaria_registrada_em
      is_duplicada
      nf_original_id
      data_nf_original
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateEmbalagem = /* GraphQL */ `
  subscription OnUpdateEmbalagem(
    $filter: ModelSubscriptionEmbalagemFilterInput
  ) {
    onUpdateEmbalagem(filter: $filter) {
      id
      nf_number
      cliente_nome
      start_time
      end_time
      tempo_total_segundos
      foto_danfe_url
      foto_conteudo_url
      foto_caixa_url
      observacao
      operador_id
      operador_nome
      operador {
        id
        nome
        apelido
        ativo
        foto_url
        createdAt
        updatedAt
        __typename
      }
      pendente_extracao
      status
      tem_avaria
      tipo_avaria
      observacao_avaria
      avaria_registrada_por
      avaria_registrada_em
      is_duplicada
      nf_original_id
      data_nf_original
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteEmbalagem = /* GraphQL */ `
  subscription OnDeleteEmbalagem(
    $filter: ModelSubscriptionEmbalagemFilterInput
  ) {
    onDeleteEmbalagem(filter: $filter) {
      id
      nf_number
      cliente_nome
      start_time
      end_time
      tempo_total_segundos
      foto_danfe_url
      foto_conteudo_url
      foto_caixa_url
      observacao
      operador_id
      operador_nome
      operador {
        id
        nome
        apelido
        ativo
        foto_url
        createdAt
        updatedAt
        __typename
      }
      pendente_extracao
      status
      tem_avaria
      tipo_avaria
      observacao_avaria
      avaria_registrada_por
      avaria_registrada_em
      is_duplicada
      nf_original_id
      data_nf_original
      createdAt
      updatedAt
      __typename
    }
  }
`;
