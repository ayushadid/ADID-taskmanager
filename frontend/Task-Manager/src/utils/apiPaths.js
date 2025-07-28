export const BASE_URL = import.meta.env.VITE_API_URL;

//utils/apiPaths.js
export const API_PATHS={
    AUTH: {
        REGISTER:"/api/auth/register", //Register a new user(Admin or Member)
        LOGIN:"/api/auth/login", //Authenticate user and return JWT Token
        GET_PROFILE:"/api/auth/profile", //Get Logged in user details
    },

    USERS:{
        GET_ALL_USERS:"/api/users", //Get all users (Admin only)
        GET_USER_BY_ID: (userId)=>`/api/users/${userId}`, //Get user by Id
        CREATE_USER: "/api/users", //Create a new user (admin only)
        UPDATE_USER:(userId)=>`/api/users/${userId}`, //Update user details
        DELETE_USER:(userId)=>`/api/users/${userId}`, //Delete a user
    },

    TASKS:{
        GET_DASHBOARD_DATA:"/api/tasks/dashboard-data", //Get Dashboard Data
        GET_USER_DASHBOARD_DATA:"/api/tasks/user-dashboard-data", //Get User Dashboard
        GET_ALL_TASKS:"/api/tasks", //Get all Tasks(admin:all, User:only assigned)
        GET_TASK_BY_ID:(taskId)=>`/api/tasks/${taskId}`, //Get task by ID
        CREATE_TASK:"/api/tasks",//Create a new Task(Admin Only)
        GET_TASKS_FOR_USER: (userId) => `/api/tasks/user/${userId}`, // Get tasks for a specific user (Admin only)
        UPDATE_TASK:(taskId)=>`/api/tasks/${taskId}`, //Update task by id
        DELETE_TASK:(taskId)=>`/api/tasks/${taskId}`, //Delete a task by id
        

        UPDATE_TASK_STATUS:(taskId)=>`/api/tasks/${taskId}/status`,
        UPDATE_TASK_CHECKLIST:(taskId)=>`/api/tasks/${taskId}/todo`,
        ADD_REMARK: (taskId) => `/api/tasks/${taskId}/remarks`, 
        
        START_TIMER: (taskId) => `/api/tasks/${taskId}/timelogs/start`,
        STOP_TIMER: (taskId, timeLogId) => `/api/tasks/${taskId}/timelogs/${timeLogId}/stop`,
        GET_ACTIVE_TIMER: (taskId) => `/api/tasks/${taskId}/timelogs/active`,
        GET_TASK_TIMELOGS: (taskId) => `/api/tasks/${taskId}/timelogs`,
    },

    REPORTS:{
        EXPORT_TASKS:"/api/reports/exports/tasks",
        EXPORT_USERS:"/api/reports/exports/users",
    },

    IMAGE:{
        UPLOAD_IMAGE:"api/auth/upload-image"
    },
}