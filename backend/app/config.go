package app

import (
	"encoding/json"
	"os"
	"strings"

	"gopkg.in/yaml.v3"
)

type (
	Config struct {
		Echo        Echo        `json:"echo" yaml:"echo"`
		Mongo       Mongo       `json:"mongo" yaml:"mongo"`
		Scheduler   Scheduler   `json:"scheduler" yaml:"scheduler"`
		Panel       bool        `json:"panel" yaml:"panel"`
		Gateway     bool        `json:"gateway" yaml:"gateway"`
		Domain      string      `json:"domain" yaml:"domain"`
		Dev         bool        `json:"dev" yaml:"dev"`
		SuccessTest SuccessTest `json:"success_test" yaml:"success_test"`
		SAPC        SAPC        `json:"sapc" yaml:"sapc"`
	}
	Scheduler struct {
		Enable                bool `json:"enable" yaml:"enable"`
		BrandListInterval     int  `json:"brand_list_interval" yaml:"brand_list_interval"`
		MainQueueInterval     int  `json:"main_queue_interval" yaml:"main_queue_interval"`
		CloseTxnInterval      int  `json:"close_txn_interval" yaml:"close_txn_interval"`
		UpdateSapcTxnInterval int  `json:"update_sapc_txn_interval" yaml:"update_sapc_txn_interval"`
	}
	Echo struct {
		Port      string `json:"port" yaml:"port"`
		MediaPath string `json:"media_path" yaml:"media_path"`
	}
	Mongo struct {
		DB  string `json:"db" yaml:"db"`
		URI string `json:"uri" yaml:"uri"`
	}
	SuccessTest struct {
		Enable      bool   `json:"enable" yaml:"enable"`
		Pan         string `json:"pan" yaml:"pan"`
		Cvv2        string `json:"cvv2" yaml:"cvv2"`
		ExpireMonth string `json:"expire_month" yaml:"expire_month"`
		ExpireYear  string `json:"expire_year" yaml:"expire_year"`
		Pin         string `json:"pin" yaml:"pin"`
	}
	SAPC struct {
		URL      string `json:"url" yaml:"url"`
		Username string `json:"username" yaml:"username"`
		Password string `json:"password" yaml:"password"`
	}
)

var (
	defaultConfig = Config{
		Echo: Echo{
			Port: "4000",
		},
	}
)

func readConfig() (c Config) {
	for _, path := range []string{"config.yaml", "config.json", "../config.json", "../config.yaml"} {
		file, err := os.ReadFile(path)
		if err != nil {
			Error("loading config.json failed: " + err.Error())
			continue
		}
		if strings.Contains(path, "yaml") {
			if err := yaml.Unmarshal(file, &c); err != nil {
				Error("marshaling " + path + " failed: " + err.Error())
				continue
			}
		} else if strings.Contains(path, "json") {
			if err := json.Unmarshal(file, &c); err != nil {
				Error("marshaling " + path + " failed: " + err.Error())
				continue
			}
		}

		return c
	}
	return defaultConfig
}
