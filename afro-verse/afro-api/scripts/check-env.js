#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * 
 * Checks that all required environment variables are set
 * and validates their formats/values.
 */

require('dotenv').config();

const chalk = require('chalk') || {
  red: (s) => s,
  green: (s) => s,
  yellow: (s) => s,
  blue: (s) => s,
};

console.log(chalk.blue('\n🔍 Validating environment configuration...\n'));

// Required variables for all environments
const required = [
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'REDIS_URL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_VERIFY_SERVICE_SID',
  'GCS_PROJECT_ID',
  'GCS_BUCKET_NAME',
  'GEMINI_API_KEY',
];

// Optional but recommended
const recommended = [
  'API_URL',
  'CRON_SECRET',
  'ADMIN_ALLOWED_IPS',
  'ALLOWED_ORIGINS',
];

let errors = 0;
let warnings = 0;

// Check required variables
console.log(chalk.blue('Required Variables:'));
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.log(chalk.red('❌ Missing required variables:'));
  missing.forEach(key => console.log(chalk.red(`   ${key}`)));
  errors += missing.length;
} else {
  console.log(chalk.green('✅ All required variables are set'));
}

// Check recommended variables
console.log(chalk.blue('\nRecommended Variables:'));
const missingRecommended = recommended.filter(key => !process.env[key]);

if (missingRecommended.length > 0) {
  console.log(chalk.yellow('⚠️  Missing recommended variables:'));
  missingRecommended.forEach(key => console.log(chalk.yellow(`   ${key}`)));
  warnings += missingRecommended.length;
} else {
  console.log(chalk.green('✅ All recommended variables are set'));
}

// Validation rules
console.log(chalk.blue('\nValidation Rules:'));

// 1. JWT secrets must be different
if (process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET) {
  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.log(chalk.red('❌ JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different'));
    errors++;
  } else {
    console.log(chalk.green('✅ JWT secrets are different'));
  }
}

// 2. JWT secrets must be strong (in production)
if (process.env.NODE_ENV === 'production') {
  const minSecretLength = 32;
  
  if (process.env.JWT_ACCESS_SECRET && process.env.JWT_ACCESS_SECRET.length < minSecretLength) {
    console.log(chalk.red(`❌ JWT_ACCESS_SECRET too short (min ${minSecretLength} chars, got ${process.env.JWT_ACCESS_SECRET.length})`));
    errors++;
  } else if (process.env.JWT_ACCESS_SECRET) {
    console.log(chalk.green('✅ JWT_ACCESS_SECRET is strong'));
  }
  
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < minSecretLength) {
    console.log(chalk.red(`❌ JWT_REFRESH_SECRET too short (min ${minSecretLength} chars, got ${process.env.JWT_REFRESH_SECRET.length})`));
    errors++;
  } else if (process.env.JWT_REFRESH_SECRET) {
    console.log(chalk.green('✅ JWT_REFRESH_SECRET is strong'));
  }
}

// 3. VERBOSE_ERRORS must be false in production
if (process.env.NODE_ENV === 'production' && process.env.VERBOSE_ERRORS === 'true') {
  console.log(chalk.red('❌ VERBOSE_ERRORS must be false in production (security risk)'));
  errors++;
} else if (process.env.NODE_ENV === 'production') {
  console.log(chalk.green('✅ VERBOSE_ERRORS is disabled in production'));
}

// 4. MongoDB URI format
if (process.env.MONGODB_URI) {
  if (!process.env.MONGODB_URI.startsWith('mongodb://') && !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
    console.log(chalk.red('❌ MONGODB_URI must start with mongodb:// or mongodb+srv://'));
    errors++;
  } else {
    console.log(chalk.green('✅ MONGODB_URI format is valid'));
  }
}

// 5. Redis URL format
if (process.env.REDIS_URL) {
  if (!process.env.REDIS_URL.startsWith('redis://') && !process.env.REDIS_URL.startsWith('rediss://')) {
    console.log(chalk.red('❌ REDIS_URL must start with redis:// or rediss://'));
    errors++;
  } else {
    console.log(chalk.green('✅ REDIS_URL format is valid'));
  }
  
  // Warn if using redis:// in production (should use rediss:// for TLS)
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL.startsWith('redis://')) {
    console.log(chalk.yellow('⚠️  Consider using rediss:// (TLS) for production Redis'));
    warnings++;
  }
}

// 6. GCS configuration
if (process.env.GCS_KEY_FILE) {
  const fs = require('fs');
  if (!fs.existsSync(process.env.GCS_KEY_FILE)) {
    console.log(chalk.red(`❌ GCS_KEY_FILE not found: ${process.env.GCS_KEY_FILE}`));
    errors++;
  } else {
    console.log(chalk.green('✅ GCS_KEY_FILE exists'));
  }
}

// 7. Twilio credentials format
if (process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  console.log(chalk.yellow('⚠️  TWILIO_ACCOUNT_SID should start with "AC"'));
  warnings++;
}

if (process.env.TWILIO_VERIFY_SERVICE_SID && !process.env.TWILIO_VERIFY_SERVICE_SID.startsWith('VA')) {
  console.log(chalk.yellow('⚠️  TWILIO_VERIFY_SERVICE_SID should start with "VA"'));
  warnings++;
}

// 8. API_URL should match NODE_ENV
if (process.env.API_URL && process.env.NODE_ENV === 'production') {
  if (process.env.API_URL.includes('localhost')) {
    console.log(chalk.red('❌ API_URL should not contain localhost in production'));
    errors++;
  } else if (!process.env.API_URL.startsWith('https://')) {
    console.log(chalk.red('❌ API_URL must use HTTPS in production'));
    errors++;
  } else {
    console.log(chalk.green('✅ API_URL is production-ready'));
  }
}

// Summary
console.log(chalk.blue('\n═══════════════════════════════════════'));
console.log(chalk.blue('Summary:'));
console.log(chalk.blue('═══════════════════════════════════════'));

if (errors === 0 && warnings === 0) {
  console.log(chalk.green('✅ Configuration is valid!'));
  console.log(chalk.green('✅ All checks passed'));
  process.exit(0);
} else {
  if (errors > 0) {
    console.log(chalk.red(`❌ ${errors} error(s) found`));
  }
  if (warnings > 0) {
    console.log(chalk.yellow(`⚠️  ${warnings} warning(s) found`));
  }
  
  if (errors > 0) {
    console.log(chalk.red('\n❌ Configuration is INVALID. Please fix errors above.'));
    process.exit(1);
  } else {
    console.log(chalk.yellow('\n⚠️  Configuration is valid but has warnings. Review them before production deployment.'));
    process.exit(0);
  }
}







