import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8091';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ======================== AUTH ========================
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  getUserIdByUsername: (username) => api.get('/api/auth/users/by-username?username=' + encodeURIComponent(username)),
  register: (data) => api.post('/api/auth/register', data),
  registerApprovedDeveloper: (email, data) =>
    api.post(`/api/auth/approvedeveloper?email=${encodeURIComponent(email)}`, data),
  applyAsDeveloper: (formData) =>
    api.post('/api/auth/register/dev', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  logout: () => api.post('/api/auth/logout'),
  getProfile: (userId) => api.get(`/api/auth/profile/${userId}`),
  updateProfile: (userId, data) => api.put(`/api/auth/profile/${userId}`, data),
  changePassword: (userId, data) => api.put(`/api/auth/change-password/${userId}`, data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) =>
    api.post(`/api/auth/reset-password?token=${token}`, { password }),
};

// ======================== ADMIN ========================
export const adminAPI = {
  login: (data) => api.post('/api/admin/login', data),
  getPendingApplications: () => api.get('/api/admin/applications'),
  approveApplication: (email) => api.post(`/api/admin/approve?email=${encodeURIComponent(email)}`),
  rejectApplication: (email) => api.post(`/api/admin/reject?email=${encodeURIComponent(email)}`),
};

// ======================== PROJECTS ========================
export const projectAPI = {
  create: (data) => api.post('/api/project', data),
  getById: (id) => api.get(`/api/project/${id}`),
  getByOwner: (ownerId) => api.get(`/api/project/owner/${ownerId}`),
  getPublic: () => api.get('/api/project/public'),
  search: (keyword) => api.get(`/api/project/search?keyword=${encodeURIComponent(keyword)}`),
  getByLanguage: (lang) => api.get(`/api/project/language/${lang}`),
  update: (id, data) => api.put(`/api/project/${id}`, data),
  archive: (id) => api.put(`/api/project/${id}/archive`),
  delete: (id) => api.delete(`/api/project/${id}`),
  fork: (id, newOwnerId) => api.post(`/api/project/${id}/fork?newOwnerId=${newOwnerId}`),
  star: (id) => api.post(`/api/project/${id}/star`),
};

// ======================== FILES ========================
export const fileAPI = {
  create: (data) => api.post('/api/files', data),
  createFolder: (data) => api.post('/api/files/folder', data),
  getById: (id) => api.get(`/api/files/${id}`),
  getByProject: (projectId) => api.get(`/api/files/project/${projectId}`),
  getContent: (id) => api.get(`/api/files/${id}/content`),
  updateContent: (id, data) => api.put(`/api/files/${id}/content`, data),
  rename: (id, data) => api.put(`/api/files/${id}/rename`, data),
  move: (id, data) => api.put(`/api/files/${id}/move`, data),
  delete: (id) => api.delete(`/api/files/${id}`),
  restore: (id) => api.post(`/api/files/${id}/restore`),
  getTree: (projectId) => api.get(`/api/files/project/${projectId}/tree`),
  search: (projectId, keyword) =>
    api.get(`/api/files/project/${projectId}/search?keyword=${encodeURIComponent(keyword)}`),
};

// ======================== EXECUTION ========================
export const executionAPI = {
  /**
   * FIXED: Synchronous run - waits for output, returns complete result in one call.
   * Use this for the Run Code button in the editor.
   */
  run: (data) => api.post('/api/executions/run', data),

  // Async submit (kept for backward compat)
  submit: (data) => api.post('/api/executions/submit', data),
  getById: (jobId) => api.get(`/api/executions/${jobId}`),
  getByUser: (userId) => api.get(`/api/executions/user/${userId}`),
  getByProject: (projectId) => api.get(`/api/executions/project/${projectId}`),
  cancel: (jobId) => api.post(`/api/executions/${jobId}/cancel`),
  getResult: (jobId) => api.get(`/api/executions/${jobId}/result`),
  getSupportedLanguages: () => api.get('/api/executions/languages'),
  getStats: (userId) => api.get(`/api/executions/stats/user/${userId}`),
};

// ======================== COLLAB SESSIONS ========================
export const collabAPI = {
  create:               (data)            => api.post('/api/sessions', data),
  createSession:        (data)            => api.post('/api/sessions', data),
  getSessionById:       (sessionId)       => api.get(`/api/sessions/${sessionId}`),
  getSessionsByProject: (projectId)       => api.get(`/api/sessions/project/${projectId}`),
  join:                 (sessionId, data) => api.post(`/api/sessions/${sessionId}/join`, data),
  joinSession:          (sessionId, data) => api.post(`/api/sessions/${sessionId}/join`, data),
  leave:                (sessionId)       => api.post(`/api/sessions/${sessionId}/leave`),
  leaveSession:         (sessionId)       => api.post(`/api/sessions/${sessionId}/leave`),
  endSession:           (sessionId)       => api.post(`/api/sessions/${sessionId}/end`),
  getParticipants:      (sessionId)       => api.get(`/api/sessions/${sessionId}/participants`),
  updateCursor:         (sessionId, data) => api.put(`/api/sessions/${sessionId}/cursor`, data),
};

// ======================== VERSION CONTROL ========================
export const versionAPI = {
  createSnapshot: (data)                   => api.post('/api/versions/snapshot', data),
  getHistory:     (fileId)                 => api.get(`/api/versions/file/${fileId}/history`),
  getByProject:   (projectId)              => api.get(`/api/versions/project/${projectId}`),
  getLatest:      (fileId)                 => api.get(`/api/versions/file/${fileId}/latest`),
  restoreSnapshot:(snapshotId)             => api.post(`/api/versions/snapshot/${snapshotId}/restore`),
  diff:           (id1, id2)              => api.get(`/api/versions/diff?snapshotId1=${id1}&snapshotId2=${id2}`),
  tagSnapshot:    (snapshotId, tag)        => api.put(`/api/versions/snapshot/${snapshotId}/tag`, { tag }),

  getBranches:    (projectId)              => api.get(`/api/versions/project/${projectId}/branches`),
  getByBranch:    (projectId, branchName)  => api.get(`/api/versions/project/${projectId}/branch/${encodeURIComponent(branchName)}`),
  createBranch:   (data)                   => api.post('/api/versions/branch', data),
};

export default api;
