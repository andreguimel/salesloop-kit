// Utility functions to mask sensitive data in search results

export function maskName(name: string): string {
  if (!name) return '';
  const words = name.split(' ');
  return words.map((word, index) => {
    if (index === 0) {
      return word.slice(0, 3) + '*'.repeat(Math.max(0, word.length - 3));
    }
    return '*'.repeat(word.length);
  }).join(' ');
}

export function maskCnpj(cnpj: string): string {
  if (!cnpj) return '';
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length < 14) return cnpj;
  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 4);
  return part1 + '.' + part2 + '*.***/****-**';
}

export function maskPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return '(XX) XXXXX-XXXX';
  }
  if (digits.length === 10) {
    return '(XX) XXXX-XXXX';
  }
  return 'XX XXXX-XXXX';
}

export function maskEmail(email: string): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***.***';
  const localPart = parts[0].slice(0, 2) + '*'.repeat(Math.max(3, parts[0].length - 2));
  return localPart + '@*****.***';
}

export function maskAddress(address: string): string {
  if (!address) return '';
  const words = address.split(' ');
  return words.map((word, index) => {
    // Keep first word (usually RUA, AVENIDA, etc) and show partial of others
    if (index === 0) {
      return word;
    }
    if (word.length <= 2) {
      return word; // Keep short words like "DE", "DO"
    }
    // Show first 2-3 chars and mask the rest
    const visibleChars = Math.min(2, word.length);
    return word.slice(0, visibleChars) + '*'.repeat(Math.max(0, word.length - visibleChars));
  }).join(' ');
}

export function maskCep(cep: string): string {
  if (!cep) return '';
  const digits = cep.replace(/\D/g, '');
  if (digits.length < 5) return cep;
  // Show first 3 digits only
  return digits.slice(0, 3) + '*****';
}
