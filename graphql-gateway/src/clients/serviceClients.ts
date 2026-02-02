

import { SERVICE_URLS } from '@3asoftwares/utils';
import axios, { AxiosInstance } from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || SERVICE_URLS.AUTH_SERVICE;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || SERVICE_URLS.PRODUCT_SERVICE;
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || SERVICE_URLS.ORDER_SERVICE;
const CATEGORY_SERVICE_URL = process.env.CATEGORY_SERVICE_URL || SERVICE_URLS.CATEGORY_SERVICE;
const COUPON_SERVICE_URL = process.env.COUPON_SERVICE_URL || SERVICE_URLS.COUPON_SERVICE;
const TICKET_SERVICE_URL =
  process.env.TICKET_SERVICE_URL || SERVICE_URLS.TICKET_SERVICE || 'http://localhost:3016';

export const authClient: AxiosInstance = axios.create({
  baseURL: AUTH_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productClient: AxiosInstance = axios.create({
  baseURL: PRODUCT_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const orderClient: AxiosInstance = axios.create({
  baseURL: ORDER_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const categoryClient: AxiosInstance = axios.create({
  baseURL: CATEGORY_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const couponClient: AxiosInstance = axios.create({
  baseURL: COUPON_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ticketClient: AxiosInstance = axios.create({
  baseURL: TICKET_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const addAuthHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});
