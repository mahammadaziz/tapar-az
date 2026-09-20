import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button, Alert, Result } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { mapAuthError } from './Login';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Result
        status="success"
        title={t('sendReset')}
        subTitle={`Şifrənizi sıfırlamaq üçün ${email} ünvanına keçid göndərdik.`}
        extra={<Link to="/login" className="text-ink dark:text-white underline">{t('backToLogin')}</Link>}
      />
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display text-2xl font-bold text-ink dark:text-white text-center mb-2">{t('resetPassword')}</h1>
      <p className="text-sm text-muted text-center mb-8">{t('resetPasswordText')}</p>

      {error && <Alert type="error" message={error} className="mb-4" showIcon />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input size="large" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button htmlType="submit" type="primary" size="large" block loading={loading}>{t('sendReset')}</Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        <Link to="/login" className="text-ink dark:text-white font-medium underline">{t('backToLogin')}</Link>
      </p>
    </div>
  );
}
