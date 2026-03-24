// API utility functions for authenticated requests

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('kb_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token && token !== 'authenticated') {
    // For JWT token, add to Authorization header
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session auth
  });
  
  return response;
}

// GraphQL helper
export async function graphqlRequest(query: string, variables?: Record<string, any>) {
  const response = await fetchWithAuth('/graphql', {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
  });
  
  return response.json();
}