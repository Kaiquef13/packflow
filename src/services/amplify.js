import { Amplify } from 'aws-amplify';
import { generateClient, post } from 'aws-amplify/api';
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
      query ListOperadors {
        listOperadors {
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
    return result.data.listOperadors.items;
  } catch (error) {
    console.error('Erro ao listar operadores:', error);
    throw error;
  }
}

export async function filterOperadores(filter) {
  try {
    const query = /* GraphQL */ `
      query ListOperadors($filter: ModelOperadorFilterInput) {
        listOperadors(filter: $filter) {
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
    return result.data.listOperadors.items;
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
      query ListEmbalagems {
        listEmbalagems {
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

    const result = await client.graphql({ query });
    const items = result.data.listEmbalagems.items;

    // Ordenar por createdAt (DESC ou ASC)
    return items.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortDirection === 'DESC' ? dateB - dateA : dateA - dateB;
    });
  } catch (error) {
    console.error('Erro ao listar embalagens:', error);
    throw error;
  }
}

export async function filterEmbalagens(filter) {
  try {
    const query = /* GraphQL */ `
      query ListEmbalagems($filter: ModelEmbalagemFilterInput) {
        listEmbalagems(filter: $filter) {
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
    return result.data.listEmbalagems.items;
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

    await uploadData({
      key: fileName,
      data: file,
      options: {
        contentType: file.type,
        level: 'public'
      }
    }).result;

    return { key: fileName };
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
}

export async function resolvePublicFileUrl(value, options = {}) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (/^data:/i.test(trimmed)) {
    return trimmed;
  }

  let key = trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const pathname = parsed.pathname.replace(/^\/+/, '');
      const publicIndex = pathname.indexOf('public/');
      key = publicIndex >= 0 ? pathname.slice(publicIndex + 'public/'.length) : pathname;
    } catch (error) {
      console.warn('URL de foto invalida, usando valor original', error);
      return trimmed;
    }
  }

  key = key.replace(/^public\//, '');

  try {
    const urlResult = await getUrl({
      key,
      options: {
        level: 'public',
        expiresIn: options.expiresIn ?? 3600
      }
    });
    return urlResult.url.toString();
  } catch (error) {
    console.error('Erro ao gerar URL assinada para foto:', error);
    return trimmed;
  }
}

// ============ OCR (AWS Textract) ============



const textractApiConfig = awsconfig.aws_cloud_logic_custom?.find((api) => api.name === 'textractapi');

const textractApiName = textractApiConfig?.name;



export async function extractDataFromFile({ key }) {

  if (!key) {

    throw new Error('Arquivo sem referencia (key) para OCR.');

  }



  if (!textractApiName) {

    throw new Error('Endpoint Textract nao configurado.');

  }



  const bucket = awsconfig.aws_user_files_s3_bucket;

  const s3Key = key.startsWith('public/') ? key : `public/${key}`;



  try {

    const restOperation = post({

      apiName: textractApiName,

      path: '/ocr',

      options: {

        headers: {

          'Content-Type': 'application/json'

        },

        body: {

          key: s3Key,

          bucket

        }

      }

    });



    const { body } = await restOperation.response;

    const data = await body.json();

    return data;

  } catch (error) {

    console.error('Erro ao extrair dados com Textract:', error);

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
  resolvePublicFileUrl,

  // OCR
  extractDataFromFile,
};

export default amplifyService;


