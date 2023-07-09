package app

import (
	"encoding/json"
	"os"
	"strings"

	"gopkg.in/yaml.v3"
)

type (
	Config struct {
		Echo  Echo  `json:"echo" yaml:"echo"`
		Dev   bool  `json:"dev" yaml:"dev"`
		Sepah Sepah `json:"sepah" yaml:"sepah"`
	}
	Echo struct {
		Port      string `json:"port" yaml:"port"`
		MediaPath string `json:"media_path" yaml:"media_path"`
	}
	Sepah struct {
		BaseURL  string `json:"base_url" yaml:"base_url"`
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
