// Account Matching Utility for Xero Integration
import type { Account } from '@/lib/types';
import type { XeroAccount } from './types';

interface MatchResult {
  confidence: number;
  reason: string;
}

/**
 * Normalize account number by removing spaces, dashes, and leading zeros
 */
function normalizeAccountNumber(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/[\s-]/g, '').replace(/^0+/, '').toLowerCase();
}

/**
 * Normalize a string for comparison (lowercase, trim, remove extra spaces)
 */
function normalizeString(value: string | null | undefined): string {
  if (!value) return '';
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity between two strings (0-100)
 */
function stringSimilarity(a: string, b: string): number {
  const normalA = normalizeString(a);
  const normalB = normalizeString(b);

  if (!normalA || !normalB) return 0;
  if (normalA === normalB) return 100;

  const maxLength = Math.max(normalA.length, normalB.length);
  const distance = levenshteinDistance(normalA, normalB);

  return Math.round((1 - distance / maxLength) * 100);
}

/**
 * Check if one string contains significant parts of another
 */
function containsSignificantMatch(a: string, b: string): boolean {
  const normalA = normalizeString(a);
  const normalB = normalizeString(b);

  if (!normalA || !normalB) return false;

  // Check if one contains the other
  if (normalA.includes(normalB) || normalB.includes(normalA)) {
    return true;
  }

  // Check if major words match
  const wordsA = normalA.split(' ').filter(w => w.length > 2);
  const wordsB = normalB.split(' ').filter(w => w.length > 2);

  const matchingWords = wordsA.filter(word =>
    wordsB.some(wordB => wordB.includes(word) || word.includes(wordB))
  );

  return matchingWords.length >= Math.min(wordsA.length, wordsB.length) / 2;
}

/**
 * Calculate match score between a Xero account and a local account
 */
export function calculateAccountMatch(
  xeroAccount: XeroAccount,
  localAccount: Account
): MatchResult {
  // Account number exact match (highest confidence)
  const xeroAccountNum = normalizeAccountNumber(xeroAccount.BankAccountNumber);
  const localAccountNum = normalizeAccountNumber(localAccount.account_number);

  if (xeroAccountNum && localAccountNum && xeroAccountNum === localAccountNum) {
    return {
      confidence: 95,
      reason: 'Account number matches exactly',
    };
  }

  // Name exact match (high confidence)
  const nameSimilarity = stringSimilarity(xeroAccount.Name, localAccount.name);
  if (nameSimilarity >= 90) {
    return {
      confidence: 85,
      reason: 'Account name matches exactly',
    };
  }

  // Name contains significant match
  if (containsSignificantMatch(xeroAccount.Name, localAccount.name)) {
    return {
      confidence: 70,
      reason: `Name match: "${localAccount.name}" similar to "${xeroAccount.Name}"`,
    };
  }

  // High name similarity (70-90%)
  if (nameSimilarity >= 70) {
    return {
      confidence: Math.round(nameSimilarity * 0.8), // Scale to max 72
      reason: `Name similarity: ${nameSimilarity}%`,
    };
  }

  // Type matching - lower confidence
  const xeroType = xeroAccount.BankAccountType || xeroAccount.Type;
  const localType = localAccount.account_type;

  const typeMatches = (
    (xeroType === 'BANK' && localType === 'bank') ||
    (xeroType === 'CREDITCARD' && localType === 'credit') ||
    (xeroType === 'PAYPAL' && localType === 'bank')
  );

  // If we have partial name match and type match
  if (typeMatches && nameSimilarity >= 50) {
    return {
      confidence: Math.round(nameSimilarity * 0.7), // Scale to max 63
      reason: `Account type matches with ${nameSimilarity}% name similarity`,
    };
  }

  // No significant match
  return {
    confidence: 0,
    reason: null as unknown as string,
  };
}

/**
 * Find the best matching local account for a Xero account
 */
export function findBestMatch(
  xeroAccount: XeroAccount,
  localAccounts: Account[]
): { account: Account | null; confidence: number; reason: string | null } {
  let bestMatch: Account | null = null;
  let bestConfidence = 0;
  let bestReason: string | null = null;

  for (const localAccount of localAccounts) {
    const { confidence, reason } = calculateAccountMatch(xeroAccount, localAccount);

    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestMatch = localAccount;
      bestReason = reason;
    }
  }

  // Only return matches with meaningful confidence
  if (bestConfidence >= 50) {
    return {
      account: bestMatch,
      confidence: bestConfidence,
      reason: bestReason,
    };
  }

  return {
    account: null,
    confidence: 0,
    reason: null,
  };
}

/**
 * Map Xero account type to MFFA account type
 */
export function mapXeroTypeToMFFAType(
  xeroType: string | undefined
): 'bank' | 'credit' {
  switch (xeroType) {
    case 'CREDITCARD':
      return 'credit';
    case 'BANK':
    case 'PAYPAL':
    default:
      return 'bank';
  }
}
