import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ProjectProvider } from './contexts/ProjectContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Metadata from './pages/Metadata';
import Notes from './pages/Notes';
import SqlExamples from './pages/SqlExamples';
import Settings from './pages/Settings';
import ProjectManagement from './pages/ProjectManagement';
import Admin from './pages/Admin';
import { useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return !user ? <>{children}</> : <Navigate to="/" />;
};

function AppContent() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Auth Routes */}
            <Route path="login" element={
              <AuthRoute>
                <Login />
              </AuthRoute>
            } />
            <Route path="register" element={
              <AuthRoute>
                <Register />
              </AuthRoute>
            } />
            
            {/* Protected Routes */}
            <Route index element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="metadata" element={
              <ProtectedRoute>
                <Metadata />
              </ProtectedRoute>
            } />
            <Route path="notes" element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            } />
            <Route path="sql-examples" element={
              <ProtectedRoute>
                <SqlExamples />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="projects" element={
              <ProtectedRoute>
                <ProjectManagement />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;