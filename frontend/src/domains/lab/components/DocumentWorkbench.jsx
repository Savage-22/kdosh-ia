import { useRef } from 'react'

import Icon from './Icon.jsx'

function DocumentWorkbench({ documents, question, systemPrompt, answer, isLoading, isUploading, onQuestionChange, onSystemPromptChange, onAsk, onUpload, onRemove }) {
  const inputRef = useRef(null)

  const handleFileChange = async (event) => {
    const [file] = event.target.files
    if (file) await onUpload(file)
    event.target.value = ''
  }

  return (
    <section className="workbench" aria-label="Consulta documental">
      <div className="workbench-header">
        <div>
          <p className="section-label">Contexto documental</p>
          <h2>PDFs de Kdosh</h2>
        </div>
        <button className="upload-trigger" type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          <Icon name="paperclip" size={16} />
          {isUploading ? 'Procesando' : 'Cargar PDF'}
        </button>
        <input ref={inputRef} className="sr-only" type="file" accept="application/pdf" onChange={handleFileChange} />
      </div>

      <div className="document-list">
        {documents.length === 0 ? <p className="empty-documents">Aún no hay documentos. Carga un PDF para activar la consulta documental.</p> : documents.map((document) => (
          <div className="document-row" key={document.id}>
            <Icon name="document" size={18} />
            <div><strong>{document.name}</strong><span>{document.chunkCount} fragmentos</span></div>
            <button type="button" onClick={() => onRemove(document.id)} aria-label={`Eliminar ${document.name}`}><Icon name="close" size={16} /></button>
          </div>
        ))}
      </div>

      <aside className="document-guide">
        <p className="section-label">Cómo trabaja este documento</p>
        <p>El backend extrae el texto del PDF y lo divide en fragmentos temporales. Al preguntar, recupera los fragmentos con más coincidencias y solo esos se envían al modelo junto con el system prompt.</p>
        <ul>
          <li>Máximo 10 MB por PDF.</li>
          <li>Los archivos y fragmentos viven en memoria y se eliminan al reiniciar el backend.</li>
          <li>Esta demo usa coincidencia de términos, no embeddings ni búsqueda semántica.</li>
        </ul>
      </aside>

      <details className="prompt-editor">
        <summary>System prompt de la consulta</summary>
        <textarea value={systemPrompt} onChange={(event) => onSystemPromptChange(event.target.value)} rows="5" />
      </details>

      <form className="rag-form" onSubmit={onAsk}>
        <label htmlFor="document-question">Pregunta sobre los documentos</label>
        <div className="rag-input-row">
          <input id="document-question" value={question} onChange={(event) => onQuestionChange(event.target.value)} placeholder="¿Qué dice el documento sobre...?" disabled={isLoading} />
          <button className="ask-button" type="submit" disabled={isLoading || documents.length === 0 || !question.trim()}>
            {isLoading ? 'Buscando' : 'Consultar'} <Icon name="arrow" size={16} />
          </button>
        </div>
      </form>

      {answer && <div className="rag-answer" aria-live="polite">
        <p className="section-label">Respuesta con contexto</p>
        <p>{answer.answer}</p>
        {answer.sources?.length > 0 && <div className="source-list"><span>Fuentes</span>{answer.sources.map((source) => <small key={`${source.documentId}-${source.chunkIndex}`}>{source.documentName} / fragmento {source.chunkIndex}</small>)}</div>}
      </div>}
    </section>
  )
}

export default DocumentWorkbench
