package file_download

import (
	"api/utils/log"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
)

func downloadFile(url string, headerFields map[string]string) (byteArray []byte, err error) {
	// Get the data
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Warn(fmt.Sprint("Could not get build request. Error: ", err), log.General)
		err = errors.New("could not download file")
		return
	}
	for key, value := range headerFields {
		req.Header.Set(key, value)
	}
	resp, err := client.Do(req)
	if err != nil {
		log.Warn(fmt.Sprint("Could not get file. Error: ", err), log.General)
		err = errors.New("could not download file")
		return
	}
	defer resp.Body.Close()

	// Check response code
	if resp.StatusCode != 200 {
		log.Error("Request for file returned status:  "+resp.Status+".", err, log.General)
		err = errors.New("could not download file")
		return
	}

	// Read content of response body
	var readErr error
	byteArray, readErr = io.ReadAll(resp.Body)
	if readErr != nil {
		log.Error("Could not read file.", readErr, log.General)
		err = errors.New("could not get json string from file")
	}

	return
}

func GetJsonStringFromFile(sourceUrl string, headerFields map[string]string) (jsonString string, e error) {
	log.Info("Trying to get json string from file '"+sourceUrl+"'.", log.General)
	byteArray, err := downloadFile(sourceUrl, headerFields)
	if err != nil {
		log.Warn("Error downloading file. Error: "+err.Error(), log.General)
		log.Info("Trying to find file on local hard drive...", log.General)

		if _, err := os.Stat(sourceUrl); err != nil {
			if os.IsNotExist(err) {
				log.Error("File not found on local hard drive.", err, log.General)
			} else {
				log.Error("File found but there was another error.", err, log.General)
			}
			e = errors.New("could not get json string from file")
			return
		} else {
			log.Info("Found file on local hard drive.", log.General)
			fileReader, openErr := os.Open(sourceUrl)

			if openErr != nil {
				log.Error("There was a error while opening the file.", err, log.General)
				e = errors.New("could not get json string from file")
				return
			}
			var readErr error
			byteArray, readErr = io.ReadAll(fileReader)
			if readErr != nil {
				log.Error("Could not read file.", readErr, log.General)
				e = errors.New("could not get json string from file")
			}
		}
	} else {
		log.Info("File '"+sourceUrl+"' downloaded.", log.General)
	}

	jsonString = string(byteArray)

	return
}
