// Serviço de integração com Base44 Platform
// Este arquivo simula a integração com o SDK do Base44
// Em produção, você deve importar o SDK real do Base44

class Base44Service {
  constructor() {
    // Configuração do cliente Base44
    this.baseURL = import.meta.env.VITE_BASE44_URL || 'https://api.base44.com'
    this.apiKey = import.meta.env.VITE_BASE44_API_KEY || ''
  }

  // ============ OPERADORES ============
  async listOperadores() {
    try {
      // Em produção: return await base44.entities.Operador.list()
      const response = await fetch(`${this.baseURL}/entities/Operador`, {
        headers: this.getHeaders(),
      })
      return await response.json()
    } catch (error) {
      console.error('Erro ao listar operadores:', error)
      throw error
    }
  }

  async filterOperadores(filters) {
    try {
      // Em produção: return await base44.entities.Operador.filter(filters)
      const response = await fetch(`${this.baseURL}/entities/Operador/filter`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(filters),
      })
      return await response.json()
    } catch (error) {
      console.error('Erro ao filtrar operadores:', error)
      throw error
    }
  }

  async createOperador(data) {
    try {
      // Em produção: return await base44.entities.Operador.create(data)
      const response = await fetch(`${this.baseURL}/entities/Operador`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      })
      return await response.json()
    } catch (error) {
      console.error('Erro ao criar operador:', error)
      throw error
    }
  }

  async updateOperador(id, data) {
    try {
      // Em produção: return await base44.entities.Operador.update(id, data)
      const response = await fetch(`${this.baseURL}/entities/Operador/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      })
      return await response.json()
    } catch (error) {
      console.error('Erro ao atualizar operador:', error)
      throw error
    }
  }

  async deleteOperador(id) {
    try {
      // Em produção: return await base44.entities.Operador.delete(id)
      const response = await fetch(`${this.baseURL}/entities/Operador/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })
      return await response.json()
    } catch (error) {
      console.error('Erro ao deletar operador:', error)
      throw error
    }
  }

  // ============ EMBALAGENS ============
  async listEmbalagens(sortBy = '-created_date') {
    try {
      // Em produção: return await base44.entities.Embalagem.list(sortBy)
      const response = await fetch(`${this.baseURL}/entities/Embalagem?sort=${sortBy}`, {
        headers: this.getHeaders(),
      })
      return await response.json()
    } catch (error) {
      console.error('Erro ao listar embalagens:', error)
      throw error
    }
  }

  async filterEmbalagens(filters) {
    try {
      // Em produção: return await base44.entities.Embalagem.filter(filters)
      const response = await fetch(`${this.baseURL}/entities/Embalagem/filter`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(filters),
      })
      return await response.json()
    } catch (error) {
      console.error('Erro ao filtrar embalagens:', error)
      throw error
    }
  }

  async createEmbalagem(data) {
    try {
      // Em produção: return await base44.entities.Embalagem.create(data)
      const response = await fetch(`${this.baseURL}/entities/Embalagem`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      })
      return await response.json()
    } catch (error) {
      console.error('Erro ao criar embalagem:', error)
      throw error
    }
  }

  async updateEmbalagem(id, data) {
    try {
      // Em produção: return await base44.entities.Embalagem.update(id, data)
      const response = await fetch(`${this.baseURL}/entities/Embalagem/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      })
      return await response.json()
    } catch (error) {
      console.error('Erro ao atualizar embalagem:', error)
      throw error
    }
  }

  // ============ UPLOAD DE ARQUIVOS ============
  async uploadFile(file) {
    try {
      // Em produção: return await base44.integrations.Core.UploadFile({ file })
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${this.baseURL}/integrations/Core/UploadFile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      throw error
    }
  }

  // ============ OCR DE DADOS ============
  async extractDataFromFile(fileUrl, jsonSchema) {
    try {
      // Em produção: return await base44.integrations.Core.ExtractDataFromUploadedFile({
      //   file_url: fileUrl,
      //   json_schema: jsonSchema
      // })
      const response = await fetch(`${this.baseURL}/integrations/Core/ExtractDataFromUploadedFile`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          file_url: fileUrl,
          json_schema: jsonSchema,
        }),
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Erro ao extrair dados:', error)
      throw error
    }
  }

  // ============ HELPERS ============
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    }
  }
}

// Singleton instance
const base44 = new Base44Service()

export default base44
