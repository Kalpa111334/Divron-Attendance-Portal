import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, LogIn, LogOut, History, Calendar, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import LeaveRequestForm from '../components/LeaveRequestForm';
import LeaveRequestsTable from '../components/LeaveRequestsTable';
import type { AttendanceRecord, LeaveRequest } from '../types';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'employee') {
      navigate('/');
      return;
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    loadData();

    return () => clearInterval(timer);
  }, [user]);

  const loadData = () => {
    if (!user) return;

    // Load attendance data
    const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    const todayAttendance = attendance.find(
      (record: AttendanceRecord) =>
        record.employeeId === user.id && record.date === today
    );
    
    const userHistory = attendance.filter(
      (record: AttendanceRecord) => record.employeeId === user.id
    );

    // Load leave requests
    const requests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
    const userRequests = requests.filter(
      (request: LeaveRequest) => request.employeeId === user.id
    );

    setTodayRecord(todayAttendance || null);
    setAttendanceHistory(userHistory);
    setLeaveRequests(userRequests);
  };

  const handleCheckIn = () => {
    if (!user) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString();

    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      employeeId: user.id,
      employeeName: user.name,
      checkIn: time,
      checkOut: null,
      date: today,
    };

    const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
    attendance.push(newRecord);
    localStorage.setItem('attendance', JSON.stringify(attendance));

    toast.success('Checked in successfully!');
    loadData();
  };

  const handleCheckOut = () => {
    if (!user || !todayRecord) return;

    const now = new Date();
    const time = now.toLocaleTimeString();

    const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
    const updatedAttendance = attendance.map((record: AttendanceRecord) =>
      record.id === todayRecord.id
        ? { ...record, checkOut: time }
        : record
    );

    localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
    toast.success('Checked out successfully!');
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold font-poppins">Employee Dashboard</h1>
          <button
            onClick={logout}
            className="bg-primary-500 px-4 py-2 rounded-lg hover:bg-primary-700 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container mx-auto p-6 space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="text-primary-600" size={32} />
              <div>
                <p className="text-3xl font-bold text-gray-800 font-poppins">
                  {currentTime.toLocaleTimeString()}
                </p>
                <p className="text-gray-500">
                  {currentTime.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-4 justify-center w-full max-w-md">
              <button
                onClick={handleCheckIn}
                disabled={!!todayRecord}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium ${
                  todayRecord
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all'
                }`}
              >
                <LogIn size={20} />
                Check In
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!todayRecord || !!todayRecord?.checkOut}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium ${
                  !todayRecord || !!todayRecord?.checkOut
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all'
                }`}
              >
                <LogOut size={20} />
                Check Out
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Today's Status</h3>
            {todayRecord ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Check In Time</p>
                  <p className="text-lg font-semibold">{todayRecord.checkIn}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Check Out Time</p>
                  <p className="text-lg font-semibold">
                    {todayRecord.checkOut || 'Not checked out'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No attendance recorded for today</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="text-primary-600" size={24} />
              <h2 className="text-xl font-semibold">Leave Requests</h2>
            </div>
            <button
              onClick={() => setShowLeaveForm(!showLeaveForm)}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} />
              New Request
            </button>
          </div>

          {showLeaveForm && (
            <div className="mb-6">
              <LeaveRequestForm onSubmit={() => {
                setShowLeaveForm(false);
                loadData();
              }} />
            </div>
          )}

          <LeaveRequestsTable requests={leaveRequests} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <History className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold">Attendance History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceHistory
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => {
                    let duration = 'N/A';
                    if (record.checkIn && record.checkOut) {
                      const checkIn = new Date(`${record.date} ${record.checkIn}`);
                      const checkOut = new Date(`${record.date} ${record.checkOut}`);
                      const diff = checkOut.getTime() - checkIn.getTime();
                      const hours = Math.floor(diff / (1000 * 60 * 60));
                      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                      duration = `${hours}h ${minutes}m`;
                    }

                    return (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.checkIn}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.checkOut || 'Not checked out'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{duration}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;