import { parsePhoneNumber, isValidPhoneNumber, PhoneNumber } from 'libphonenumber-js';

/**
 * Phone Number Utilities
 * 
 * Handles phone number normalization and validation.
 * All phone numbers MUST be in E.164 format.
 */

/**
 * Normalize phone number to E.164 format
 * 
 * Special handling for South African numbers:
 * - "0821234567" (0 + 9 digits) → "+27821234567"
 * - "+27821234567" → "+27821234567"
 * - "27821234567" → "+27821234567"
 */
export function normalizePhoneNumber(phone: string, defaultCountry: string = 'ZA'): string {
  try {
    // Remove any whitespace and special characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle South African numbers starting with 0 (local format)
    // 0 followed by 9 digits → replace 0 with +27
    if (/^0\d{9}$/.test(cleaned)) {
      return parsePhoneNumber('+27' + cleaned.substring(1), 'ZA')!.format('E.164');
    }
    
    // If it doesn't start with +, add country code
    const phoneWithPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    
    // Parse and format to E.164
    const phoneNumber = parsePhoneNumber(phoneWithPlus, defaultCountry as any);
    
    if (!phoneNumber) {
      throw new Error('Invalid phone number');
    }
    
    return phoneNumber.format('E.164');
  } catch (error) {
    throw new Error('Invalid phone number format');
  }
}

/**
 * Validate E.164 phone number
 */
export function validateE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone) && isValidPhoneNumber(phone);
}

/**
 * Get country code from E.164 number
 */
export function getCountryCode(phone: string): string | null {
  try {
    const phoneNumber = parsePhoneNumber(phone);
    return phoneNumber?.country || null;
  } catch {
    return null;
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  try {
    const phoneNumber = parsePhoneNumber(phone);
    return phoneNumber?.formatInternational() || phone;
  } catch {
    return phone;
  }
}

/**
 * Check if number is mobile (not landline)
 * 
 * For SA numbers, also checks mobile prefixes (6x, 7x, 8x)
 * since libphonenumber may not recognize all test numbers
 * 
 * SA mobile format: +27 [6|7|8]x xxxxxxx
 * Examples: +27821234567, +27711234567, +27601234567
 */
export function isMobileNumber(phone: string): boolean {
  try {
    const phoneNumber = parsePhoneNumber(phone);
    const type = phoneNumber?.getType();
    
    // Special handling for SA numbers - check mobile prefixes first
    // SA mobile numbers (after +27) start with: 6, 7, or 8
    if (phone.startsWith('+27')) {
      const afterCountryCode = phone.substring(3);
      const firstDigit = afterCountryCode[0];
      
      // Check if first digit is 6, 7, or 8
      if (['6', '7', '8'].includes(firstDigit)) {
        return true;
      }
    }
    
    // Fallback to library type detection
    // Type might be undefined for some numbers
    return type !== undefined && 
           type !== 'FIXED_LINE' && 
           type !== 'FIXED_LINE_OR_MOBILE';
  } catch {
    return false;
  }
}

/**
 * Validate phone number with detailed checks
 */
export interface PhoneValidationResult {
  valid: boolean;
  normalized?: string;
  country?: string;
  isMobile?: boolean;
  error?: string;
}

export function validatePhoneNumber(
  phone: string,
  requireMobile: boolean = true
): PhoneValidationResult {
  try {
    // Normalize
    const normalized = normalizePhoneNumber(phone);
    
    // Validate E.164
    if (!validateE164(normalized)) {
      return {
        valid: false,
        error: 'Invalid phone number format',
      };
    }
    
    // Get country
    const country = getCountryCode(normalized);
    
    // Check if mobile
    const isMobile = isMobileNumber(normalized);
    
    if (requireMobile && !isMobile) {
      return {
        valid: false,
        error: 'Only mobile numbers are supported',
      };
    }
    
    return {
      valid: true,
      normalized,
      country: country || undefined,
      isMobile,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid phone number',
    };
  }
}





