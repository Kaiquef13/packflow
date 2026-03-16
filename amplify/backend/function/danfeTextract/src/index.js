/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	STORAGE_PACKFLOWSTORAGE_BUCKETNAME
Amplify Params - DO NOT EDIT */

const { TextractClient, AnalyzeDocumentCommand, DetectDocumentTextCommand } = require('@aws-sdk/client-textract');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { ComprehendClient, DetectEntitiesCommand } = require('@aws-sdk/client-comprehend');

const textractRegion = process.env.TEXTRACT_REGION || 'us-east-1';
const textract = new TextractClient({ region: textractRegion });
const s3 = new S3Client({ region: process.env.REGION });
const comprehend = new ComprehendClient({
  region: process.env.COMPREHEND_REGION || process.env.REGION || 'sa-east-1'
});
const comprehendLanguage = process.env.COMPREHEND_LANGUAGE || 'pt';
const TEXTRACT_DETECT_TEXT_COST_USD = 0.0015;
const TEXTRACT_FORMS_COST_USD = 0.05;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*'
};

const normalizeEvent = (event) => {
  if (!event) return {};
  if (event.body) {
    try {
      return JSON.parse(event.body);
    } catch (error) {
      console.warn('Failed to parse event.body, using raw event', error);
    }
  }
  return event;
};

