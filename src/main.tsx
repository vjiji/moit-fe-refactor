import ReactDOM from 'react-dom/client'
import App from './App'
import './reset.css'

const rootElement = document.getElementById('root')

if (rootElement != null) {
  ReactDOM.createRoot(rootElement).render(<App />)
}