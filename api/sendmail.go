package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type requestPayload struct {
	Name    string `json:"name"`
	Message string `json:"message"`
}

type resendEmail struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Subject string `json:"subject"`
	Text    string `json:"text"`
}

func main() {
	http.HandleFunc("/sendmail", func(w http.ResponseWriter, r *http.Request) {
		// Allow preflight (CORS)
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Access-Control-Allow-Origin", "*")

		var payload requestPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Bad request: invalid JSON", http.StatusBadRequest)
			return
		}

		apiKey := os.Getenv("RESEND_API_KEY")
		toEmail := os.Getenv("TO_EMAIL")
		fromEmail := os.Getenv("FROM_EMAIL")

		if apiKey == "" || toEmail == "" || fromEmail == "" {
			http.Error(w, "Server not configured (missing env vars)", http.StatusInternalServerError)
			return
		}

		email := resendEmail{
			From:    fromEmail,
			To:      toEmail,
			Subject: fmt.Sprintf("Portfolio message from %s", payload.Name),
			Text:    fmt.Sprintf("From: %s\n\n%s", payload.Name, payload.Message),
		}

		bodyBytes, err := json.Marshal(email)
		if err != nil {
			http.Error(w, "Failed to build request", http.StatusInternalServerError)
			return
		}

		req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(bodyBytes))
		if err != nil {
			http.Error(w, "Failed to create request", http.StatusInternalServerError)
			return
		}

		req.Header.Set("Authorization", "Bearer "+apiKey)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			http.Error(w, "Failed to contact Resend API", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		respBody, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
			http.Error(w, fmt.Sprintf("Resend API error: %d %s", resp.StatusCode, string(respBody)), resp.StatusCode)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Email sent"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Println("Server listening on port", port)
	http.ListenAndServe(":"+port, nil)
}
