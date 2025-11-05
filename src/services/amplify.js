import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl } from 'aws-amplify/storage';
import awsconfig from '../aws-exports';

// Configurar Amplify
Amplify.configure(awsconfig);

// Cliente GraphQL
const client = generateClient();

// ============ OPERADORES ============

export async function listOperadores() {
  try {
    const query = /* GraphQL */ `
      query ListOperadores {
        listOperadores {
          items {
            id
            nome
            apelido
            ativo
            foto_url
            createdAt
            updatedAt
          }
        }
      }
    `;

    const result = await client.graphql({ query });
    return result.data.listOperadores.items;
  } catch (error) {
    console.error('Erro ao listar operadores:', error);
    throw error;
  }
}

export async function filterOperadores(filter) {
  try {
    const query = /* GraphQL */ `
      query ListOperadores($filter: ModelOperadorFilterInput) {
        listOperadores(filter: $filter) {
          items {
            id
            nome
            apelido
            ativo
            foto_url
            createdAt
            updatedAt
          }
        }
      }
    `;

    const result = await client.graphql({
      query,
      variables: { filter }
    });
    return result.data.listOperadores.items;
  } catch (error) {
    console.error('Erro ao filtrar operadores:', error);
    throw error;
  }
}

export async function createOperador(data) {
  try {
    const mutation = /* GraphQL */ `
      mutation CreateOperador($input: CreateOperadorInput!) {
        createOperador(input: $input) {
          id
          nome
          apelido
          ativo
          foto_url
          createdAt
          updatedAt
        }
      }
    `;

    const result = await client.graphql({
      query: mutation,
      variables: { input: data }
    });
    return result.data.createOperador;
  } catch (error) {
    console.error('Erro ao criar operador:', error);
    throw error;
  }
}

export async function updateOperador(id, data) {
  try {
    const mutation = /* GraphQL */ `
      mutation UpdateOperador($input: UpdateOperadorInput!) {
        updateOperador(input: $input) {
          id
          nome
          apelido
          ativo
          foto_url
          createdAt
          updatedAt
        }
      }
    `;

    const result = await client.graphql({
      query: mutation,
      variables: { input: { id, ...data } }
    });
    return result.data.updateOperador;
  } catch (error) {
    console.error('Erro ao atualizar operador:', error);
    throw error;
  }
}

export async function deleteOperador(id) {
  try {
    const mutation = /* GraphQL */ `
      mutation DeleteOperador($input: DeleteOperadorInput!) {
        deleteOperador(input: $input) {
          id
        }
      }
    `;

    const result = await client.graphql({
      query: mutation,
      variables: { input: { id } }
    });
    return result.data.deleteOperador;
  } catch (error) {
    console.error('Erro ao deletar operador:', error);
    throw error;
  }
}

// ============ EMBALAGENS ============

export async function listEmbalagens(sortDirection = 'DESC') {
  try {
    const query = /* GraphQL */ `
      query ListEmbalagens($sortDirection: ModelSortDirection) {
        listEmbalagens(sortDirection: $sortDirection) {
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
          }
        }
      }
    `;

    const result = await client.graphql({
      query,
      variables: { sortDirection }
    });
    return result.data.listEmbalagens.items;
  } catch (error) {
    console.error('Erro ao listar embalagens:', error);
    throw error;
  }
}

export async function filterEmbalagens(filter) {
  try {
    const query = /* GraphQL */ `
      query ListEmbalagens($filter: ModelEmbalagemFilterInput) {
        listEmbalagens(filter: $filter) {
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
          }
        }
      }
    `;

    const result = await client.graphql({
      query,
      variables: { filter }
    });
    return result.data.listEmbalagens.items;
  } catch (error) {
    console.error('Erro ao filtrar embalagens:', error);
    throw error;
  }
}

export async function createEmbalagem(data) {
  try {
    const mutation = /* GraphQL */ `
      mutation CreateEmbalagem($input: CreateEmbalagemInput!) {
        createEmbalagem(input: $input) {
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
          is_duplicada
          createdAt
          updatedAt
        }
      }
    `;

    const result = await client.graphql({
      query: mutation,
      variables: { input: data }
    });
    return result.data.createEmbalagem;
  } catch (error) {
    console.error('Erro ao criar embalagem:', error);
    throw error;
  }
}

export async function updateEmbalagem(id, data) {
  try {
    const mutation = /* GraphQL */ `
      mutation UpdateEmbalagem($input: UpdateEmbalagemInput!) {
        updateEmbalagem(input: $input) {
          id
          nf_number
          cliente_nome
          tem_avaria
          tipo_avaria
          observacao_avaria
          avaria_registrada_por
          avaria_registrada_em
          updatedAt
        }
      }
    `;

    const result = await client.graphql({
      query: mutation,
      variables: { input: { id, ...data } }
    });
    return result.data.updateEmbalagem;
  } catch (error) {
    console.error('Erro ao atualizar embalagem:', error);
    throw error;
  }
}

// ============ STORAGE (S3) ============

export async function uploadFile(file) {
  try {
    const fileName = `fotos/${Date.now()}_${file.name}`;

    const result = await uploadData({
      key: fileName,
      data: file,
      options: {
        contentType: file.type,
        level: 'public'
      }
    }).result;

    // Obter URL pública
    const urlResult = await getUrl({
      key: fileName,
      options: { level: 'public' }
    });

    return {
      file_url: urlResult.url.toString(),
      key: fileName
    };
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
}

// ============ OCR (Amazon Textract) ============
// Nota: O OCR via Textract requer configuração de Lambda function
// Por enquanto, vamos simular a extração ou você pode adicionar uma Lambda

export async function extractDataFromFile(fileUrl) {
  try {
    // OPÇÃO 1: Usar Lambda function com Textract (recomendado)
    // const response = await fetch('YOUR_API_GATEWAY_URL/extract', {
    //   method: 'POST',
    //   body: JSON.stringify({ imageUrl: fileUrl })
    // });
    // return await response.json();

    // OPÇÃO 2: Por enquanto, retornar dados mockados ou extrair do nome do arquivo
    console.log('OCR pendente - configurar Lambda + Textract');

    return {
      nf_number: 'NF-' + Math.floor(Math.random() * 10000),
      cliente_nome: 'Cliente Exemplo',
      extracted: false
    };
  } catch (error) {
    console.error('Erro ao extrair dados:', error);
    throw error;
  }
}

const amplifyService = {
  // Operadores
  listOperadores,
  filterOperadores,
  createOperador,
  updateOperador,
  deleteOperador,

  // Embalagens
  listEmbalagens,
  filterEmbalagens,
  createEmbalagem,
  updateEmbalagem,

  // Storage
  uploadFile,

  // OCR
  extractDataFromFile,
};

export default amplifyService;
