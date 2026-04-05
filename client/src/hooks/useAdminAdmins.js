import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../config/api';

export const useAdminAdmins = (page = 1, search = '', options = {}) => {
  return useQuery({
    queryKey: ['admin', 'admins', { page, search }],
    queryFn: async () => {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      const { data } = await api.get('/tenants/admins', { params });
      return data.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 seconds for admin list
    ...options,
  });
};
