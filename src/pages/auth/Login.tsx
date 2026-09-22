import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input, Button, Alert, Divider } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display text-2xl font-bold text-ink dark:text-white text-center mb-8">{t('login')}</h1>

      {error && <Alert type="error" message={error} className="mb-4" showIcon />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input size="large" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <Input.Password size="large" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs text-muted hover:text-ink dark:hover:text-white">{t('forgotPassword')}</Link>
        </div>
        <Button htmlType="submit" type="primary" size="large" block loading={loading}>{t('login')}</Button>
      </form>

      <Divider plain className="text-xs text-muted">{t('or')}</Divider>

      <Button size="large" block icon={<GoogleOutlined />} onClick={handleGoogle} loading={loading}>{t('continueGoogle')}</Button>

      <p className="text-center text-sm text-muted mt-6">
        {t('noAccount')} <Link to="/register" className="text-ink dark:text-white font-medium underline">{t('register')}</Link>
      </p>
    </div>
  );
}

export function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Email və ya şifrə yanlışdır.',
    'auth/user-not-found': 'Bu email ilə istifadəçi tapılmadı.',
    'auth/wrong-password': 'Şifrə yanlışdır.',
    'auth/email-already-in-use': 'Bu email artıq istifadə olunur.',
    'auth/weak-password': 'Şifrə ən azı 6 simvol olmalıdır.',
    'auth/invalid-email': 'Email formatı düzgün deyil.',
    'auth/too-many-requests': 'Çox sayda cəhd. Bir az sonra yenidən cəhd edin.',
    'auth/network-request-failed': 'İnternet bağlantısı xətası.',
  };
  return map[code] ?? 'Xəta baş verdi. Yenidən cəhd edin.';
}
