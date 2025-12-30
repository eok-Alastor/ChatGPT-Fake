import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authUtils } from './utils/auth';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import ChatPage from './pages/ChatPage';
import GroupsPage from './pages/GroupsPage';
import GroupChatPage from './pages/GroupChatPage';
import ModelTestPage from './pages/ModelTestPage';

// 私有路由组件
function PrivateRoute({ children }) {
  return authUtils.isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<WelcomePage />} />
            <Route path="chat/:conversationId" element={<ChatPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="groups/:groupId" element={<GroupChatPage />} />
          </Route>
          {/* 测试页面 - 仅用于调试 */}
          <Route
            path="/test-models"
            element={
              <PrivateRoute>
                <ModelTestPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
