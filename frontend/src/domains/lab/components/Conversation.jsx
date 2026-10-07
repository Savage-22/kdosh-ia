import ReactMarkdown from 'react-markdown'

import Icon from './Icon.jsx'

function Conversation({ messages, input, isLoading, onInputChange, onSubmit }) {
  return (
    <section className="conversation" aria-label="Conversación general">
      <div className="conversation-header">
        <div>
          <p className="section-label">Conversación</p>
          <h2>Prueba directa</h2>
        </div>
        <span className="live-status"><i /> En línea</span>
      </div>

      <div className="message-list" aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <Icon name="spark" size={24} />
            <p>Elige un modelo y envía un primer mensaje.</p>
          </div>
        ) : messages.map((message, index) => (
          <article className={`message message-${message.role}`} key={`${message.role}-${index}`}>
            <span className="message-role">{message.role === 'user' ? 'Tú' : 'Modelo'}</span>
            <div className="markdown-content"><ReactMarkdown>{message.content}</ReactMarkdown></div>
          </article>
        ))}
        {isLoading && <div className="typing">El modelo está generando una respuesta</div>}
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <textarea value={input} onChange={(event) => onInputChange(event.target.value)} placeholder="Escribe una prueba, por ejemplo: resume qué puede hacer este modelo" rows="3" disabled={isLoading} />
        <button className="send-button" type="submit" disabled={isLoading || !input.trim()} aria-label="Enviar mensaje">
          <Icon name="send" size={19} />
        </button>
      </form>
    </section>
  )
}

export default Conversation
