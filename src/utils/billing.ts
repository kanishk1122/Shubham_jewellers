import {
  BillItem,
  Product,
  Bill,
  MetalRate,
  TaxSettings,
} from "@/types/billing";

export class BillingCalculator {
  private static readonly DEFAULT_GST_RATE = 3; // 3% for jewelry

  static calculateItemPrice(
    product: Product,
    quantity: number,
    discount: number = 0
  ): number {
    // Base price calculation: weight * rate per gram
    let baseAmount = product.weight * product.basePrice * quantity;

    // Add making charges
    let makingAmount = 0;
    if (product.makingCharges > 0) {
      // If making charges is less than 100, treat as percentage, otherwise as fixed amount
      makingAmount =
        product.makingCharges < 100
          ? (baseAmount * product.makingCharges) / 100
          : product.makingCharges * quantity;
    }

    // Add wastage
    let wastageAmount = 0;
    if (product.wastage > 0) {
      wastageAmount = (baseAmount * product.wastage) / 100;
    }

    // Add stone costs
    let stoneCost = 0;
    if (product.stoneDetails) {
      stoneCost =
        product.stoneDetails.reduce((total, stone) => {
          return total + stone.count * stone.weight * stone.pricePerCarat;
        }, 0) * quantity;
    }

    let totalAmount = baseAmount + makingAmount + wastageAmount + stoneCost;

    // Apply discount
    if (discount > 0) {
      totalAmount = totalAmount - (totalAmount * discount) / 100;
    }

    return Math.round(totalAmount * 100) / 100; // Round to 2 decimal places
  }

  static calculateBillTotals(
    items: BillItem[],
    taxSettings?: TaxSettings
  ): {
    subtotal: number;
    totalDiscount: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    grandTotal: number;
  } {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = this.calculateItemPrice(item.product, item.quantity, 0);
      return sum + itemTotal;
    }, 0);

    const totalDiscount = items.reduce((sum, item) => {
      const itemTotal = this.calculateItemPrice(item.product, item.quantity, 0);
      const discountAmount = (itemTotal * item.discount) / 100;
      return sum + discountAmount;
    }, 0);

    const taxableAmount = subtotal - totalDiscount;

    // Calculate GST
    const gstRate = taxSettings?.cgst || this.DEFAULT_GST_RATE;
    const cgst = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
    const sgst = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
    const igst = 0; // Typically used for inter-state transactions

    const totalTax = cgst + sgst + igst;
    const grandTotal = taxableAmount + totalTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      cgst,
      sgst,
      igst,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }

  static generateBillNumber(prefix: string = "SJ"): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const time = Date.now().toString().slice(-6);

    return `${prefix}${year}${month}${day}${time}`;
  }

  static convertWeight(
    weight: number,
    fromUnit: WeightUnit,
    toUnit: WeightUnit
  ): number {
    const gramConversions = {
      [WeightUnit.GRAM]: 1,
      [WeightUnit.KILOGRAM]: 1000,
      [WeightUnit.TOLA]: 11.664,
      [WeightUnit.OUNCE]: 28.3495,
      [WeightUnit.POUND]: 453.592,
      [WeightUnit.CARAT]: 0.2,
    };

    const inGrams = weight * gramConversions[fromUnit];
    return inGrams / gramConversions[toUnit];
  }

  static calculatePurityPrice(basePrice: number, purity: string): number {
    const purityMultipliers: { [key: string]: number } = {
      "24K": 1.0,
      "22K": 0.916,
      "21K": 0.875,
      "20K": 0.833,
      "18K": 0.75,
      "16K": 0.666,
      "14K": 0.583,
      "12K": 0.5,
      "10K": 0.416,
      "925": 0.925, // Sterling Silver
      "999": 0.999, // Pure Silver
      PT950: 0.95, // Platinum
      PT900: 0.9,
      PT850: 0.85,
    };

    const multiplier = purityMultipliers[purity] || 1.0;
    return basePrice * multiplier;
  }

  static formatCurrency(amount: number, currency: string = "INR"): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  static numberToWords(amount: number): string {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const thousands = ["", "Thousand", "Lakh", "Crore"];

    if (amount === 0) return "Zero";

    const [rupees, paise] = amount.toString().split(".");
    let rupeesInWords = "";
    let paisaInWords = "";

    if (parseInt(rupees) > 0) {
      rupeesInWords = this.convertNumberToWords(
        parseInt(rupees),
        ones,
        teens,
        tens,
        thousands
      );
      rupeesInWords += " Rupee" + (parseInt(rupees) !== 1 ? "s" : "");
    }

    if (paise && parseInt(paise) > 0) {
      const paisaValue = parseInt(paise.padEnd(2, "0").slice(0, 2));
      paisaInWords = this.convertNumberToWords(
        paisaValue,
        ones,
        teens,
        tens,
        thousands
      );
      paisaInWords += " Paisa" + (paisaValue !== 1 ? "" : "");
    }

    let result = rupeesInWords;
    if (paisaInWords) {
      result += (rupeesInWords ? " and " : "") + paisaInWords;
    }

    return result + " Only";
  }

  private static convertNumberToWords(
    num: number,
    ones: string[],
    teens: string[],
    tens: string[],
    thousands: string[]
  ): string {
    if (num === 0) return "";

    let result = "";
    let thousandIndex = 0;

    while (num > 0) {
      let chunk = 0;

      if (thousandIndex === 0) {
        chunk = num % 1000;
        num = Math.floor(num / 1000);
      } else {
        chunk = num % 100;
        num = Math.floor(num / 100);
      }

      if (chunk > 0) {
        let chunkWords = "";

        if (chunk >= 100) {
          chunkWords += ones[Math.floor(chunk / 100)] + " Hundred ";
          chunk %= 100;
        }

        if (chunk >= 20) {
          chunkWords += tens[Math.floor(chunk / 10)] + " ";
          chunk %= 10;
        } else if (chunk >= 10) {
          chunkWords += teens[chunk - 10] + " ";
          chunk = 0;
        }

        if (chunk > 0) {
          chunkWords += ones[chunk] + " ";
        }

        if (thousands[thousandIndex]) {
          chunkWords += thousands[thousandIndex] + " ";
        }

        result = chunkWords + result;
      }

      thousandIndex++;
    }

    return result.trim();
  }
}

export enum WeightUnit {
  GRAM = "gram",
  KILOGRAM = "kg",
  TOLA = "tola",
  OUNCE = "oz",
  POUND = "lb",
  CARAT = "carat",
}

export const METAL_RATES: { [key: string]: number } = {
  GOLD_24K: 6500,
  GOLD_22K: 5956,
  GOLD_21K: 5687,
  GOLD_18K: 4875,
  SILVER_999: 85,
  SILVER_925: 78,
  PLATINUM_950: 3200,
  PLATINUM_900: 3040,
  PALLADIUM: 2800,
};

export const MAKING_CHARGES: { [key: string]: number } = {
  RING: 8,
  NECKLACE: 12,
  EARRINGS: 10,
  BRACELET: 10,
  PENDANT: 15,
  CHAIN: 6,
};

export const WASTAGE_RATES: { [key: string]: number } = {
  GOLD: 2,
  SILVER: 1,
  PLATINUM: 1.5,
};
