const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_BASE_URL = `${BASE_URL}/api`;

export { BASE_URL };
export default API_BASE_URL;
