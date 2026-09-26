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

export const LISTING_PREMIUM_AMOUNT = 5;
export const LISTING_PREMIUM_DAYS = 7;

export interface ListingPremiumPaymentRequest {
  orderId: string;
  listingId: string;
  amount: number;
  plan: 'top' | 'urgent' | 'vip';
  durationDays: number;
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

/** Starts the premium listing checkout. The callback should set isPremium=true
 * and premiumUntil on listings/{listingId} after a successful payment. */
export async function createListingPremiumPayment(input: ListingPremiumPaymentRequest) {
  const endpoint = (import.meta.env.VITE_LISTING_PREMIUM_API_PATH as string | undefined)
    || '/api/listing-premium-payments';
  try {
    const response = await axios.post<PaymentResponse>(`${PAYMENT_API_BASE.replace(/\/$/, '')}${endpoint}`, input, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.data?.redirectUrl) throw new Error('Backend redirectUrl qaytarmadı.');
    return response.data;
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const data = axios.isAxiosError(error) ? error.response?.data as { message?: string; error?: string } | undefined : undefined;
    throw new Error(data?.error || data?.message || `Premium ödənişi yaradıla bilmədi (${status ?? 'naməlum xəta'}).`);
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
