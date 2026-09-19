export type UserRole =
  | 'DRIVER'
  | 'PARKING_OWNER'
  | 'SOCIETY_ADMIN'
  | 'SECURITY'
  | 'PLATFORM_ADMIN';

export type VehicleType = 'TWO_WHEELER' | 'CAR' | 'SUV' | 'VAN' | 'TRUCK';

export type ParkingType = 'OPEN' | 'COVERED' | 'BASEMENT' | 'MULTILEVEL' | 'STREET' | 'VALET';

export type ParkingStatus =
  | 'PENDING_VERIFICATION'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'SUSPENDED'
  | 'REJECTED';

export type SpaceStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';

export type BookingStatus =
  | 'PENDING'
  | 'HELD'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW'
  | 'DISPUTED';

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  plate_number: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  color?: string | null;
  is_primary: boolean;
  is_active: boolean;
}

export interface ParkingImage {
  id?: string;
  url: string;
  caption?: string | null;
  is_primary: boolean;
  sort_order?: number;
}

export interface ParkingSpace {
  id: string;
  location_id?: string;
  space_number: string;
  floor?: string | null;
  vehicle_type: VehicleType;
  is_covered: boolean;
  has_ev_charging: boolean;
  status: SpaceStatus;
}

export interface ParkingLocation {
  id: string;
  owner_id?: string;
  society_id?: string | null;
  name: string;
  description?: string | null;
  address: string;
  city?: string;
  latitude: number;
  longitude: number;
  parking_type: ParkingType;
  status: ParkingStatus;
  is_active?: boolean;
  total_spaces: number;
  available_spaces?: number;
  vehicle_types_allowed?: string[] | null;
  amenities?: Record<string, boolean> | null;
  operating_hours?: any;
  cancellation_policy?: string;
  base_hourly_price: number;
  base_daily_price?: number | null;
  average_rating: number;
  total_reviews: number;
  is_demo?: boolean;
  distance_m?: number;
  relevance_score?: number;
  primary_image_url?: string | null;
  images?: ParkingImage[];
  spaces?: ParkingSpace[];
}

export interface Booking {
  id: string;
  booking_ref: string;
  driver_id: string;
  space_id: string;
  vehicle_id: string;
  status: BookingStatus;
  start_time: string;
  end_time: string;
  actual_check_in?: string | null;
  actual_check_out?: string | null;
  base_price: number;
  pricing_multiplier: number;
  total_price: number;
  currency: string;
  qr_token: string;
  hold_expires_at?: string | null;
  cancellation_reason?: string | null;
  notes?: string | null;
  created_at: string;
  vehicle?: Vehicle | null;
  space?: ParkingSpace | null;
  parking_location?: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    images?: { url: string; is_primary: boolean }[];
  } | null;
}

export interface PaymentOrder {
  order_id: string;
  amount: number;
  currency: string;
  provider: 'RAZORPAY' | 'MOCK';
  key_id?: string | null;
  is_mock: boolean;
}

export interface OwnerOverviewMetrics {
  today_bookings: number;
  today_revenue: number;
  current_occupancy: number;
  total_spaces: number;
  occupancy_percentage: number;
  available_spaces: number;
  average_rating: number;
  monthly_revenue: number;
  cancellation_rate: number;
  no_show_rate: number;
}
