const icons = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  chat: <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.4 8.4 0 0 1-3.4-.7L4 20l1.5-3.8A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />,
  close: <path d="m7 7 10 10M17 7 7 17" />,
  document: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h5M10 13h5M10 17h5" /></>,
  paperclip: <path d="m8.5 12.5 5.3-5.3a3 3 0 1 1 4.2 4.3l-7 7a4.5 4.5 0 1 1-6.4-6.4l7-7" />,
  send: <path d="m21 3-8.5 18-2.1-7.4L3 10.5zM10.4 13.6 21 3" />,
  spark: <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" />,
}

function Icon({ name, size = 18 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

export default Icon
