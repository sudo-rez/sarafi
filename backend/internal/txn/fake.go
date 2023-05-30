package txn

import (
	"math/rand"
	"net"
	"backend/app"
	"time"

	"github.com/labstack/gommon/random"
)

var (
	Messages = []string{
		"OK", "تراکنش ناموفق ٬ لطفا دقایقی دیگر مجددا تلاش نمایید", "خطای رمزنگاری ٬ لطفا دقایقی دیگر مجددا تلاش نمایید", "موجودی ناکافی",
	}
	IranCardsPrefix = []string{
		"627412", "627381", "505785", "622106", "639194", "627884", "622108", "639347", "502229", "636214",
		"585983", "627353", "502908", "627648", "207177", "636949", "502938", "504172", "589463", "621986",
		"589210", "604932", "639607", "639346", "502806", "504706", "603769", "627961", "606373", "639599",
		"627488", "502910", "603770", "639217", "505416", "636795", "628023", "610433", "991975", "603799",
		"639370", "627760", "628157", "505801", "606256", "936450", "983254", "581672", "585947",
	}
)

func InsertFakeData(n int, FakeBrandNames ...string) {
	for i := 0; i < n; i++ {
		size := 4
		ip := make([]byte, size)
		for i := 0; i < size; i++ {
			ip[i] = byte(rand.Intn(256))
		}
		randIp := net.IP(ip).To4().String()

		t := Txn{
			Source:      IranCardsPrefix[rand.Intn(23)] + random.String(10, random.Numeric),
			Destination: IranCardsPrefix[rand.Intn(23)] + random.String(10, random.Numeric),
			Amount:      int64(rand.Intn(9999999999)),
			Message:     Messages[rand.Intn(3)],
			PaymentID:   random.String(10, random.Numeric),
			SiteRef:     random.String(10, random.Numeric),
			CheckoutRef: random.String(5, random.Numeric),
			Account:     "09" + random.String(9, random.Numeric),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			ClientIP:    randIp,
			BrandName:   FakeBrandNames[i%len(FakeBrandNames)],
		}
		if err := t.Save(); err != nil {
			app.Error(err.Error())
		}
	}
}
