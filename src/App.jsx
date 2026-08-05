import { Routes, Route } from 'react-router-dom'
import SelecaoOperador from './pages/SelecaoOperador'
import Embalagem from './pages/Embalagem'
import Dashboard from './pages/Dashboard'
import Ranking from './pages/Ranking'
import Evolucao from './pages/Evolucao'
import GestaoOperadores from './pages/GestaoOperadores'
import Configuracoes from './pages/Configuracoes'
import AtualizadorVersao from './components/AtualizadorVersao'

function App() {
  return (
    <>
      <AtualizadorVersao />
      <Routes>
        <Route path="/" element={<SelecaoOperador />} />
        <Route path="/embalagem" element={<Embalagem />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/evolucao" element={<Evolucao />} />
        <Route path="/operadores" element={<GestaoOperadores />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </>
  )
}

export default App
