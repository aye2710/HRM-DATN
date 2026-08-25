import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import EmployeeManagement from './pages/EmployeeManagement';
import OrganizationManagement from './pages/OrganizationManagement';

function App() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/organization" element={<OrganizationManagement />} />
        <Route path="/employees" element={<EmployeeManagement />} />
      </Routes>
    </DashboardLayout>
  )
}

export default App;
