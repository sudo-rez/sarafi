package txn

import (
	"backend/internal/request"
)

type Callback struct {
	URL         string `bson:"url"`
	Method      string `bson:"method"`
	FailURL     string `bson:"fail_url"`
	SuccessURL  string `bson:"success_url"`
	RedirectURL string `bson:"redirect_url"`
	Done        bool   `bson:"done"`
}

func (v Callback) FailRequest() error {
	if v.FailURL != "" {
		req := request.HTTPRequest{
			Name:   "CallBackFailRequest",
			URL:    v.FailURL,
			Method: "GET",
		}
		if _, _, err := req.Send(); err != nil {
			return err
		}
	}
	return nil
}
func (v Callback) SuccessRequest() error {
	if v.SuccessURL != "" {
		req := request.HTTPRequest{
			Name:   "CallBackSuccessRequest",
			URL:    v.SuccessURL,
			Method: "GET",
		}
		if _, _, err := req.Send(); err != nil {
			return err
		}
	}
	return nil
}
func (v Callback) CallBackTxnRequest(t Txn) error {
	if v.URL != "" {
		if v.Method == "" {
			v.Method = "POST"
		}
		req := request.HTTPRequest{}

		switch v.Method {
		case "POST":
			req = request.HTTPRequest{
				Name:   "CallBackTxnRequest",
				URL:    v.URL,
				Method: v.Method,
				Body:   t.RestGateWay(),
				Headers: map[string]string{
					"content-type": "application/json",
				},
			}
		case "GET":
			req = request.HTTPRequest{
				Name:   "CallBackTxnRequest",
				URL:    v.URL + t.ToQueryParam(),
				Method: v.Method,
			}

		}
		if _, _, err := req.Send(); err != nil {
			return err
		}
	}
	return nil
}

func (v Txn) SendCallBack() error {
	if err := v.CallBack.CallBackTxnRequest(v); err != nil {
		return err
	}
	if v.Successful {
		if err := v.CallBack.SuccessRequest(); err != nil {
			return err
		}
	} else {
		if err := v.CallBack.FailRequest(); err != nil {
			return err
		}
	}
	v.CallBack.Done = true
	return v.Save()
}
func (v *Withdraw) SendCallBack() error {
	if err := v.Callback.CallBackWithdrawRequest(v); err != nil {
		return err
	}
	if v.Done {
		if err := v.Callback.SuccessRequest(); err != nil {
			return err
		}
	} else {
		if err := v.Callback.FailRequest(); err != nil {
			return err
		}
	}
	v.Callback.Done = true
	return v.Save()
}

func (v Callback) CallBackWithdrawRequest(w *Withdraw) error {
	if v.URL != "" {
		if v.Method == "" {
			v.Method = "POST"
		}
		req := request.HTTPRequest{}

		switch v.Method {
		case "POST":
			req = request.HTTPRequest{
				Name:   "CallBackWithdrawRequest",
				URL:    v.URL,
				Method: v.Method,
				Body:   w.RestGateWay(),
				Headers: map[string]string{
					"content-type": "application/json",
				},
			}

		case "GET":
			req = request.HTTPRequest{
				Name:   "CallBackWithdrawRequest",
				URL:    v.URL + w.ToQueryParam(),
				Method: v.Method,
			}

		}
		if _, _, err := req.Send(); err != nil {
			return err
		}
	}
	return nil
}
