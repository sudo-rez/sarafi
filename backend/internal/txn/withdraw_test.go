package txn

import (
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestWithdraw_Create(t *testing.T) {
	brandId, _ := primitive.ObjectIDFromHex("63e1507dfa763b6f49299e45")
	tests := []struct {
		name    string
		v       Withdraw
		wantErr bool
	}{
		{name: "1", v: Withdraw{
			Amount: 1000000,
			Card:   "6219123312341542",
			Brand:  brandId,
		}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := tt.v.Create(); (err != nil) != tt.wantErr {
				t.Errorf("Withdraw.Create() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
