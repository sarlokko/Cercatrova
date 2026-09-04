import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Footer, Header } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { MonitorPage } from './pages/MonitorPage'
import { ProductPage } from './pages/ProductPage'
import './App.css'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export default function App() {
  return (
    <BrowserRouter basename={basename === '/' ? undefined : basename}>
      <div className="app-shell">
        <Header />
        <main className="site-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cerca" element={<MonitorPage />} />
            <Route path="/monitora" element={<Navigate to="/cerca" replace />} />
            <Route path="/prodotto/:id" element={<ProductPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
