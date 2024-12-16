// SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
)

func main() {

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		defer r.Body.Close()
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "issues parsing body", http.StatusBadRequest)
			return
		}

		str := string(body)
		fmt.Printf("got: %v, %v\n", len(str), str)
		w.WriteHeader(http.StatusCreated)
	})
	log.Printf("Starting server on :8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
