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
