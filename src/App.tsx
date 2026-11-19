import { NavLink, Route, Routes } from 'react-router-dom';
import { useApp } from './state/AppContext';
import Dashboard from './pages/Dashboard';
import Curriculum from './pages/Curriculum';
import Roadmap from './pages/Roadmap';
import ResourcesPage from './pages/ResourcesPage';
import LabsPage from './pages/LabsPage';
import Planner from './pages/Planner';
import MockExams from './pages/MockExams';
import Notes from './pages/Notes';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const nav = [
  ['/', 'Dashboard'],
  ['/curriculum', 'CKA Curriculum'],
  ['/roadmap', 'Learning Roadmap'],
  ['/resources', 'Courses & Resources'],
  ['/labs', 'Hands-on Labs'],
  ['/planner', 'Daily Study Planner'],
  ['/mock-exams', 'Mock Exams'],
  ['/notes', 'Notes'],
  ['/reports', 'Progress Reports'],
  ['/settings', 'Settings'],
] as const;

export default function App() {
  const { state, setTheme } = useApp();
  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sticky top-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-bold text-lg">CKA Study Planner</h1>
            <p className="text-xs text-slate-500">Exam prep dashboard</p>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button className="btn w-full" onClick={() => setTheme(state.settings.theme === 'dark' ? 'light' : 'dark')}>
            {state.settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
          <p className="text-xs text-slate-500 mt-3">Data stored locally in your browser (LocalStorage). Export regularly from Settings.</p>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/labs" element={<LabsPage />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/mock-exams" element={<MockExams />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
