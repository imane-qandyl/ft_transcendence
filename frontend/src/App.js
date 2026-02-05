import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components';
import GameLayout from './components/GameLayout';
import { Home, Login, Register, Character, Matches, Settings, Shop, Notifications } from './pages';
import Play from './pages/Play';
import Profile from './pages/Profile';


function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          {/* Public routes - no game layout */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes - with game layout */}
          <Route
            path="/play"
            element={
              <ProtectedRoute>
                <GameLayout>
                  <Play />
                </GameLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/character"
            element={
              <ProtectedRoute>
                <GameLayout>
                  <Character />
                </GameLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <GameLayout>
                  <Matches />
                </GameLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <GameLayout>
                  <Settings />
                </GameLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <GameLayout>
                  <Profile />
                </GameLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop"
            element={
              <ProtectedRoute>
                <GameLayout>
                  <Shop />
                </GameLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <GameLayout>
                  <Notifications />
                </GameLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/dashboard" element={<Navigate to="/play" replace />} />
          <Route path="/game" element={<Navigate to="/play" replace />} />
          <Route path="/friends" element={<Navigate to="/play" replace />} />
          <Route path="/chat" element={<Navigate to="/play" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
