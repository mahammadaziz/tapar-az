import axios from 'axios';

export async function sendBrevoEmail(input: { to: string | string[]; subject: string; text: string; html?: string }) {
  const endpoint = (import.meta.env.VITE_EMAIL_API_URL as string | undefined)
    || 'https://tapar-az.up.railway.app/api/email-smtp/email-send';
  try {
    await axios.post(endpoint, input, { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const data = axios.isAxiosError(error) ? error.response?.data as { error?: string; code?: string; responseCode?: number } | undefined : undefined;
    throw new Error(data?.error || `Email göndərilə bilmədi (${status ?? 'naməlum xəta'}).`);
  }
}
