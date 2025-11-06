/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createOperador = /* GraphQL */ `
  mutation CreateOperador(
    $input: CreateOperadorInput!
    $condition: ModelOperadorConditionInput
  ) {
    createOperador(input: $input, condition: $condition) {
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
export const updateOperador = /* GraphQL */ `
  mutation UpdateOperador(
    $input: UpdateOperadorInput!
    $condition: ModelOperadorConditionInput
  ) {
    updateOperador(input: $input, condition: $condition) {
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
export const deleteOperador = /* GraphQL */ `
  mutation DeleteOperador(
    $input: DeleteOperadorInput!
    $condition: ModelOperadorConditionInput
  ) {
    deleteOperador(input: $input, condition: $condition) {
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
export const createEmbalagem = /* GraphQL */ `
  mutation CreateEmbalagem(
    $input: CreateEmbalagemInput!
    $condition: ModelEmbalagemConditionInput
  ) {
    createEmbalagem(input: $input, condition: $condition) {
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
export const updateEmbalagem = /* GraphQL */ `
  mutation UpdateEmbalagem(
    $input: UpdateEmbalagemInput!
    $condition: ModelEmbalagemConditionInput
  ) {
    updateEmbalagem(input: $input, condition: $condition) {
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
export const deleteEmbalagem = /* GraphQL */ `
  mutation DeleteEmbalagem(
    $input: DeleteEmbalagemInput!
    $condition: ModelEmbalagemConditionInput
  ) {
    deleteEmbalagem(input: $input, condition: $condition) {
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
