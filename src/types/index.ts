export type CategoryKey =
  | 'ev_bağ'
  | 'elektronika'
  | 'nəqliyyat'
  | 'ehtiyat_hissələri'
  | 'daşınmaz_əmlak'
  | 'xidmətlər'
  | 'iş_elanları'
  | 'şəxsi_əşyalar'
  | 'hobbi_asudə'
  | 'məişət_texnikası'
  | 'telefonlar'
  | 'uşaq_aləmi'
  | 'heyvanlar';

export type ListingStatus = 'pending' | 'active' | 'inactive' | 'sold' | 'rejected';

export interface MediaItem {
  url: string;
  path: string; // storage path, needed for deletion
  type: 'image' | 'video';
  order: number;
}

// Flexible attributes bag — keyed by field name from the category's FieldSchema[].
export type ListingAttributes = Record<string, string | number | boolean | string[] | undefined>;

export interface Listing {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  storeId?: string;
  category: CategoryKey;
  subcategory: string;
  title: string;
  price: number | null; // null when priceHidden true
  priceHidden?: boolean;
  currency: 'AZN';
  city: string;
  phone?: string;
  whatsappPhone?: string;
  whatsappEnabled?: boolean;
  district?: string;
  address?: string;
  description: string;
  media: MediaItem[];
  attributes: ListingAttributes;
  status: ListingStatus;
  viewCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: number; // epoch ms
  updatedAt: number;
  isPremium?: boolean;
  premiumUntil?: number;
  premiumPlan?: 'top' | 'urgent' | 'vip';
  premiumPaymentStatus?: 'waiting' | 'success' | 'failed';
  premiumOrderId?: string;
  submittedAt?: number;
  reviewedAt?: number;
  rejectionReason?: string;
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  category?: CategoryKey;
  logoUrl?: string;
  coverUrl?: string;
  phone?: string;
  city?: string;
  address?: string;
  verified: boolean;
  status?: 'waiting' | 'success' | 'failed';
  adminStatus?: 'waiting' | 'approved' | 'rejected';
  paymentStatus?: 'waiting' | 'success' | 'failed';
  orderId?: string;
  transaction?: string;
  amount?: number;
  price?: number;
  subscriptionName?: string;
  ownerEmail?: string;
  createdAt: number;
  updatedAt: number;
  businessType?: 'general' | 'individual';
  open24Hours?: boolean;
  workingDays?: string[];
  openingTime?: string;
  closingTime?: string;
}

export type ExternalCategory = 'real_estate' | 'automobile' | 'electronics' | 'services' | 'jobs' | string;

/** Unified shape used by TAPAR's cross-site listing aggregator. */
export interface ExternalListing {
  id: string;
  source: string;
  source_id: string;
  title: string;
  description: string | null;
  category: ExternalCategory;
  subcategory: string | null;
  listing_type: 'sell' | 'rent' | 'exchange' | string;
  price: number | null;
  currency: string;
  city: string | null;
  district: string | null;
  settlement: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rooms: number | null;
  area: number | null;
  floor: number | null;
  total_floors: number | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  images: string[];
  seller_name: string | null;
  seller_type: string | null;
  original_url: string;
  published_at: string | null;
}

export interface AIListingDraft {
  title: string;
  description: string;
  category: CategoryKey | null;
  subcategory: string | null;
  price: number | null;
  city: string | null;
  phone: string | null;
  address: string | null;
  attributes: ListingAttributes;
  keywords: string[];
  tags: string[];
  highlights: string[];
  warnings: string[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  createdAt: number;
}

export interface Rating {
  id: string;
  listingId: string;
  userId: string;
  value: number; // 1-5
  createdAt: number;
  updatedAt: number;
}

export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  createdAt: number;
}

export interface ListingMessage {
  id: string;
  listingId: string;
  listingTitle: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  participants: string[];
  text: string;
  createdAt: unknown;
  clientCreatedAt?: number;
  readBy?: string[];
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'date'
  | 'tags';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldCondition {
  field: string; // name of the field this depends on
  equals?: string | number | boolean;
  in?: (string | number)[];
  notEquals?: string | number | boolean;
}

export interface FieldSchema {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  showIf?: FieldCondition;
  colSpan?: 1 | 2; // grid layout hint
  helpText?: string;
}

export interface SubcategoryConfig {
  key: string;
  label: string;
  fields: FieldSchema[];
}

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: string;
  image?: string;
  subcategories: SubcategoryConfig[];
}
