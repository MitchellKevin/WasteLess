import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Onboarding from './components/Onboarding'
import Today from './pages/Today'
import Pantry from './pages/Pantry'
import ItemDetail from './pages/ItemDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import AddItem from './pages/AddItem'
import BulkAdd from './pages/BulkAdd'
import ReceiptScanner from './pages/ReceiptScanner'
import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'
import ShoppingList from './pages/ShoppingList'
import Impact from './pages/Impact'
import Goals from './pages/Goals'
import Household from './pages/Household'
import Settings from './pages/Settings'
import NotificationSettings from './pages/NotificationSettings'
import Plus from './pages/Plus'

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
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding_done'))

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
          <Route path="/" element={<PrivateRoute><Today /></PrivateRoute>} />
          <Route path="/pantry" element={<PrivateRoute><Pantry /></PrivateRoute>} />
          <Route path="/item/:id" element={<PrivateRoute><ItemDetail /></PrivateRoute>} />
          <Route path="/add" element={<PrivateRoute><AddItem /></PrivateRoute>} />
          <Route path="/bulk-add" element={<PrivateRoute><BulkAdd /></PrivateRoute>} />
          <Route path="/receipt" element={<PrivateRoute><ReceiptScanner /></PrivateRoute>} />
          <Route path="/recipes" element={<PrivateRoute><Recipes /></PrivateRoute>} />
          <Route path="/recipes/:id" element={<PrivateRoute><RecipeDetail /></PrivateRoute>} />
          <Route path="/shopping" element={<PrivateRoute><ShoppingList /></PrivateRoute>} />
          <Route path="/impact" element={<PrivateRoute><Impact /></PrivateRoute>} />
          <Route path="/stats" element={<Navigate to="/impact" replace />} />
          <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
          <Route path="/household" element={<PrivateRoute><Household /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/settings/notifications" element={<PrivateRoute><NotificationSettings /></PrivateRoute>} />
          <Route path="/plus" element={<PrivateRoute><Plus /></PrivateRoute>} />
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
