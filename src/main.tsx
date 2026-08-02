import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// The service worker precaches the app shell, so a newly deployed build
// installs in the background but the open page keeps rendering the old
// one until a reload — meaning a deploy silently doesn't reach the user.
// Reload once when a new worker takes control. `hadController` guards the
// first-ever visit, where controllerchange also fires for the initial
// claim and a reload would be pointless.
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller)
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
