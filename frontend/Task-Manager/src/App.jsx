import React, { useContext } from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Outlet,
    Navigate,
} from "react-router-dom";
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import PrivateRoute from './routes/PrivateRoute';
import Dashboard from './pages/Admin/Dashboard';
import ManageTasks from './pages/Admin/ManageTasks';
import CreateTask from './pages/Admin/CreateTask';
import ManageUsers from './pages/Admin/ManageUsers';
import UserDashboard from './pages/User/UserDashboard';
import MyTasks from './pages/User/MyTasks';
import ViewTaskDetails from './pages/User/ViewTaskDetails';
import TaskTimeLogsPage from './pages/User/TaskTimeLogsPage';
import TaskCalendar from './pages/Admin/TaskCalendar';
import SharedSheet from './pages/Admin/SharedSheet'; // Add this line
import UserProvider, { UserContext } from './context/userContext';
import { Toaster } from 'react-hot-toast';

// Import the new component
import UserTasksDetails from './pages/Admin/UserTasksDetails'; // Adjust path if necessary


const App = () => {
    return (
        <UserProvider>
            <div>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />

                        {/* Admin Routes */}
                        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
                            <Route path="/admin/dashboard" element={<Dashboard />} />
                            <Route path="/admin/tasks" element={<ManageTasks />} />
                            <Route path="/admin/create-task" element={<CreateTask />} />
                            <Route path="/admin/users" element={<ManageUsers />} />
                            <Route path="/admin/calendar" element={<TaskCalendar />} />
                            <Route path="/admin/shared-sheet" element={<SharedSheet />} />
                            {/* NEW ROUTE FOR USER-SPECIFIC TASKS (Admin Only) */}
                            {/* This path matches what was used in UserCard.jsx: /manage-users/:userId/tasks */}
                            <Route path="/admin/users/:userId/tasks" element={<UserTasksDetails />} />
                            <Route path="/admin/tasks/:taskId/timelogs" element={<TaskTimeLogsPage />} />
                        </Route>

                        {/* User Routes */}
                        <Route element={<PrivateRoute allowedRoles={["member"]} />}> {/* Changed "user" to "member" based on your schema default */}
                            <Route path="/user/dashboard" element={<UserDashboard />} />
                            <Route path="/user/tasks" element={<MyTasks />} />
                            <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
                            <Route path="/user/tasks/:taskId/timelogs" element={<TaskTimeLogsPage />} />
                        </Route>

                        {/* Default Route*/}
                        <Route path="/" element={<Root />} />
                    </Routes>
                </Router>
            </div>
            <Toaster
                toastOptions={{
                    className: '',
                    style: {
                        fontSize: "13px",
                    }
                }}
            />
        </UserProvider>
    )
}

export default App


const Root = () => {
    const { user, loading } = useContext(UserContext);

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return user.role === "admin"
        ? <Navigate to="/admin/dashboard" replace />
        : <Navigate to="/user/dashboard" replace />;
};