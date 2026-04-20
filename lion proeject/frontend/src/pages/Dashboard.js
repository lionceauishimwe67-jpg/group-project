import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Users, GraduationCap, BookOpen, Award, 
  TrendingUp, Activity, Calendar, Clock 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradeDistribution, setGradeDistribution] = useState({});
  const [recentActivity, setRecentActivity] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats based on role
      if (hasRole(['admin'])) {
        const [statsRes, activityRes, gradeRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/dashboard/recent-activity'),
          api.get('/api/dashboard/grade-distribution')
        ]);
        setStats(statsRes.data);
        setRecentActivity(activityRes.data);
        setGradeDistribution(gradeRes.data);
      } else if (hasRole(['teacher'])) {
        const res = await api.get('/api/dashboard/teacher-stats');
        setStats(res.data);
      } else if (hasRole(['student'])) {
        const res = await api.get('/api/dashboard/student-stats');
        setStats(res.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const gradeChartData = Object.entries(gradeDistribution || {}).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#6B7280'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Admin Dashboard
  if (hasRole(['admin'])) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.firstName}! Here's what's happening.</p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={Users} 
            label="Total Students" 
            value={stats?.totalStudents || 0} 
            trend="+12%" 
            color="blue" 
          />
          <StatCard 
            icon={GraduationCap} 
            label="Total Teachers" 
            value={stats?.totalTeachers || 0} 
            trend="+5%" 
            color="green" 
          />
          <StatCard 
            icon={BookOpen} 
            label="Active Courses" 
            value={stats?.activeCourses || 0} 
            trend="+8%" 
            color="purple" 
          />
          <StatCard 
            icon={Award} 
            label="Average Score" 
            value={stats?.averageScore || 0} 
            trend="+3%" 
            color="orange" 
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grade Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Grade Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {gradeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {gradeChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivity?.recentGrades?.slice(0, 5).map((grade) => (
                <div key={grade._id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      Grade recorded for {grade.student?.studentId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {grade.course?.courseName} - Score: {grade.score}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(grade.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentActivity?.recentGrades || recentActivity.recentGrades.length === 0) && (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton label="Add Student" icon={Users} href="/students" />
            <QuickActionButton label="Add Teacher" icon={GraduationCap} href="/teachers" />
            <QuickActionButton label="Create Course" icon={BookOpen} href="/courses" />
            <QuickActionButton label="Record Grade" icon={Award} href="/grades" />
          </div>
        </div>
      </div>
    );
  }

  // Teacher Dashboard
  if (hasRole(['teacher'])) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.firstName}!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={BookOpen} label="My Courses" value={stats?.totalCourses || 0} color="blue" />
          <StatCard icon={Users} label="Total Students" value={stats?.totalStudents || 0} color="green" />
          <StatCard icon={Award} label="Grades Recorded" value={stats?.totalGrades || 0} color="purple" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">My Courses</h3>
          <div className="space-y-3">
            {stats?.courses?.map((course) => (
              <div key={course._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{course.courseName}</p>
                  <p className="text-sm text-gray-500">{course.courseCode} • {course.credits} Credits</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {course.students?.length || 0} Students
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.firstName}!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={BookOpen} label="Enrolled Courses" value={stats?.totalCourses || 0} color="blue" />
        <StatCard icon={Award} label="Total Grades" value={stats?.totalGrades || 0} color="green" />
        <StatCard icon={TrendingUp} label="Average Score" value={stats?.averageScore || 0} color="purple" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">My Grades</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Course</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.grades?.map((grade) => (
                <tr key={grade._id}>
                  <td className="py-3 px-4 text-sm text-gray-800">{grade.course?.courseName}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 capitalize">{grade.examType}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{grade.score}/{grade.maxScore}</td>
                  <td className="py-3 px-4">
                    <GradeBadge score={grade.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, trend, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
};

const QuickActionButton = ({ label, icon: Icon, href }) => (
  <a 
    href={href}
    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group"
  >
    <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:bg-blue-100 transition-colors">
      <Icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
    </div>
    <span className="mt-2 text-sm font-medium text-gray-600 group-hover:text-blue-600">{label}</span>
  </a>
);

const GradeBadge = ({ score }) => {
  let grade = 'F';
  let colorClass = 'bg-red-100 text-red-700';
  
  if (score >= 90) {
    grade = 'A';
    colorClass = 'bg-green-100 text-green-700';
  } else if (score >= 80) {
    grade = 'B';
    colorClass = 'bg-blue-100 text-blue-700';
  } else if (score >= 70) {
    grade = 'C';
    colorClass = 'bg-yellow-100 text-yellow-700';
  } else if (score >= 60) {
    grade = 'D';
    colorClass = 'bg-orange-100 text-orange-700';
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {grade}
    </span>
  );
};

export default Dashboard;
