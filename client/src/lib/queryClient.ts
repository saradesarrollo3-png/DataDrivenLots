import { QueryClient, DefaultOptions } from "@tanstack/react-query";

const queryConfig: DefaultOptions = {
  queries: {
    queryFn: async ({ queryKey }) => {
      const sessionId = localStorage.getItem('sessionId');
      const headers: HeadersInit = {};
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
      }

      const res = await fetch(queryKey[0] as string, { headers });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('sessionId');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('No autorizado');
        }
        if (res.status >= 500) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return res.json();
    },
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: false,
  },
};

export const queryClient = new QueryClient({ defaultOptions: queryConfig });