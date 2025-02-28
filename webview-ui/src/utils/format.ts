export function formatLargeNumber(num: number): string {
	if (num >= 1e9) {
		return (num / 1e9).toFixed(1) + "b"
	}
	if (num >= 1e6) {
		return (num / 1e6).toFixed(1) + "m"
	}
	if (num >= 1e3) {
		return (num / 1e3).toFixed(1) + "k"
	}
	return num.toString()
}

/**
 * 格式化价格
 * @param price 价格
 * @param currency 货币单位
 * @returns 格式化后的价格
 */
export const formatPrice = (price: number, currency?: string) => {
	if (!price) {
		return "0";
	}
	return new Intl.NumberFormat("zh-CN", {
		style: "currency",
		currency: currency || "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(price)
}