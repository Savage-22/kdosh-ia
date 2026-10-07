import { useEffect, useState } from 'react'

import Conversation from './domains/lab/components/Conversation.jsx'
import DocumentWorkbench from './domains/lab/components/DocumentWorkbench.jsx'
import Icon from './domains/lab/components/Icon.jsx'
import UsageMetrics from './domains/lab/components/UsageMetrics.jsx'
import { askDocuments, deleteDocument, getDocuments, getModels, getUsageSummary, sendChat, uploadDocument } from './domains/lab/api/labApi.js'
import './App.css'

const DEFAULT_SYSTEM_PROMPT = 'Eres el asistente de Kdosh. Responde únicamente usando el contexto documental proporcionado. Si el contexto no contiene la información necesaria, di claramente: "No encuentro esa información en los documentos cargados." No inventes datos. Responde en español, salvo que el usuario solicite otro idioma.'

function App() {
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [documents, setDocuments] = useState([])
  const [question, setQuestion] = useState('')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [ragAnswer, setRagAnswer] = useState(null)
  const [activeView, setActiveView] = useState('lab')
  const [usage, setUsage] = useState([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [isSendingChat, setIsSendingChat] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [isLoadingUsage, setIsLoadingUsage] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadInitialData = async () => {
      try {
        const [modelData, documentData] = await Promise.all([getModels(), getDocuments()])
        if (!isMounted) return
        setModels(modelData)
        setDocuments(documentData)
        setSelectedModel(modelData[0]?.id || '')
      } catch (requestError) {
        if (isMounted) setError(requestError.message)
      } finally {
        if (isMounted) setIsLoadingModels(false)
      }
    }

    loadInitialData()
    return () => { isMounted = false }
  }, [])

  const visibleModels = models.filter((model) => model.id.toLowerCase().includes(modelSearch.toLowerCase()) || model.name?.toLowerCase().includes(modelSearch.toLowerCase()))
  const selectedModelData = models.find((model) => model.id === selectedModel)

  const loadUsage = async () => {
    setIsLoadingUsage(true)
    setError('')
    try {
      setUsage(await getUsageSummary())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoadingUsage(false)
    }
  }

  const handleViewChange = (view) => {
    setActiveView(view)
    if (view === 'usage') loadUsage()
  }

  const handleChatSubmit = async (event) => {
    event.preventDefault()
    if (!chatInput.trim() || !selectedModel) return

    const nextMessages = [...messages, { role: 'user', content: chatInput.trim() }]
    setMessages(nextMessages)
    setChatInput('')
    setIsSendingChat(true)
    setError('')

    try {
      const completion = await sendChat({ model: selectedModel, messages: nextMessages })
      const content = completion.choices?.[0]?.message?.content || 'El modelo no devolvió contenido.'
      setMessages((currentMessages) => [...currentMessages, { role: 'assistant', content }])
      loadUsage()
    } catch (requestError) {
      setMessages(messages)
      setError(requestError.message)
    } finally {
      setIsSendingChat(false)
    }
  }

  const handleUpload = async (file) => {
    setIsUploading(true)
    setError('')
    try {
      const document = await uploadDocument(file)
      setDocuments((currentDocuments) => [...currentDocuments, document])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveDocument = async (id) => {
    setError('')
    try {
      await deleteDocument(id)
      setDocuments((currentDocuments) => currentDocuments.filter((document) => document.id !== id))
      setRagAnswer(null)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleRagSubmit = async (event) => {
    event.preventDefault()
    if (!question.trim() || !selectedModel) return

    setIsAsking(true)
    setError('')
    setRagAnswer(null)
    try {
      const result = await askDocuments({ model: selectedModel, question: question.trim(), systemPrompt })
      setRagAnswer(result)
      loadUsage()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsAsking(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Kdosh IA Lab inicio"><span>K</span><b>Kdosh</b><em>IA</em></a>
        <nav aria-label="Navegación principal"><button className={activeView === 'lab' ? 'active' : ''} type="button" onClick={() => handleViewChange('lab')}>Probar IA</button><button className={activeView === 'usage' ? 'active' : ''} type="button" onClick={() => handleViewChange('usage')}>Costos</button></nav>
        <div className="api-indicator"><i /> Router activo</div>
      </header>

      {error && <div className="error-banner" role="alert"><strong>La solicitud no se completó.</strong> {error}<button type="button" onClick={() => setError('')} aria-label="Cerrar aviso"><Icon name="close" size={16} /></button></div>}

      {activeView === 'lab' ? <>
        <section className="intro" id="top"><div className="page-heading"><div><span className="heading-mark" /><h1>Probar IA</h1></div><p>{models.length} modelos detectados</p></div><p className="lab-description">Elige un modelo, conversa directamente o contrástalo con el contenido de un PDF de Kdosh. Cada respuesta registra tokens y costo para comparar resultados.</p></section>
        <section className="model-console" aria-label="Selector de modelo">
          <div className="model-console-title"><Icon name="spark" size={20} /><div><p className="section-label">Motor activo</p><strong>{isLoadingModels ? 'Cargando catálogo...' : selectedModelData?.name || 'Selecciona un modelo'}</strong></div></div>
          <div className="model-controls"><input value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} placeholder="Filtrar modelos" aria-label="Filtrar modelos" /><select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} disabled={isLoadingModels} aria-label="Modelo seleccionado">{visibleModels.length === 0 && <option value="">No hay coincidencias</option>}{visibleModels.map((model) => <option value={model.id} key={model.id}>{model.name || model.id}</option>)}</select></div>
          <p className="model-id">{selectedModel || 'El backend no devolvió modelos'} <span>Modelo seleccionado</span></p>
        </section>
        <div className="lab-grid"><Conversation messages={messages} input={chatInput} isLoading={isSendingChat} onInputChange={setChatInput} onSubmit={handleChatSubmit} /><DocumentWorkbench documents={documents} question={question} systemPrompt={systemPrompt} answer={ragAnswer} isLoading={isAsking} isUploading={isUploading} onQuestionChange={setQuestion} onSystemPromptChange={setSystemPrompt} onAsk={handleRagSubmit} onUpload={handleUpload} onRemove={handleRemoveDocument} /></div>
      </> : <UsageMetrics usage={usage} isLoading={isLoadingUsage} onRefresh={loadUsage} />}

      <footer><span>Los PDFs se procesan temporalmente en el backend.</span><span>El modelo recibe solo los fragmentos recuperados.</span></footer>
    </main>
  )
}

export default App
