import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout
import AppShell from './components/layout/AppShell';

// Auth pages (public)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';

// Flow pages (auth-gated, no shell)
import Recommendation from './pages/Recommendation';

// App pages (protected, inside shell)
import Overview from './pages/Overview';
import MyRoutes from './pages/MyRoutes';
import RouteDetails from './pages/RouteDetails';
import Skills from './pages/Skills';
import Resources from './pages/Resources';
import CourseDetail from './pages/CourseDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Guide from './pages/Guide';

// 404
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected flow pages (no sidebar shell) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendation"
            element={
              <ProtectedRoute>
                <Recommendation />
              </ProtectedRoute>
            }
          />

          {/* Authenticated app — inside sidebar shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Overview />} />
            <Route path="/overview" element={<Navigate to="/home" replace />} />
            <Route path="/routes" element={<MyRoutes />} />
            <Route path="/routes/:routeId" element={<RouteDetails />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/:resourceId" element={<CourseDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/guide" element={<Guide />} />
          </Route>

          {/* Legacy redirect */}
          <Route path="/profile" element={<Navigate to="/onboarding" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
