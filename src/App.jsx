import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CollectionManager from './components/CollectionManager'
import SharePage from './pages/SharePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CollectionManager />} />
        <Route path="/share/:token" element={<SharePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
