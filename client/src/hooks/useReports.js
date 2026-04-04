import { useQuery } from '@tanstack/react-query';
import api from '../config/api';

export const useDailySales = (options = {}) => {
  return useQuery({
    queryKey: ['reports', 'dailySales'],
    queryFn: async () => {
      const { data } = await api.get('/reports/daily-sales');
      return data.data;
    },
    ...options,
  });
};

export const useSalesSummary = (options = {}) => {
  return useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: async () => {
      const { data } = await api.get('/reports/sales-summary');
      return data.data;
    },
    ...options,
  });
};
