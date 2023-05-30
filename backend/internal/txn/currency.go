package txn

import "strings"

func AmountFromCurrency(amount int64, currency string) int64 {
	currency = strings.ToLower(currency)
	switch currency {
	case "tom":
		return amount * 10
	case "irt":
		return amount * 10000
	}
	return amount
}
