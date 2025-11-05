import { Routes, Route } from 'react-router-dom'
import SelecaoOperador from './pages/SelecaoOperador'
import Embalagem from './pages/Embalagem'
import Dashboard from './pages/Dashboard'
import Ranking from './pages/Ranking'
import GestaoOperadores from './pages/GestaoOperadores'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SelecaoOperador />} />
      <Route path="/embalagem" element={<Embalagem />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/operadores" element={<GestaoOperadores />} />
    </Routes>
  )
}

export default App
