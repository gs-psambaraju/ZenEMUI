import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ROUTES } from './utils/constants';

// Lazy load all pages for better code splitting
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Epics = React.lazy(() => import('./pages/Epics').then(module => ({ default: module.Epics })));
const EpicDetail = React.lazy(() => import('./pages/EpicDetail').then(module => ({ default: module.EpicDetail })));
const Teams = React.lazy(() => import('./pages/Teams').then(module => ({ default: module.Teams })));
const TeamDetail = React.lazy(() => import('./pages/TeamDetail').then(module => ({ default: module.TeamDetail })));
const Teammates = React.lazy(() => import('./pages/Teammates').then(module => ({ default: module.Teammates })));
const TeammateDetail = React.lazy(() => import('./pages/TeammateDetail').then(module => ({ default: module.TeammateDetail })));
const Releases = React.lazy(() => import('./pages/Releases').then(module => ({ default: module.Releases })));
const Sprints = React.lazy(() => import('./pages/Sprints').then(module => ({ default: module.Sprints })));
const Calendar = React.lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })));
const AdminConnectors = React.lazy(() => import('./pages/AdminConnectors').then(module => ({ default: module.AdminConnectors })));
const AdminConnectorDetail = React.lazy(() => import('./pages/AdminConnectorDetail').then(module => ({ default: module.AdminConnectorDetail })));
const AdminPlanningPeriods = React.lazy(() => import('./pages/AdminPlanningPeriods').then(module => ({ default: module.AdminPlanningPeriods })));
const AdminOkrTypes = React.lazy(() => import('./pages/AdminOkrTypes').then(module => ({ default: module.AdminOkrTypes })));
const AdminHolidayCalendars = React.lazy(() => import('./pages/AdminHolidayCalendars').then(module => ({ default: module.AdminHolidayCalendars })));
const AdminHolidayCalendarDetail = React.lazy(() => import('./pages/AdminHolidayCalendarDetail').then(module => ({ default: module.AdminHolidayCalendarDetail })));
const RefreshProgress = React.lazy(() => import('./pages/RefreshProgress').then(module => ({ default: module.RefreshProgress })));

// Loading component for suspended routes
const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  }>
    {children}
  </Suspense>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          
          {/* Public routes */}
          <Route path={ROUTES.LOGIN} element={
            <SuspenseWrapper>
              <Login />
            </SuspenseWrapper>
          } />
          
          {/* Protected routes */}
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path={ROUTES.EPICS}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <Epics />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path="/epics/:id"
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <EpicDetail />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path={ROUTES.TEAMS}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <Teams />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path="/teams/:id"
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <TeamDetail />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path={ROUTES.TEAMMATES}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <Teammates />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path="/teammates/:id"
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <TeammateDetail />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path={ROUTES.RELEASES}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <Releases />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path={ROUTES.SPRINTS}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <Sprints />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path={ROUTES.CALENDAR}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path={ROUTES.REFRESH_PROGRESS}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <RefreshProgress />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path={ROUTES.ADMIN_CONNECTORS}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <AdminConnectors />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path={ROUTES.ADMIN_CONNECTOR_DETAIL}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <AdminConnectorDetail />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path={ROUTES.ADMIN_PLANNING_PERIODS}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <AdminPlanningPeriods />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path={ROUTES.ADMIN_OKR_TYPES}
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <AdminOkrTypes />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path="/admin/holiday-calendars"
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <AdminHolidayCalendars />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          <Route
            path="/admin/holiday-calendars/:id"
            element={
              <SuspenseWrapper>
                <ProtectedRoute>
                  <AdminHolidayCalendarDetail />
                </ProtectedRoute>
              </SuspenseWrapper>
            }
          />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;