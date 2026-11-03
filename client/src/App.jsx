import { Route, Routes } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import EmptyState from './components/EmptyState.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ItemsList from './pages/ItemsList.jsx';
import ItemForm from './pages/ItemForm.jsx';
import ItemDetail from './pages/ItemDetail.jsx';

const NotFound = () => (
  <EmptyState icon={Compass} title="Page not found" message="That address does not lead anywhere." actionLabel="Go to dashboard" to="/" />
);

const App = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/items" element={<ItemsList />} />
        <Route path="/items/new" element={<ItemForm />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/items/:id/edit" element={<ItemForm />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <footer className="border-t border-ink/10 py-6 text-center text-sm text-ink-soft">
      <p>DigitalDeclutter, Backend Development CIA-II</p>
      <p>Dhruva Reddy J, USN: 2102508563</p>
    </footer>
  </div>
);

export default App;
