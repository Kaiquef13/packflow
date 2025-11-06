/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getOperador = /* GraphQL */ `
  query GetOperador($id: ID!) {
    getOperador(id: $id) {
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
export const listOperadors = /* GraphQL */ `
  query ListOperadors(
    $filter: ModelOperadorFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listOperadors(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        nome
        apelido
        ativo
        foto_url
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getEmbalagem = /* GraphQL */ `
  query GetEmbalagem($id: ID!) {
    getEmbalagem(id: $id) {
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
export const listEmbalagems = /* GraphQL */ `
  query ListEmbalagems(
    $filter: ModelEmbalagemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listEmbalagems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const embalagemsByOperador_idAndCreatedAt = /* GraphQL */ `
  query EmbalagemsByOperador_idAndCreatedAt(
    $operador_id: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelEmbalagemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    embalagemsByOperador_idAndCreatedAt(
      operador_id: $operador_id
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
