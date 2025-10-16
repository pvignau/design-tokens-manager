import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { TokensPage } from './pages/TokensPage';
import { ServerStatus } from './components/ServerStatus';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header with Navigation */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Design Tokens Manager</h1>
              <p className="text-sm text-gray-600 mt-1">
                Create, manage, and export design tokens following the DTCG standard
              </p>
            </div>
            <Navigation />
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<TokensPage />} />
            <Route path="/status" element={
              <div className="flex-1 p-6 overflow-auto">
                <ServerStatus />
              </div>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
