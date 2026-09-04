import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Footer, Header } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { MonitorPage } from './pages/MonitorPage'
import { ProductPage } from './pages/ProductPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header />
        <main className="site-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/monitora" element={<MonitorPage />} />
            <Route path="/prodotto/:id" element={<ProductPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
