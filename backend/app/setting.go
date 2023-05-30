package app

import (
	"context"
	"html/template"
	"net/http"
	"backend/pkg/util"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type (
	Setting struct {
		Code    string  `bson:"code" json:"-"`
		GateWay GateWay `bson:"gateway" json:"gateway"`
	}
	GateWay struct {
		BlockedBanks      []string `bson:"blocked_banks" json:"blocked_banks"`
		Messages          string   `bson:"messages" json:"messages"`
		OpenTime          int      `bson:"open_time" json:"open_time"`
		AlgorithmDuration int      `bson:"alg_duration" json:"alg_duration"`
	}
	SettingEcho struct {
		Prefix string
	}
)

var (
	settingCollection = "setting"
	defaultSetting    = Setting{
		GateWay: GateWay{
			BlockedBanks:      []string{},
			Messages:          "",
			OpenTime:          10,
			AlgorithmDuration: 10,
		},
	}
)

func (v Setting) Rest() echo.Map {
	rest := echo.Map{
		"messages":  template.HTML(v.GateWay.Messages),
		"open_time": v.GateWay.OpenTime,
	}
	rest["blocked_banks"] = util.ArrayToJsonString(v.GateWay.BlockedBanks)
	return rest
}
func (v *Setting) Save() error {
	defer updateSetting()
	if v.GateWay.BlockedBanks == nil {
		v.GateWay.BlockedBanks = make([]string, 0)
	}
	upsert := true
	v.Code = "active"
	_, err := MDB.CollectionString(settingCollection).UpdateOne(context.Background(),
		bson.M{"code": "active"}, bson.M{"$set": v}, &options.UpdateOptions{Upsert: &upsert})
	return err
}
func ReadSetting() (Setting, error) {
	v := new(Setting)
	return *v, MDB.FindOne(settingCollection, bson.M{"code": "active"}, v)
}

func readSetting() Setting {
	v := new(Setting)
	if err := MDB.FindOne(settingCollection, bson.M{"code": "active"}, v); err != nil {
		Error(err)
		return defaultSetting
	}
	return *v
}
func updateSetting() {
	Stg = readSetting()
	Debug("Setting Updated", Stg.Rest())
}
func (e SettingEcho) Current(c echo.Context) error {
	v, err := ReadSetting()
	if err != nil {
		if err.Error() == "mongo: no documents in result" {
			v.Save()
			return c.JSON(http.StatusOK, echo.Map{"setting": v})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"setting": v})
}

func (e SettingEcho) Save(c echo.Context) error {
	v := new(Setting)
	if err := c.Bind(v); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if err := v.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"msg": "success"})
}
