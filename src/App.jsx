import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// V5 Layout
import LayoutV5 from './components/LayoutV5';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Inbox from './pages/Inbox';
import Risks from './pages/Risks';
import Financial from './pages/Financial';
import Resources from './pages/Resources';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import GTDReview from './pages/GTDReview';

export default function App() {
    return (
        <AuthProvider>
            {/* Main Router Configuration */}
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<LayoutV5 />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/projects/:id" element={<ProjectDetails />} />
                            <Route path="/inbox" element={<Inbox />} />
                            <Route path="/risks" element={<Risks />} />
                            <Route path="/financial" element={<Financial />} />
                            <Route path="/resources" element={<Resources />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/gtd-review" element={<GTDReview />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
