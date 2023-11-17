package request

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"time"
)

type HTTPRequest struct {
	Name      string
	Method    string
	URL       string
	BasicAuth string
	Headers   map[string]string
	Body      interface{}
}

func (v HTTPRequest) Send() (int, []byte, error) {
	history := History{
		Name:      v.Name,
		URL:       v.URL,
		Method:    v.Method,
		CreatedAt: time.Now(),
	}

	client := &http.Client{}
	var (
		requestBody []byte
		err         error
	)
	requestBody, err = json.Marshal(v.Body)
	if err != nil {
		history.Errors = append(history.Errors, err.Error())
		history.Save()
		return 0, nil, err
	}
	history.RequestBody = string(requestBody)

	req, err := http.NewRequest(v.Method, v.URL, bytes.NewBuffer(requestBody))

	if err != nil {
		history.Errors = append(history.Errors, err.Error())
		history.Save()
		return 0, nil, err
	}
	for key, value := range v.Headers {
		req.Header.Add(key, value)
	}
	if v.BasicAuth != "" {
		req.Header.Add("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(v.BasicAuth)))
	}
	res, err := client.Do(req)
	if err != nil {
		history.Errors = append(history.Errors, err.Error())
		history.Save()
		return 0, nil, err
	}
	defer res.Body.Close()
	history.StatusCode = res.StatusCode

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		history.Errors = append(history.Errors, err.Error())
		history.Save()
		return res.StatusCode, nil, err
	}
	history.ResponseBody = string(body)
	history.Save()
	return res.StatusCode, body, nil
}
func (v HTTPRequest) SendAndDecode(result interface{}) (int, error) {
	statusCode, body, err := v.Send()
	if err != nil {
		return statusCode, err
	}
	err = json.Unmarshal(body, result)
	return statusCode, err
}
