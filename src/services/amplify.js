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

// ============ OCR (Tesseract.js) ============

export async function extractDataFromFile(fileUrl) {
  try {
    const { Tesseract } = await import('tesseract.js');

    // Fazer download da imagem como blob
    const response = await fetch(fileUrl);
    const blob = await response.blob();

    // Executar OCR
    const worker = await Tesseract.createWorker('por'); // Português do Brasil
    const result = await worker.recognize(blob);
    await worker.terminate();

    const fullText = result.data.text.toUpperCase();

    // Padrões de regex para extrair NF e Cliente
    // NF: pode estar em formatos diferentes (NF, NF-E, NFe, etc)
    const nfPattern = /(?:NF[^A-Z0-9]*|NFCE[^A-Z0-9]*|NFE[^A-Z0-9]*)(\d+(?:[.,]\d{1,2})?)/;
    const clientePattern = /(?:CLIENTE|DESTINATÁRIO|DESTINATARIO)[\s:]*([A-Z]{2,}(?:\s+[A-Z]{2,})*)/;

    const nfMatch = fullText.match(nfPattern);
    const clienteMatch = fullText.match(clientePattern);

    const nfNumber = nfMatch ? nfMatch[1].replace(/[.,]/g, '') : '';
    const clienteNome = clienteMatch ? clienteMatch[1].trim() : '';

    console.log('OCR Result:', {
      nf_number: nfNumber,
      cliente_nome: clienteNome,
      fullText: fullText.substring(0, 200)
    });

    return {
      nf_number: nfNumber,
      cliente_nome: clienteNome,
      extracted: !!(nfNumber || clienteNome),
      fullText: fullText
    };
  } catch (error) {
    console.error('Erro ao extrair dados com OCR:', error);

    // Fallback: tentar extrair NF da URL ou retornar vazio
    return {
      nf_number: '',
      cliente_nome: '',
      extracted: false,
      error: error.message
    };
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
