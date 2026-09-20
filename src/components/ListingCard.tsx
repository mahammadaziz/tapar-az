import { useEffect, useState } from 'react';
import { HeartOutlined, HeartFilled, EnvironmentOutlined, CalendarOutlined, CarOutlined, HomeOutlined, AppstoreOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { ExternalListing, Listing } from '@/types';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime, formatPrice } from '@/utils/format';
import { externalListingLabel } from '@/hooks/useExternalListings';
import ImageWatermark from '@/components/ImageWatermark';

export default function ListingCard({ listing }: { listing: ExternalListing | Listing }) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [favoriteOverride, setFavoriteOverride] = useState<boolean | null>(null);
  const external = 'source' in listing;
  const coverImage = external ? listing.images[0] : listing.media[0]?.url;
  const storedFavorite = isFavorite(listing.id);
  const fav = favoriteOverride ?? storedFavorite;
  useEffect(() => { setFavoriteOverride(null); }, [storedFavorite]);
  const categoryIcon = external && listing.category === 'real_estate' ? <HomeOutlined /> : external && listing.category === 'automobile' ? <CarOutlined /> : <AppstoreOutlined />;
  const categoryLabel = external ? externalListingLabel(listing) : 'Elan';

  const handleFavorite = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) return message.info('Sevimlilərə əlavə etmək üçün daxil olun.');
    const next = !fav;
    setFavoriteOverride(next);
    try { await toggleFavorite(listing.id); } catch (error) {
      setFavoriteOverride(null);
      message.error(error instanceof Error ? error.message : 'Favoritə əlavə etmək mümkün olmadı.');
    }
  };

  return (
    <a href={external ? listing.original_url : `/elanlar/${listing.id}`} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="group block overflow-hidden rounded-[22px] border border-line bg-paper shadow-[0_4px_18px_rgb(17_24_39/0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-action/40 hover:shadow-[0_20px_45px_rgb(17_24_39/0.12)] dark:border-line-dark dark:bg-graphite">
      <div className="relative aspect-[1.38] overflow-hidden bg-offwhite dark:bg-background">
        {coverImage ? <><img src={coverImage} alt={listing.title} loading="lazy" className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105" /><ImageWatermark /></> : <div className="flex h-full items-center justify-center text-sm text-muted">Şəkil yoxdur</div>}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        <button type="button" onClick={handleFavorite} aria-pressed={fav} aria-label={fav ? 'Favoritlərdən çıxar' : 'Sevimlilərə əlavə et'} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:scale-110 hover:text-action dark:bg-graphite/90 dark:text-white">
          {fav ? <HeartFilled className="text-urgent" /> : <HeartOutlined />}
        </button>
        <div className="absolute bottom-3 left-4 text-[11px] font-medium text-white/90"><span>{categoryLabel}</span></div>
      </div>
      <div className="p-3.5">
        <h3 className="min-h-[2.4em] text-[14px] font-bold leading-[1.25] tracking-[-.01em] text-ink transition-colors group-hover:text-action dark:text-white">{listing.title}</h3>
        <div className="mt-2.5 flex items-end justify-between gap-2"><p className="text-[18px] font-extrabold tracking-[-.03em] text-ink dark:text-white">{listing.price === null ? 'Qiymət soruşun' : formatPrice(listing.price)}</p>{external && listing.listing_type && <span className="mb-0.5 rounded-md bg-offwhite px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted dark:bg-background">{listing.listing_type === 'sell' ? 'Satılır' : listing.listing_type}</span>}</div>
        <div className="mt-2.5 flex min-h-7 flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1"><EnvironmentOutlined /> {listing.city ?? 'Azərbaycan'}{external && listing.district ? `, ${listing.district}` : ''}</span>
          {external && listing.rooms && <span>{listing.rooms} otaq</span>}
          {external && listing.area && <span>{listing.area} m²</span>}
          {external && listing.year && <span>{listing.year}</span>}
          {external && listing.mileage !== null && listing.mileage !== undefined && <span>{listing.mileage.toLocaleString('az-AZ')} km</span>}
        </div>
        <div className="mt-2 flex items-center"><span className="inline-flex items-center gap-1.5 text-[10px] text-muted"><CalendarOutlined /> {external && listing.published_at ? new Date(listing.published_at).toLocaleDateString('az-AZ') : formatDateTime('createdAt' in listing ? listing.createdAt : undefined)}</span></div>
      </div>
    </a>
  );
}
