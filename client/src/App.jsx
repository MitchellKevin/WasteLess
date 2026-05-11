import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Onboarding from './components/Onboarding'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import AddItem from './pages/AddItem'
import BulkAdd from './pages/BulkAdd'
import Recipes from './pages/Recipes'
import ShoppingList from './pages/ShoppingList'
import Stats from './pages/Stats'
import Household from './pages/Household'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : children
}

function AppRoutes() {
  const { user } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('onboarding_done')
  )

  const handleOnboardingDone = () => {
    localStorage.setItem('onboarding_done', '1')
    setShowOnboarding(false)
  }

  return (
    <>
      <Navbar />
      {user && showOnboarding && <Onboarding onDone={handleOnboardingDone} />}
      <main className="container">
        <Routes>
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/add" element={<PrivateRoute><AddItem /></PrivateRoute>} />
          <Route path="/bulk-add" element={<PrivateRoute><BulkAdd /></PrivateRoute>} />
          <Route path="/recipes" element={<PrivateRoute><Recipes /></PrivateRoute>} />
          <Route path="/shopping" element={<PrivateRoute><ShoppingList /></PrivateRoute>} />
          <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
          <Route path="/household" element={<PrivateRoute><Household /></PrivateRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
