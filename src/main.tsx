import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Tema claro/escuro: segue o sistema, ou a escolha explícita do claude.ai
// (atributo data-theme na raiz) quando a página roda como artifact.
const root = document.documentElement
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
const applyTheme = () => {
  const explicit = root.getAttribute('data-theme')
  root.classList.toggle('dark', explicit ? explicit === 'dark' : darkQuery.matches)
}
applyTheme()
darkQuery.addEventListener('change', applyTheme)
new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
