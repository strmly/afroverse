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
    // Examples: 0780782399 → +27780782399, 0821234567 → +27821234567
    if (/^0\d{9}$/.test(cleaned)) {
      const normalized = parsePhoneNumber('+27' + cleaned.substring(1), 'ZA');
      if (!normalized || !normalized.isValid()) {
        throw new Error('Invalid South African phone number format');
      }
      return normalized.format('E.164');
    }
    
    // Handle numbers that start with 27 (country code without +)
    // 27 followed by 9 digits → add +
    if (/^27\d{9}$/.test(cleaned)) {
      const normalized = parsePhoneNumber('+' + cleaned, 'ZA');
      if (!normalized || !normalized.isValid()) {
        throw new Error('Invalid phone number format');
      }
      return normalized.format('E.164');
    }
    
    // If it doesn't start with +, try adding country code
    const phoneWithPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    
    // Parse and format to E.164
    const phoneNumber = parsePhoneNumber(phoneWithPlus, defaultCountry as any);
    
    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error('Invalid phone number format');
    }
    
    return phoneNumber.format('E.164');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid phone number format';
    throw new Error(errorMessage);
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
      // Provide helpful error message
      let errorMessage = 'Invalid phone number format. Please use international format.';
      
      // Check if it looks like a South African number
      if (phone.startsWith('0') && phone.length === 10) {
        errorMessage = 'Invalid phone number format. For South African numbers, use format: +27821234567 or 07821234567';
      } else if (!phone.startsWith('+') && !phone.startsWith('0')) {
        errorMessage = 'Phone number must start with + (international format) or 0 (local format). Example: +27821234567 or 07821234567';
      }
      
      return {
        valid: false,
        error: errorMessage,
      };
    }
    
    // Get country
    const country = getCountryCode(normalized);
    
    // Check if mobile
    const isMobile = isMobileNumber(normalized);
    
    if (requireMobile && !isMobile) {
      // Provide helpful error message based on country
      let errorMessage = 'Only mobile numbers are supported';
      
      if (country === 'ZA') {
        errorMessage = 'Only mobile numbers are supported. South African mobile numbers must start with +27 followed by 6, 7, or 8 (e.g., +27821234567 or 07821234567)';
      } else if (country) {
        errorMessage = `Only mobile numbers are supported for ${country}`;
      }
      
      return {
        valid: false,
        error: errorMessage,
      };
    }
    
    return {
      valid: true,
      normalized,
      country: country || undefined,
      isMobile,
    };
  } catch (error) {
    // Provide helpful error messages
    let errorMessage = 'Invalid phone number';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Enhance error message for common cases
      if (errorMessage.includes('Invalid phone number format')) {
        if (phone.startsWith('0') && phone.length === 10) {
          errorMessage = 'Invalid South African phone number. Use format: +27821234567 or 07821234567';
        } else if (!phone.startsWith('+') && !phone.startsWith('0')) {
          errorMessage = 'Phone number must start with + (international) or 0 (local). Example: +27821234567';
        }
      }
    }
    
    return {
      valid: false,
      error: errorMessage,
    };
  }
}





