import { useState } from 'react'
import FalcoAlertsDashboard from './FalcoAlertsDashboard';
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <FalcoAlertsDashboard />
    </>
  )
}

export default App
