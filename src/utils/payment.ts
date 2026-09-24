import axios from 'axios';

export const PAYMENT_AMOUNT = 20;
export const SUBSCRIPTION_NAME = 'Premium aylıq abunəlik';
export const PAYMENT_API_BASE = (import.meta.env.VITE_PAYMENT_API_BASE_URL as string | undefined)
  || 'https://tapar-az.up.railway.app';

export interface PaymentRequest {
  orderId: string;
  storeId: string;
  amount: number;
  price: number;
  subscriptionName: string;
}

export interface PaymentResponse {
  orderId?: string;
  amount?: string | number;
  price?: string | number;
  subscriptionName?: string;
  redirectUrl: string;
  transaction?: string;
}

export async function createStorePayment(input: PaymentRequest) {
  try {
    const response = await axios.post<PaymentResponse>(`${PAYMENT_API_BASE.replace(/\/$/, '')}/api/subscription-payments`, input, {
      headers: { 'Content-Type': 'application/json' },
    });
    const payload = response.data;
    if (!payload?.redirectUrl) throw new Error('Backend redirectUrl qaytarmadı.');
    return payload;
  } catch (error) {
    if (error instanceof Error && !axios.isAxiosError(error)) throw error;
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const data = axios.isAxiosError(error) ? error.response?.data as { message?: string; error?: string } | undefined : undefined;
    throw new Error(data?.error || data?.message || `Ödəniş yaradıla bilmədi (${status ?? 'naməlum xəta'}).`);
  }
}

export async function sendEpointCallback(data: string, signature: string) {
  try {
    await axios.post(`${PAYMENT_API_BASE.replace(/\/$/, '')}/epoint/callback`, { data, signature }, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    throw new Error(`Ödəniş callback-i qəbul edilmədi (${status ?? 'naməlum xəta'}).`);
  }
}
