import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, Alert, Divider } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { mapAuthError } from './Login';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/');
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
      navigate('/');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display text-2xl font-bold text-ink dark:text-white text-center mb-8">{t('register')}</h1>

      {error && <Alert type="error" message={error} className="mb-4" showIcon />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input size="large" placeholder={t('nameSurname')} value={name} onChange={(e) => setName(e.target.value)} required />
        <Input size="large" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input.Password size="large" placeholder={t('passwordMin')} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <Button htmlType="submit" type="primary" size="large" block loading={loading}>{t('register')}</Button>
      </form>

      <Divider plain className="text-xs text-muted">{t('or')}</Divider>

      <Button size="large" block icon={<GoogleOutlined />} onClick={handleGoogle} loading={loading}>{t('continueGoogle')}</Button>

      <p className="text-center text-sm text-muted mt-6">
        {t('hasAccount')} <Link to="/login" className="text-ink dark:text-white font-medium underline">{t('login')}</Link>
      </p>
    </div>
  );
}
