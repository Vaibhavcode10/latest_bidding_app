/**
 * Format price in Indian currency format
 * 20000 = 20k
 * 2000000 = 20L (Lakh)
 * 200000000 = 2Cr (Crore)
 * NO decimals - always shows clean whole numbers
 */
export const formatPrice = (price: number | null | undefined): string => {
  if (!price || price === 0) return '0';

  const num = Math.abs(price);

  // Crore (1 Cr = 10,000,000)
  if (num >= 10000000) {
    const crores = Math.round(num / 10000000);
    return `${crores}Cr`;
  }

  // Lakh (1 L = 100,000)
  if (num >= 100000) {
    const lakhs = Math.round(num / 100000);
    return `${lakhs}L`;
  }

  // Thousand (1k = 1,000)
  if (num >= 1000) {
    const thousands = Math.round(num / 1000);
    return `${thousands}k`;
  }

  // Less than 1000, show as is
  return `${price}`;
};

/**
 * Format purse remaining (for team budgets)
 */
export const formatPurse = (amount: number | null | undefined): string => {
  return formatPrice(amount);
};
