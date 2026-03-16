param(
  [int]$Limit = 10,
  [string]$Profile = "awsiot",
  [string]$Region = "sa-east-1",
  [switch]$AllRecords
)

$ErrorActionPreference = "Stop"

function Get-ProjectPaths {
  $root = Split-Path -Parent $PSScriptRoot
  return @{
    Root = $root
    AmplifyMeta = Join-Path $root "amplify\backend\amplify-meta.json"
    Output = Join-Path $root "ocr-history-results.json"
    Payload = Join-Path $root "ocr-history-payload.json"
    Response = Join-Path $root "ocr-history-response.json"
  }
}

function Get-AmplifyConfig {
  param(
    [string]$AmplifyMetaPath
  )

  $meta = Get-Content $AmplifyMetaPath -Raw | ConvertFrom-Json

  return @{
    ApiId = $meta.api.testesite.output.GraphQLAPIIdOutput
    GraphqlEndpoint = $meta.api.testesite.output.GraphQLAPIEndpointOutput
    Bucket = $meta.storage.packflowstorage.output.BucketName
    LambdaName = $meta.function.danfeTextract.output.Name
  }
}

function Get-ApiKey {
  param(
    [string]$ApiId,
    [string]$Profile,
    [string]$Region
  )

  $raw = aws appsync list-api-keys --api-id $ApiId --region $Region --profile $Profile
  $parsed = $raw | ConvertFrom-Json
  $apiKey = $parsed.apiKeys | Select-Object -First 1

  if (-not $apiKey) {
    throw "Nenhuma API key encontrada para o AppSync."
  }

  return $apiKey.id
}

function Invoke-Graphql {
  param(
    [string]$Endpoint,
    [string]$ApiKey,
    [string]$Query,
    [hashtable]$Variables
  )

  $headers = @{
    "x-api-key" = $ApiKey
    "Content-Type" = "application/json"
  }

  $body = @{
    query = $Query
    variables = $Variables
  } | ConvertTo-Json -Depth 8 -Compress

  return Invoke-RestMethod -Uri $Endpoint -Method Post -Headers $headers -Body $body
}

function Test-SuspiciousCliente {
  param(
    [string]$ClienteNome
  )

  if ([string]::IsNullOrWhiteSpace($ClienteNome)) {
    return $true
  }

  $upper = $ClienteNome.ToUpperInvariant()

  if ($upper -match '^\d{11,14}$') {
    return $true
  }

  if ($upper -match 'CPF|CNPJ|ENDERE|RUA|AVENIDA|RODOVIA|TRAVESSA|ALAMEDA|CEP|BAIRRO|CIDADE|UF') {
    return $true
  }

  return $false
}

function Get-HistoricalRecords {
  param(
    [string]$Endpoint,
    [string]$ApiKey,
    [int]$Limit,
    [switch]$AllRecords
  )

  $query = @'
query ListEmbalagems(\$limit: Int, \$nextToken: String) {
  listEmbalagems(limit: \$limit, nextToken: \$nextToken) {
    items {
      id
      createdAt
      nf_number
      cliente_nome
      foto_danfe_url
      pendente_extracao
      status
    }
    nextToken
  }
}
'@

  $items = @()
  $nextToken = $null

  do {
    $response = Invoke-Graphql -Endpoint $Endpoint -ApiKey $ApiKey -Query $query -Variables @{
      limit = 100
      nextToken = $nextToken
    }

    $page = $response.data.listEmbalagems
    foreach ($item in $page.items) {
      if (-not $item.foto_danfe_url) {
        continue
      }

      if ($AllRecords -or (Test-SuspiciousCliente -ClienteNome $item.cliente_nome)) {
        $items += $item
      }

      if ($items.Count -ge $Limit) {
        break
      }
    }

    $nextToken = $page.nextToken
  } while ($nextToken -and $items.Count -lt $Limit)

  return $items | Select-Object -First $Limit
}

function Invoke-OcrLambda {
  param(
    [string]$LambdaName,
    [string]$Bucket,
    [string]$Key,
    [string]$Profile,
    [string]$Region,
    [string]$PayloadPath,
    [string]$ResponsePath
  )

  $payload = @{
    bucket = $Bucket
    key = if ($Key.StartsWith("public/")) { $Key } else { "public/$Key" }
  } | ConvertTo-Json -Compress

  Set-Content -Path $PayloadPath -Value $payload -Encoding Ascii

  aws lambda invoke `
    --function-name $LambdaName `
    --region $Region `
    --profile $Profile `
    --cli-binary-format raw-in-base64-out `
    --payload "file://$PayloadPath" `
    $ResponsePath | Out-Null

  $raw = Get-Content $ResponsePath -Raw | ConvertFrom-Json
  return $raw.body | ConvertFrom-Json
}

$paths = Get-ProjectPaths
$config = Get-AmplifyConfig -AmplifyMetaPath $paths.AmplifyMeta
$apiKey = Get-ApiKey -ApiId $config.ApiId -Profile $Profile -Region $Region
$records = Get-HistoricalRecords -Endpoint $config.GraphqlEndpoint -ApiKey $apiKey -Limit $Limit -AllRecords:$AllRecords

if (-not $records -or $records.Count -eq 0) {
  throw "Nenhum registro antigo encontrado para teste."
}

$results = foreach ($record in $records) {
  $ocr = Invoke-OcrLambda `
    -LambdaName $config.LambdaName `
    -Bucket $config.Bucket `
    -Key $record.foto_danfe_url `
    -Profile $Profile `
    -Region $Region `
    -PayloadPath $paths.Payload `
    -ResponsePath $paths.Response

  [PSCustomObject]@{
    createdAt = $record.createdAt
    id = $record.id
    foto_danfe_url = $record.foto_danfe_url
    stored_nf = $record.nf_number
    extracted_nf = $ocr.nf_number
    stored_cliente = $record.cliente_nome
    extracted_cliente = $ocr.cliente_nome
    cliente_source = $ocr.cliente_source
    cliente_confidence = $ocr.cliente_confidence
  }
}

$results | ConvertTo-Json -Depth 6 | Set-Content -Path $paths.Output -Encoding Ascii
$results | Format-Table -AutoSize

Write-Host ""
Write-Host "Resultado salvo em $($paths.Output)"
