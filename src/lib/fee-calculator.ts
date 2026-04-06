export type DiscountRule =
  | { type: "nth_discount"; from: number; feeVND: number }
  | {
      type: "tiered";
      tiers: Array<{
        upTo?: number;
        from?: number;
        feeVND?: number;
        additionalVND?: number;
        flatVND?: number;
      }>;
    }
  | {
      type: "per_side_with_extra";
      baseFeeVND: number;
      baseCovers: number;
      extraPerToothVND: number;
    }
  | { type: "range"; minVND: number; maxVND: number };

/**
 * Tinh phi cho 1 buoc dieu tri dua tren:
 * - defaultFee: gia mac dinh cua procedure type
 * - discountRule: quy tac giam gia (JSON)
 * - quantity: so luong (so implant, so rang, so lan)
 * - sequenceIndex: thu tu trong ca (1st, 2nd, 3rd...)
 */
export function calculateStepFee(params: {
  defaultFee: number;
  discountRule: DiscountRule | null;
  quantity: number;
  sequenceIndex: number;
}): { unitFee: number; totalFee: number } {
  const { defaultFee, discountRule, quantity, sequenceIndex } = params;

  if (!discountRule) {
    return { unitFee: defaultFee, totalFee: defaultFee * quantity };
  }

  switch (discountRule.type) {
    case "nth_discount": {
      const unitFee =
        sequenceIndex >= discountRule.from ? discountRule.feeVND : defaultFee;
      return { unitFee, totalFee: unitFee * quantity };
    }

    case "tiered": {
      let total = 0;
      for (let i = 1; i <= quantity; i++) {
        const currentIndex = sequenceIndex + i - 1;
        let fee = defaultFee;
        for (const tier of discountRule.tiers) {
          if (tier.upTo && currentIndex <= tier.upTo && tier.feeVND) {
            fee = tier.feeVND;
            break;
          }
          if (tier.from && currentIndex >= tier.from) {
            if (tier.flatVND) {
              fee = tier.flatVND;
            } else if (tier.additionalVND) {
              fee = tier.additionalVND;
            }
          }
        }
        total += fee;
      }
      return { unitFee: total / quantity, totalFee: total };
    }

    case "per_side_with_extra": {
      if (quantity <= discountRule.baseCovers) {
        return {
          unitFee: discountRule.baseFeeVND,
          totalFee: discountRule.baseFeeVND,
        };
      }
      const extraTeeth = quantity - discountRule.baseCovers;
      const total =
        discountRule.baseFeeVND +
        extraTeeth * discountRule.extraPerToothVND;
      return { unitFee: Math.round(total / quantity), totalFee: total };
    }

    case "range": {
      return {
        unitFee: discountRule.minVND,
        totalFee: discountRule.minVND * quantity,
      };
    }

    default:
      return { unitFee: defaultFee, totalFee: defaultFee * quantity };
  }
}

export function formatVND(amount: number | { toString(): string }): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}
