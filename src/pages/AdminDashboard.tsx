import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Download, UserPlus, UserMinus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  checkIn: string;
  checkOut: string | null;
  date: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '' });
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = () => {
    const storedAttendance = JSON.parse(localStorage.getItem('attendance') || '[]');
    const storedEmployees = JSON.parse(localStorage.getItem('users') || '[]')
      .filter((u: Employee) => u.role === 'employee');
    
    setAttendanceData(storedAttendance);
    setEmployees(storedEmployees);
  };

  const addEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.password) {
      toast.error('Please fill all fields');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const exists = users.some((u: Employee) => u.email === newEmployee.email);

    if (exists) {
      toast.error('Employee already exists');
      return;
    }

    const newUser = {
      id: crypto.randomUUID(),
      ...newEmployee,
      role: 'employee',
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    toast.success('Employee added successfully');
    setNewEmployee({ name: '', email: '', password: '' });
    loadData();
  };

  const removeEmployee = (employeeId: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.filter((u: Employee) => u.id !== employeeId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
    const updatedAttendance = attendance.filter((a: Attendance) => a.employeeId !== employeeId);
    localStorage.setItem('attendance', JSON.stringify(updatedAttendance));

    toast.success('Employee removed successfully');
    loadData();
  };

  const generateReport = () => {
    const doc = new jsPDF();
    const today = new Date();

    let filteredData = [...attendanceData];
    if (reportType === 'daily') {
      const dateStr = today.toISOString().split('T')[0];
      filteredData = attendanceData.filter(a => a.date === dateStr);
    } else if (reportType === 'monthly') {
      const month = today.getMonth();
      const year = today.getFullYear();
      filteredData = attendanceData.filter(a => {
        const date = new Date(a.date);
        return date.getMonth() === month && date.getFullYear() === year;
      });
    } else {
      const year = today.getFullYear();
      filteredData = attendanceData.filter(a => {
        const date = new Date(a.date);
        return date.getFullYear() === year;
      });
    }

    const tableData = filteredData.map(a => [
      a.employeeName,
      a.date,
      a.checkIn,
      a.checkOut || 'Not checked out',
    ]);

    doc.text(`Attendance Report - ${reportType.toUpperCase()}`, 14, 15);
    doc.autoTable({
      head: [['Employee', 'Date', 'Check In', 'Check Out']],
      body: tableData,
      startY: 20,
    });

    doc.save(`attendance-report-${reportType}.pdf`);
    toast.success('Report downloaded successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <button
            onClick={logout}
            className="bg-indigo-500 px-4 py-2 rounded hover:bg-indigo-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container mx-auto p-6 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add New Employee</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                className="w-full p-2 border rounded"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-2 border rounded"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 border rounded"
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
              />
              <button
                onClick={addEmployee}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                <UserPlus size={20} />
                Add Employee
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Generate Report</h2>
            <div className="space-y-4">
              <select
                className="w-full p-2 border rounded"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'daily' | 'monthly' | 'yearly')}
              >
                <option value="daily">Daily Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="yearly">Yearly Report</option>
              </select>
              <button
                onClick={generateReport}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                <Download size={20} />
                Download Report
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Employee List</h2>
            <button
              onClick={loadData}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{employee.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{employee.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => removeEmployee(employee.id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-800"
                      >
                        <UserMinus size={20} />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Attendance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{record.employeeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.checkIn}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.checkOut || 'Not checked out'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;