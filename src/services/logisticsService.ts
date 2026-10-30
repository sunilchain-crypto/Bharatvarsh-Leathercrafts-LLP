import { PincodeLogisticsInfo } from '../types';

const STORED_PINCODE_KEY = 'blc_patron_pincode_v1';

interface PincodeMapEntry {
  city: string;
  state: string;
  zone: 'Metro' | 'Tier-2' | 'Regional' | 'Remote / Special';
  courier: 'Blue Dart Apex Air' | 'Delhivery Express Air' | 'Delhivery Surface' | 'India Post Speed Post';
  days: number;
}

// Prefix to city/state mapping for authentic Indian logistics lookup
const PREFIX_MAP: Record<string, PincodeMapEntry> = {
  // Metros & Major Commercial Hubs
  '11': { city: 'New Delhi', state: 'Delhi NCR', zone: 'Metro', courier: 'Blue Dart Apex Air', days: 2 },
  '12': { city: 'Gurugram / Faridabad', state: 'Haryana NCR', zone: 'Metro', courier: 'Blue Dart Apex Air', days: 2 },
  '20': { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh NCR', zone: 'Metro', courier: 'Blue Dart Apex Air', days: 2 },
  '400': { city: 'South / Central Mumbai', state: 'Maharashtra', zone: 'Metro', courier: 'Blue Dart Apex Air', days: 2 },
  '40': { city: 'Mumbai Metropolitan Region', state: 'Maharashtra', zone: 'Metro', courier: 'Blue Dart Apex Air', days: 2 },
  '41': { city: 'Pune / Pimpri-Chinchwad', state: 'Maharashtra', zone: 'Metro', courier: 'Delhivery Express Air', days: 2 },
  '56': { city: 'Bengaluru', state: 'Karnataka', zone: 'Metro', courier: 'Blue Dart Apex Air', days: 2 },
  '50': { city: 'Hyderabad / Secunderabad', state: 'Telangana', zone: 'Metro', courier: 'Blue Dart Apex Air', days: 2 },
  '60': { city: 'Chennai', state: 'Tamil Nadu', zone: 'Metro', courier: 'Blue Dart Apex Air', days: 2 },
  '70': { city: 'Kolkata', state: 'West Bengal', zone: 'Metro', courier: 'Blue Dart Apex Air', days: 3 },
  '30': { city: 'Jaipur (Local Atelier Zone)', state: 'Rajasthan', zone: 'Metro', courier: 'Delhivery Express Air', days: 1 },
  '38': { city: 'Ahmedabad / Gandhinagar', state: 'Gujarat', zone: 'Metro', courier: 'Delhivery Express Air', days: 2 },
  '39': { city: 'Surat / Vadodara', state: 'Gujarat', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 3 },
  '45': { city: 'Indore / Ujjain', state: 'Madhya Pradesh', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 3 },
  '46': { city: 'Bhopal', state: 'Madhya Pradesh', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 3 },
  '16': { city: 'Chandigarh / Mohali', state: 'Punjab / UT', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 2 },
  '14': { city: 'Ludhiana / Jalandhar', state: 'Punjab', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 3 },
  '22': { city: 'Lucknow / Kanpur', state: 'Uttar Pradesh', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 3 },
  '24': { city: 'Dehradun / Haridwar', state: 'Uttarakhand', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 3 },
  '17': { city: 'Shimla / Solan', state: 'Himachal Pradesh', zone: 'Regional', courier: 'Delhivery Surface', days: 4 },
  '68': { city: 'Kochi / Ernakulam', state: 'Kerala', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 3 },
  '69': { city: 'Thiruvananthapuram', state: 'Kerala', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 3 },
  '64': { city: 'Coimbatore', state: 'Tamil Nadu', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 3 },
  '80': { city: 'Patna', state: 'Bihar', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 4 },
  '83': { city: 'Ranchi / Jamshedpur', state: 'Jharkhand', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 4 },
  '75': { city: 'Bhubaneswar / Cuttack', state: 'Odisha', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 3 },
  '49': { city: 'Raipur / Bilaspur', state: 'Chhattisgarh', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 4 },
  '403': { city: 'Panaji / Goa', state: 'Goa', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 3 },
  '78': { city: 'Guwahati / Assam Hub', state: 'Assam & Northeast', zone: 'Regional', courier: 'Blue Dart Apex Air', days: 4 },
  '79': { city: 'Northeast Hill Region', state: 'Meghalaya / Nagaland / Mizoram', zone: 'Remote / Special', courier: 'India Post Speed Post', days: 6 },
  '19': { city: 'Srinagar / Kashmir Valley', state: 'Jammu & Kashmir', zone: 'Remote / Special', courier: 'Blue Dart Apex Air', days: 5 },
  '18': { city: 'Jammu Tawi', state: 'Jammu & Kashmir', zone: 'Tier-2', courier: 'Delhivery Express Air', days: 4 }
};

function formatDeliveryDate(transitDays: number): string {
  const now = new Date();
  // Dispatch is either today (if before 2pm) or next day
  const dispatchOffset = now.getHours() < 14 ? 0 : 1;
  let target = new Date(now.getTime() + (dispatchOffset + transitDays) * 24 * 60 * 60 * 1000);
  
  // If target falls on Sunday, move to Monday
  if (target.getDay() === 0) {
    target = new Date(target.getTime() + 24 * 60 * 60 * 1000);
  }

  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  return target.toLocaleDateString('en-IN', options);
}

export const logisticsService = {
  isValidIndianPincode(pincode: string): boolean {
    return /^[1-9][0-9]{5}$/.test(pincode.trim());
  },

  getStoredPincode(): string {
    try {
      return localStorage.getItem(STORED_PINCODE_KEY) || '400001';
    } catch {
      return '400001';
    }
  },

  saveStoredPincode(pincode: string): void {
    if (this.isValidIndianPincode(pincode)) {
      try {
        localStorage.setItem(STORED_PINCODE_KEY, pincode.trim());
      } catch (e) {
        console.warn('Unable to persist pincode', e);
      }
    }
  },

  lookupPincode(pincodeRaw: string): PincodeLogisticsInfo {
    const pin = pincodeRaw.trim();
    const isValid = this.isValidIndianPincode(pin);

    if (!isValid) {
      return {
        pincode: pin,
        city: 'Unknown Destination',
        state: 'India',
        zone: 'Regional',
        courierPartner: 'Delhivery Express Air',
        transitDays: 4,
        dispatchTimeNotice: 'Dispatches within 24 hours from Jaipur Atelier',
        estimatedDeliveryDate: formatDeliveryDate(4),
        codAvailable: false,
        maxCodAmount: 0,
        isServiceable: false,
        freeShippingEligible: true
      };
    }

    // Match longest prefix first
    let match: PincodeMapEntry | undefined;
    if (PREFIX_MAP[pin.substring(0, 3)]) {
      match = PREFIX_MAP[pin.substring(0, 3)];
    } else if (PREFIX_MAP[pin.substring(0, 2)]) {
      match = PREFIX_MAP[pin.substring(0, 2)];
    }

    // Default regional fallback
    if (!match) {
      match = {
        city: 'Regional District',
        state: 'India',
        zone: 'Regional',
        courier: 'Delhivery Surface',
        days: 4
      };
    }

    const estimatedDelivery = formatDeliveryDate(match.days);
    const now = new Date();
    const dispatchNotice = now.getHours() < 14
      ? 'Same-day atelier dispatch (order before 2:00 PM IST)'
      : 'Guaranteed dispatch tomorrow by 11:00 AM from Jaipur Atelier';

    return {
      pincode: pin,
      city: match.city,
      state: match.state,
      zone: match.zone,
      courierPartner: match.courier,
      transitDays: match.days,
      dispatchTimeNotice: dispatchNotice,
      estimatedDeliveryDate: estimatedDelivery,
      codAvailable: match.zone !== 'Remote / Special',
      maxCodAmount: 25000,
      isServiceable: true,
      freeShippingEligible: true
    };
  }
};
