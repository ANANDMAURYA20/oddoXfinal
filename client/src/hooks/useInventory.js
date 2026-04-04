import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../config/api';

export const useProducts = ({ categoryId = 'all', search = '', status = 'all' } = {}, options = {}) => {
  return useQuery({
    queryKey: ['inventory', 'products', { categoryId, search, status }],
    queryFn: async () => {
      const params = { limit: 100 };
      if (categoryId && categoryId !== 'all') params.categoryId = categoryId;
      if (search) params.search = search;
      if (status && status !== 'all') params.status = status;
      
      const { data } = await api.get('/products', { params });
      return data.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2, // 2 minutes for products
    ...options,
  });
};

export const useCategories = (options = {}) => {
  return useQuery({
    queryKey: ['inventory', 'categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes for categories (rarely change)
    ...options,
  });
};