const NF_PATTERNS = [
  /\bNF(?:-?E)?\b[^\d]{0,10}([\d.,]{3,20})/,
  /\bNFE\b[^\d]{0,10}([\d.,]{3,20})/,
  /\bN[º°]?\s*NF(?:-?E)?\b[^\d]{0,10}([\d.,]{3,20})/,
  /\bN[ÚU]MERO\s+DA\s+NF(?:-?E)?\b[^\d]{0,10}([\d.,]{3,20})/,
  /\bNOTA\s+FISCAL(?:\s+ELETRONICA|\s+ELETRÔNICA)?\b[^\d]{0,10}([\d.,]{3,20})/,
  /(?:N[\sº°:#.-]*(?:DA\s+NOTA\s+FISCAL|NF|NFE|NFCE)?[\sº°:#.-]*)([\d.,]{3,20})/,
  /(?:N[ÚU]MERO|NUMERO)[^\d]{0,5}([\d.,]{3,20})/,
  /(?:DOCUMENTO)[^\d]{0,5}([\d.,]{3,20})/
];



const CLIENTE_KEYWORD_PRIORITIES = [
  ['DESTINATARIO', 'DESTINAT\u00c1RIO', 'CLIENTE', 'COMPRADOR', 'CONSUMIDOR', 'NOME DO DESTINATARIO', 'NOME DO DESTINAT\u00c1RIO'],
  ['TOMADOR']
];

const CLIENTE_LINE_PATTERNS = [
  /(NOME\s+DO\s+DESTINAT(?:ARIO|\u00c1RIO)|DESTINAT(?:ARIO|\u00c1RIO)|CLIENTE|COMPRADOR|CONSUMIDOR)[\s:.-]+([A-Z0-9\s&'.-]+)/,
  /(TOMADOR)[\s:.-]+([A-Z0-9\s&'.-]+)/
];

const CLIENTE_KEYWORD_ONLY_PATTERNS = [
  /^(NOME\s+DO\s+DESTINAT(?:ARIO|\u00c1RIO)|DESTINAT(?:ARIO|\u00c1RIO)|CLIENTE|COMPRADOR|CONSUMIDOR|TOMADOR)[\s:.-]*$/
];

const CLIENTE_IGNORE_TOKENS = [
  'CPF',
  'CNPJ',
  'CEP',
  'IE',
  'RG',
  'ENDERECO',
  'ENDEREÇO',
  'LOGRADOURO',
  'RUA',
  'RODOVIA',
  'AVENIDA',
  'AV',
  'ALAMEDA',
  'TRAVESSA',
  'TV',
  'NUMERO',
  'NÚMERO',
  'NUM',
  'COMPLEMENTO',
  'BAIRRO',
  'CIDADE',
  'UF',
  'ESTADO',
  'PAIS',
  'PAÍS',
  'TELEFONE',
  'FONE',
  'CELULAR',
  'EMAIL',
  'E-MAIL',
  'PEDIDO',
  'PEDIDO:',
  'CODIGO',
  'CÓDIGO',
  'CHAVE',
  'NOTA',
  'NF',
  'VOLUME',
  'VOLUMES',
  'PESO',
  'DATA',
  'HORA',
  'TRANSPORTADORA',
  'RAZAO SOCIAL',
  'RAZÃO SOCIAL'
];

const ADDRESS_KEYWORDS = [
  'ENDERECO',
  'ENDEREÇO',
  'LOGRADOURO',
  'RUA',
  'AVENIDA',
  'AV ',
  'AV.',
  'RODOVIA',
  'ALAMEDA',
  'TRAVESSA',
  'BAIRRO',
  'COMPLEMENTO',
  'NUMERO',
  'NÚMERO',
  'CEP',
  'CIDADE',
  'UF',
  'ESTADO',
  'PAÍS'
];

const DOCUMENT_KEYWORDS = ['CPF', 'CNPJ', 'RG', 'IE'];

const CLIENTE_STOPWORDS = [
  'MERCADO LIVRE',
  'MERCADO ENVIOS',
  'MERCADO ENVÍOS',
  'FULL',
  'SHIPMENT',
  'ETIQUETA',
  'DESTINO',
  'ORIGEM'
];

const cleanNFValue = (value) => {
  if (!value) {
    return '';
  }

  let sanitized = value.toUpperCase();
  sanitized = sanitized.replace(/S[ÉE]RIE.*$/i, '');
  sanitized = sanitized.replace(/[^\d]/g, '');

  if (sanitized.length >= 3 && sanitized.length <= 15) {
    return sanitized;
  }

  return '';
};

const cleanClienteValue = (value) => {
  if (!value) {
    return '';
  }

  let sanitized = value.replace(/\s+/g, ' ').trim();

  sanitized = sanitized
    .replace(/^\s*(DESTINAT(?:ARIO|ÁRIO)|CLIENTE|COMPRADOR|CONSUMIDOR|NOME(?:\s+DO\s+DESTINAT(?:ARIO|ÁRIO))?)\s*[:.-]?\s*/i, '')
    .replace(/^\s*(REMETENTE|EMITENTE|TOMADOR)\s*[:.-]?\s*/i, '');

  for (const token of CLIENTE_IGNORE_TOKENS) {
    const tokenIndex = sanitized.indexOf(` ${token}`);
    if (tokenIndex > 0) {
      sanitized = sanitized.slice(0, tokenIndex).trim();
    }
  }

  sanitized = sanitized.replace(/^[\s:.-]+/g, '').replace(/[\s:.-]+$/g, '').trim();
  sanitized = sanitized.replace(/\s{2,}/g, ' ');

  if (sanitized.length < 3) {
    return '';
  }

  if (!/[A-Z\u00C0-\u00DD]/.test(sanitized)) {
    return '';
  }

  if (/^(?:CPF|CNPJ|CEP|ENDERECO|ENDEREÇO|RUA|AVENIDA|AV)\b/.test(sanitized)) {
    return '';
  }

  return sanitized;
};

const countDigits = (value) => (value.match(/\d/g) || []).length;

const isCpfOrCnpjLike = (value) => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11 || digits.length === 14;
};

const isAddressLike = (value) => {
  const upper = value.toUpperCase();

  if (ADDRESS_KEYWORDS.some((keyword) => upper.includes(keyword))) {
    return true;
  }

  return /\b\d{5}-?\d{3}\b/.test(upper) || /\b(?:RUA|AV|AVENIDA|ALAMEDA|TRAVESSA)\b.*\d+/i.test(upper);
};

const isDocumentLike = (value) => {
  const upper = value.toUpperCase();
  return DOCUMENT_KEYWORDS.some((keyword) => upper.includes(keyword)) || isCpfOrCnpjLike(upper);
};

const isLikelyClienteName = (value) => {
  if (!value) {
    return false;
  }

  const upper = value.toUpperCase();
  const digits = countDigits(upper);
  const words = upper.split(/\s+/).filter(Boolean);

  if (isDocumentLike(upper) || isAddressLike(upper)) {
    return false;
  }

  if (CLIENTE_STOPWORDS.some((word) => upper.includes(word)) && words.length < 3) {
    return false;
  }

  if (digits >= Math.ceil(upper.length * 0.35)) {
    return false;
  }

  if (words.length === 1 && upper.length < 5) {
    return false;
  }

  return true;
};

const buildClienteCandidate = ({ value, source, confidence = 0, priorityBoost = 0 }) => {
  const cleaned = cleanClienteValue(value);
  if (!cleaned || !isLikelyClienteName(cleaned)) {
    return null;
  }

  return {
    value: cleaned,
    source,
    confidence,
    score: (confidence || 0) + priorityBoost
  };
};

const deriveNfFromChave = (chaveAcesso) => {
  if (!chaveAcesso || chaveAcesso.length !== 44) {
    return '';
  }

  // nNF ocupa as posições 26-34 (1-based) da chave de acesso NF-e
  const nfCandidate = chaveAcesso.slice(25, 34);
  return cleanNFValue(nfCandidate);
};

const collectAccessKeyDigits = (lines, startIndex) => {
  let digits = '';

  for (let i = startIndex; i < lines.length && digits.length < 44; i += 1) {
    const line = lines[i];

    // Ignorar linhas de série ou descrições curtas
    if (/SERIE|SÉRIE/.test(line)) {
      continue;
    }

    const lineDigits = line.replace(/\D/g, '');
    if (!lineDigits) {
      continue;
    }

    // Evitar anexar segmentos muito curtos antes de encontrar a chave
    if (digits.length === 0 && lineDigits.length < 8) {
      continue;
    }

    digits += lineDigits;
  }

  return digits.length >= 44 ? digits.slice(0, 44) : '';
};

const extractNfFromKeywordContext = (lines, lineIndex) => {
  const current = lines[lineIndex];
  const inlineDigits = current.replace(/\D/g, '');
  const inlineCleaned = cleanNFValue(inlineDigits);
  if (inlineCleaned) {
    return inlineCleaned;
  }

  const maxLookahead = Math.min(lines.length - 1, lineIndex + 3);
  for (let i = lineIndex + 1; i <= maxLookahead; i += 1) {
    const line = lines[i];
    if (/CHAVE/.test(line)) {
      continue;
    }
    const lineDigits = line.replace(/\D/g, '');
    const cleaned = cleanNFValue(lineDigits);
    if (cleaned) {
      return cleaned;
    }
  }

  return '';
};

const extractNFData = (lines) => {
  let nfNumber = '';
  let chaveAcesso = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (!chaveAcesso && line.includes('CHAVE DE ACESSO')) {
      const keyCandidate = collectAccessKeyDigits(lines, i + 1);
      if (keyCandidate.length === 44) {
        chaveAcesso = keyCandidate;
      }
    }

    if (!chaveAcesso) {
      const inlineDigits = line.replace(/\D/g, '');
      if (inlineDigits.length === 44) {
        chaveAcesso = inlineDigits;
      }
    }

    if (!nfNumber) {
      if (line.includes('CHAVE')) {
        continue;
      }

      for (const pattern of NF_PATTERNS) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const cleaned = cleanNFValue(match[1]);
          if (cleaned) {
            nfNumber = cleaned;
            break;
          }
        }
      }

      if (!nfNumber && (/\bNF(?:-?E)?\b/.test(line) || line.includes('NOTA FISCAL'))) {
        const keywordExtracted = extractNfFromKeywordContext(lines, i);
        if (keywordExtracted) {
          nfNumber = keywordExtracted;
        }
      }
    }

    if (nfNumber && chaveAcesso) {
      break;
    }
  }

  if (!nfNumber && chaveAcesso) {
    nfNumber = deriveNfFromChave(chaveAcesso);
  }

  return { nfNumber, chaveAcesso };
};

const extractClienteFromLines = (lines) => {
  const candidates = [];

  for (const pattern of CLIENTE_LINE_PATTERNS) {
    for (const raw of lines) {
      const match = raw.match(pattern);
      if (match) {
        const candidate = buildClienteCandidate({
          value: match[2],
          source: 'line_regex',
          priorityBoost: 25
        });
        if (candidate) {
          candidates.push(candidate);
        }
      }
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    if (!CLIENTE_KEYWORD_ONLY_PATTERNS.some((pattern) => pattern.test(raw))) {
      continue;
    }

    const maxLookahead = Math.min(lines.length - 1, i + 2);
    for (let j = i + 1; j <= maxLookahead; j += 1) {
      const candidate = buildClienteCandidate({
        value: lines[j],
        source: 'line_keyword_lookahead',
        priorityBoost: 20 - (j - i)
      });
      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score || b.value.length - a.value.length);
  return candidates[0] || null;
};

const buildBlocksIndex = (blocks) => {
  const map = new Map();
  blocks.forEach((block) => {
    if (block.Id) {
      map.set(block.Id, block);
    }
  });
  return map;
};

const extractTextFromBlock = (block, blocksMap) => {
  if (!block) return '';
  if (block.Text) {
    return block.Text.toUpperCase();
  }

  const parts = [];
  if (Array.isArray(block.Relationships)) {
    block.Relationships.forEach((rel) => {
      if (rel.Type === 'CHILD') {
        rel.Ids.forEach((childId) => {
          const child = blocksMap.get(childId);
          if (child?.Text) {
            parts.push(child.Text.toUpperCase());
          }
        });
      }
    });
  }
  return parts.join(' ').trim();
};

const extractClienteFromKeyValue = (blocks, blocksMap) => {
  const prioritizedMatches = new Array(CLIENTE_KEYWORD_PRIORITIES.length).fill(null);

  const getPriority = (label) => {
    for (let i = 0; i < CLIENTE_KEYWORD_PRIORITIES.length; i += 1) {
      if (CLIENTE_KEYWORD_PRIORITIES[i].some((kw) => label.includes(kw))) {
        return i;
      }
    }
    return -1;
  };

  for (const block of blocks) {
    if (block.BlockType !== 'KEY_VALUE_SET' || !block.EntityTypes?.includes('KEY')) {
      continue;
    }

    const label = extractTextFromBlock(block, blocksMap);
    const priority = getPriority(label);
    if (priority === -1 || prioritizedMatches[priority]) {
      continue;
    }

    const valueRelationship = block.Relationships?.find((rel) => rel.Type === 'VALUE');
    if (!valueRelationship) {
      continue;
    }

    for (const valueId of valueRelationship.Ids || []) {
      const valueBlock = blocksMap.get(valueId);
      const valueText = extractTextFromBlock(valueBlock, blocksMap);
      if (valueText) {
        const candidate = buildClienteCandidate({
          value: valueText,
          source: 'textract_key_value',
          confidence: valueBlock?.Confidence || block?.Confidence || 0,
          priorityBoost: 30 - (priority * 5)
        });
        if (candidate) {
          prioritizedMatches[priority] = candidate;
          break;
        }
      }
    }

    if (prioritizedMatches[0]) {
      break;
    }
  }

  return prioritizedMatches.find(Boolean);
};

const extractClienteWithComprehend = async (text) => {
  if (!text) {
    return null;
  }

  try {
    const command = new DetectEntitiesCommand({
      Text: text.slice(0, 4500),
      LanguageCode: comprehendLanguage
    });
    const { Entities = [] } = await comprehend.send(command);

    const candidate = Entities
      .filter((entity) => ['PERSON', 'ORGANIZATION'].includes(entity.Type))
      .sort((a, b) => (b.Score || 0) - (a.Score || 0))[0];

    if (candidate) {
      return buildClienteCandidate({
        value: candidate.Text.toUpperCase(),
        source: `comprehend_${candidate.Type.toLowerCase()}`,
        confidence: (candidate.Score || 0) * 100,
        priorityBoost: 0
      });
    }
  } catch (error) {
    console.warn('Comprehend detectEntities failed', error);
  }

  return null;
};

const streamToBuffer = async (body) => {
  if (!body) {
    return Buffer.from([]);
  }

  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (typeof body.transformToByteArray === 'function') {
    const uint8 = await body.transformToByteArray();
    return Buffer.from(uint8);
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    body.on('data', (chunk) => chunks.push(chunk));
    body.on('error', reject);
    body.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

const collectClienteCandidatesFromRawLines = (lines) => {
  return lines
    .map((line, index) => buildClienteCandidate({
      value: line,
      source: `line_fallback_${index}`,
      priorityBoost: Math.max(0, 10 - index)
    }))
    .filter(Boolean)
    .slice(0, 5);
};

const extractNormalizedLines = (blocks) => {
  return blocks
    .filter((block) => block.BlockType === 'LINE' && block.Text)
    .map((block) => block.Text.toUpperCase().replace(/\s+/g, ' ').trim())
    .filter(Boolean);
};

const emitOcrUsageLog = ({
  key,
  nfNumber,
  clienteNome,
  clienteSource,
  usedForms,
  usedComprehend,
  formsReason,
  estimatedTextractCostUsd
}) => {
  const mode = usedForms ? 'forms_fallback' : 'detect_text_only';
  const metricLog = {
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [
        {
          Namespace: 'PackFlow/OCR',
          Dimensions: [['Function', 'Mode', 'UsedForms']],
          Metrics: [
            { Name: 'Requests', Unit: 'Count' },
            { Name: 'EstimatedTextractCostUSD', Unit: 'None' },
            { Name: 'FormsFallbackRequests', Unit: 'Count' }
          ]
        }
      ]
    },
    Function: process.env.AWS_LAMBDA_FUNCTION_NAME || 'danfeTextract',
    Mode: mode,
    UsedForms: usedForms ? 'yes' : 'no',
    Requests: 1,
    EstimatedTextractCostUSD: Number(estimatedTextractCostUsd.toFixed(4)),
    FormsFallbackRequests: usedForms ? 1 : 0,
    OcrKey: key,
    FoundNF: nfNumber ? 'yes' : 'no',
    FoundCliente: clienteNome ? 'yes' : 'no',
    ClienteSource: clienteSource || 'none',
    UsedComprehend: usedComprehend ? 'yes' : 'no',
    FormsReason: formsReason || 'not_needed'
  };

  console.log(JSON.stringify(metricLog));
};

exports.handler = async (event) => {
  try {
    const payload = normalizeEvent(event);
    const bucket = payload.bucket || process.env.STORAGE_PACKFLOWSTORAGE_BUCKETNAME;
    const { key } = payload;

    if (!key) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Missing object key for Textract analysis.' })
      };
    }

    const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const documentBytes = await streamToBuffer(Body);

    const detectTextCommand = new DetectDocumentTextCommand({
      Document: {
        Bytes: documentBytes
      }
    });

    const { Blocks: detectBlocks = [] } = await textract.send(detectTextCommand);
    let blocks = detectBlocks;
    let blocksMap = buildBlocksIndex(blocks);
    let lines = extractNormalizedLines(blocks);
    let fullText = lines.join('\n');

    let { nfNumber, chaveAcesso } = extractNFData(lines);
    let clienteKeyValue = null;
    let clienteFromLines = extractClienteFromLines(lines);
    let clienteFromComprehend = null;
    let usedForms = false;
    let formsReason = null;

    // Use o OCR simples primeiro; o modo FORMS é bem mais caro e so entra quando necessario.
    const shouldRunForms = !clienteFromLines || !nfNumber;
    if (!clienteFromLines) {
      formsReason = 'missing_cliente';
    } else if (!nfNumber) {
      formsReason = 'missing_nf';
    }

    if (shouldRunForms) {
      usedForms = true;
      const analyzeCommand = new AnalyzeDocumentCommand({
        FeatureTypes: ['FORMS'],
        Document: {
          Bytes: documentBytes
        }
      });

      const { Blocks: analyzeBlocks = [] } = await textract.send(analyzeCommand);
      if (analyzeBlocks.length > 0) {
        blocks = analyzeBlocks;
        blocksMap = buildBlocksIndex(blocks);
        lines = extractNormalizedLines(blocks);
        fullText = lines.join('\n');
        ({ nfNumber, chaveAcesso } = extractNFData(lines));
        clienteKeyValue = extractClienteFromKeyValue(blocks, blocksMap);
        clienteFromLines = clienteFromLines || extractClienteFromLines(lines);
      }
    }

    if (!clienteKeyValue && !clienteFromLines) {
      clienteFromComprehend = await extractClienteWithComprehend(fullText);
    }

    const clienteCandidates = [
      clienteKeyValue,
      clienteFromLines,
      clienteFromComprehend,
      ...collectClienteCandidatesFromRawLines(lines)
    ].filter(Boolean);

    clienteCandidates.sort((a, b) => b.score - a.score || b.value.length - a.value.length);

    const clienteData = clienteCandidates[0] || null;

    const clienteNome = clienteData?.value || '';
    const estimatedTextractCostUsd = TEXTRACT_DETECT_TEXT_COST_USD + (usedForms ? TEXTRACT_FORMS_COST_USD : 0);

    emitOcrUsageLog({
      key,
      nfNumber,
      clienteNome,
      clienteSource: clienteData?.source || null,
      usedForms,
      usedComprehend: Boolean(clienteFromComprehend),
      formsReason,
      estimatedTextractCostUsd
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        key,
        bucket,
        nf_number: nfNumber,
        chave_acesso: chaveAcesso,
        cliente_nome: clienteNome,
        cliente_source: clienteData?.source || null,
        cliente_confidence: clienteData?.confidence ?? null,
        cliente_candidates: clienteCandidates.slice(0, 5).map((candidate) => ({
          value: candidate.value,
          source: candidate.source,
          confidence: candidate.confidence,
          score: candidate.score
        })),
        lines
      })
    };
  } catch (error) {
    console.error('Textract analysis failed', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Textract analysis failed', error: error.message })
    };
  }
};


