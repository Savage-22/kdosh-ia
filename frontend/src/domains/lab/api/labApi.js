const request = async (path, options = {}) => {
  const response = await fetch(path, options)
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'No fue posible completar la solicitud')
  }

  return payload.data
}

export const getModels = () => request('/api/openrouter/models')

export const sendChat = (body) => request('/api/openrouter/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const getDocuments = () => request('/api/documents')

export const uploadDocument = (file) => {
  const formData = new FormData()
  formData.append('file', file)

  return request('/api/documents', { method: 'POST', body: formData })
}

export const deleteDocument = (id) => request(`/api/documents/${id}`, { method: 'DELETE' })

export const askDocuments = (body) => request('/api/documents/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const getUsageSummary = () => request('/api/usage/summary')
