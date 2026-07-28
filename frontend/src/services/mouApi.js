import api from './api';

export const getMOUs = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/api/mous/${query ? `?${query}` : ''}`);
  return res.data;
};

export const getMOU = async (id) => {
  const res = await api.get(`/api/mous/${id}/`);
  return res.data;
};

export const createMOU = async (data) => {
  const res = await api.post('/api/mous/', data);
  return res.data;
};

export const updateMOU = async (id, data) => {
  const res = await api.put(`/api/mous/${id}/`, data);
  return res.data;
};

export const deleteMOU = async (id) => {
  const res = await api.delete(`/api/mous/${id}/`);
  return res.data;
};

export const submitSignedMOU = async (id, data) => {
  const res = await api.post(`/api/mous/${id}/submit-signed/`, data);
  return res.data;
};

export const approveRejectMOU = async (id, action, remarks = '') => {
  const res = await api.post(`/api/mous/${id}/approve-reject/`, { action, remarks });
  return res.data;
};

export const renewMOU = async (id, notes = '') => {
  const res = await api.post(`/api/mous/${id}/renew/`, { notes });
  return res.data;
};

export const getTemplates = async () => {
  const res = await api.get('/api/mous/templates/');
  return res.data;
};

export const createTemplate = async (data) => {
  const res = await api.post('/api/mous/templates/', data);
  return res.data;
};

export const getMOUReports = async () => {
  const res = await api.get('/api/mous/reports/stats/');
  return res.data;
};

export const getMOUShares = async (id) => {
  const res = await api.get(`/api/mous/${id}/share/`);
  return res.data;
};

export const shareMOU = async (id, data) => {
  const res = await api.post(`/api/mous/${id}/share/`, data);
  return res.data;
};

export const revokeMOUShare = async (shareId) => {
  const res = await api.delete(`/api/mous/shares/${shareId}/`);
  return res.data;
};

export const getMOUSubmissions = async () => {
  const res = await api.get('/api/mous/submissions/');
  return res.data;
};

export const submitDepartmentMOU = async (data) => {
  const res = await api.post('/api/mous/submissions/', data);
  return res.data;
};

export const reviewDepartmentSubmission = async (submissionId, action, comments = '') => {
  const res = await api.post(`/api/mous/submissions/${submissionId}/review/`, { action, comments });
  return res.data;
};

export const getMOUSharedDashboard = async () => {
  const res = await api.get('/api/mous/shared-dashboard/');
  return res.data;
};

export const getMOURenewals = async (id) => {
  const res = await api.get(`/api/mous/${id}/renewals/`);
  return res.data;
};
