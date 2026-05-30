/* ══════════════════════════════════════
   API — طبقة التواصل مع الخادم
══════════════════════════════════════ */
const API_BASE = '/api';

function getToken() { return sessionStorage.getItem('mu_token') || ''; }

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'خطأ في الخادم');
  return data;
}

/* ── Auth ─────────────────────────────────────── */
const API = {
  async login(username, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    sessionStorage.setItem('mu_token', data.token);
    sessionStorage.setItem('mu_auth', '1');
    sessionStorage.setItem('mu_admin', JSON.stringify(data.admin));
    return data;
  },

  logout() {
    sessionStorage.removeItem('mu_token');
    sessionStorage.removeItem('mu_auth');
    sessionStorage.removeItem('mu_admin');
  },

  /* ── Colleges ─────────────────────────────── */
  async getColleges() {
    return apiFetch('/stats/colleges');
  },

  /* ── Consultants ──────────────────────────── */
  async getConsultants(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch('/consultants' + (qs ? '?' + qs : ''));
  },

  async getConsultant(id) {
    return apiFetch('/consultants/' + id);
  },

  async getConsultantReviews(id) {
    return apiFetch('/consultants/' + id + '/reviews');
  },

  /* ── Registrations ────────────────────────── */
  async submitRegistration(formData) {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API_BASE + '/registrations', { method: 'POST', headers, body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'خطأ في الخادم');
    return data;
  },

  async getRegistrations(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch('/registrations' + (qs ? '?' + qs : ''));
  },

  async approveRegistration(id) {
    return apiFetch('/registrations/' + id + '/approve', { method: 'PATCH' });
  },

  async rejectRegistration(id, rejection_note = '') {
    return apiFetch('/registrations/' + id + '/reject', {
      method: 'PATCH',
      body: JSON.stringify({ rejection_note })
    });
  },

  /* ── Contracts ────────────────────────────── */
  async submitContract(data) {
    return apiFetch('/contracts', { method: 'POST', body: JSON.stringify(data) });
  },

  async getContracts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch('/contracts' + (qs ? '?' + qs : ''));
  },

  async updateContractStatus(id, status, admin_notes = '') {
    return apiFetch('/contracts/' + id + '/status', {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_notes })
    });
  },

  async submitReview(contractId, rating, comment = '') {
    return apiFetch('/contracts/' + contractId + '/review', {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
  },

  /* ── Stats ────────────────────────────────── */
  async getDashboardStats() {
    return apiFetch('/stats/dashboard');
  }
};
