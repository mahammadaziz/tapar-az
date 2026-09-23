import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';

type PaymentState = 'success' | 'failed' | 'pending';

type PaymentResultProps = {
  state?: PaymentState;
};

const content: Record<PaymentState, {
  icon: typeof CheckCircleOutlined;
  iconClass: string;
  eyebrow: string;
  title: string;
  description: string;
}> = {
  success: {
    icon: CheckCircleOutlined,
    iconClass: 'text-success',
    eyebrow: 'Ödəniş tamamlandı',
    title: 'Ödənişiniz uğurla qəbul edildi',
    description: 'Sifarişiniz təsdiqləndi. Əməliyyat məlumatlarını hesabınızdan izləyə bilərsiniz.',
  },
  failed: {
    icon: CloseCircleOutlined,
    iconClass: 'text-danger',
    eyebrow: 'Ödəniş baş tutmadı',
    title: 'Ödənişi tamamlamaq mümkün olmadı',
    description: 'Məbləğ hesabınızdan çıxılmayıbsa, bir qədər sonra yenidən cəhd edə bilərsiniz.',
  },
  pending: {
    icon: LoadingOutlined,
    iconClass: 'text-action',
    eyebrow: 'Ödəniş yoxlanılır',
    title: 'Ödəniş nəticəsi yoxlanılır',
    description: 'Ödəniş provayderindən təsdiq cavabı gözlənilir. Səhifəni bağlamayın və bir neçə saniyə sonra yeniləyin.',
  },
};

export default function PaymentResult({ state: stateProp }: PaymentResultProps) {
  const [searchParams] = useSearchParams();
  const queryState = searchParams.get('status')?.toLowerCase();
  const state: PaymentState = stateProp ?? (
    queryState === 'success' ? 'success' : queryState === 'failed' || queryState === 'error' ? 'failed' : 'pending'
  );
  const details = content[state];
  const Icon = details.icon;
  const orderId = searchParams.get('order_id') ?? searchParams.get('orderId');
  const transaction = searchParams.get('transaction');

  return (
    <section className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-2xl items-center justify-center px-4 py-16">
      <div className="market-surface w-full px-6 py-12 text-center sm:px-12">
        <Icon className={`mb-6 text-7xl ${details.iconClass} ${state === 'pending' ? 'animate-spin' : ''}`} />
        <p className="market-section-label mb-3">{details.eyebrow}</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">
          {details.title}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-ink/65 dark:text-white/65">
          {details.description}
        </p>

        {(orderId || transaction) && (
          <div className="mx-auto mt-8 max-w-md rounded-lg border border-line bg-background-secondary p-4 text-left text-sm dark:border-line-dark">
            {orderId && <p><span className="text-ink/55 dark:text-white/55">Sifariş ID:</span> <span className="break-all font-medium">{orderId}</span></p>}
            {transaction && <p className="mt-2"><span className="text-ink/55 dark:text-white/55">Əməliyyat:</span> <span className="break-all font-medium">{transaction}</span></p>}
          </div>
        )}

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          {state === 'failed' && <Link to="/elanlar" className="market-action">Yenidən cəhd et</Link>}
          {state === 'pending' && <button type="button" onClick={() => window.location.reload()} className="market-action">Nəticəni yenilə</button>}
          <Link to="/" className="market-secondary-action">Ana səhifəyə qayıt</Link>
        </div>
      </div>
    </section>
  );
}

