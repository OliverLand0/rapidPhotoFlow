package com.rapidphotoflow.keywords

import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import static com.kms.katalon.core.testobject.ObjectRepository.findWindowsObject

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.checkpoint.Checkpoint
import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.mobile.keyword.MobileBuiltInKeywords as Mobile
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testcase.TestCase
import com.kms.katalon.core.testdata.TestData
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.RequestObject
import com.kms.katalon.core.testobject.ResponseObject
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.configuration.RunConfiguration

import groovy.json.JsonSlurper
import groovy.json.JsonOutput

import internal.GlobalVariable

/**
 * Custom keywords for API operations
 */
public class ApiKeywords {

	private String authToken = null
	private JsonSlurper jsonSlurper = new JsonSlurper()

	/**
	 * Get all photos via API
	 * @return ResponseObject API response
	 */
	@Keyword
	def getPhotos() {
		RequestObject request = new RequestObject('GetPhotos')
		request.setRestUrl(GlobalVariable.API_BASE_URL + '/api/photos')
		request.setRestRequestMethod('GET')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json'],
			['name': 'Authorization', 'value': 'Bearer ' + (authToken ?: '')]
		])

		return WS.sendRequest(request)
	}

	/**
	 * Get photo by ID via API
	 * @param photoId UUID of the photo
	 * @return ResponseObject API response
	 */
	@Keyword
	def getPhotoById(String photoId) {
		RequestObject request = new RequestObject('GetPhotoById')
		request.setRestUrl(GlobalVariable.API_BASE_URL + '/api/photos/' + photoId)
		request.setRestRequestMethod('GET')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json'],
			['name': 'Authorization', 'value': 'Bearer ' + (authToken ?: '')]
		])

		return WS.sendRequest(request)
	}

	/**
	 * Delete photo via API
	 * @param photoId UUID of the photo to delete
	 * @return ResponseObject API response
	 */
	@Keyword
	def deletePhoto(String photoId) {
		RequestObject request = new RequestObject('DeletePhoto')
		request.setRestUrl(GlobalVariable.API_BASE_URL + '/api/photos/' + photoId)
		request.setRestRequestMethod('DELETE')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json'],
			['name': 'Authorization', 'value': 'Bearer ' + (authToken ?: '')]
		])

		return WS.sendRequest(request)
	}

	/**
	 * Perform action on photo via API
	 * @param photoId UUID of the photo
	 * @param action Action to perform: 'approve', 'reject', 'retry'
	 * @return ResponseObject API response
	 */
	@Keyword
	def performPhotoAction(String photoId, String action) {
		RequestObject request = new RequestObject('PhotoAction')
		request.setRestUrl(GlobalVariable.API_BASE_URL + '/api/photos/' + photoId + '/action')
		request.setRestRequestMethod('POST')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json'],
			['name': 'Authorization', 'value': 'Bearer ' + (authToken ?: '')]
		])
		request.setHttpBody(JsonOutput.toJson(['action': action.toUpperCase()]))

		return WS.sendRequest(request)
	}

	/**
	 * Add tag to photo via API
	 * @param photoId UUID of the photo
	 * @param tag Tag name to add
	 * @return ResponseObject API response
	 */
	@Keyword
	def addPhotoTag(String photoId, String tag) {
		RequestObject request = new RequestObject('AddPhotoTag')
		request.setRestUrl(GlobalVariable.API_BASE_URL + '/api/photos/' + photoId + '/tags')
		request.setRestRequestMethod('POST')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json'],
			['name': 'Authorization', 'value': 'Bearer ' + (authToken ?: '')]
		])
		request.setHttpBody(JsonOutput.toJson(['tag': tag]))

		return WS.sendRequest(request)
	}

	/**
	 * Remove tag from photo via API
	 * @param photoId UUID of the photo
	 * @param tag Tag name to remove
	 * @return ResponseObject API response
	 */
	@Keyword
	def removePhotoTag(String photoId, String tag) {
		RequestObject request = new RequestObject('RemovePhotoTag')
		request.setRestUrl(GlobalVariable.API_BASE_URL + '/api/photos/' + photoId + '/tags/' + URLEncoder.encode(tag, 'UTF-8'))
		request.setRestRequestMethod('DELETE')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json'],
			['name': 'Authorization', 'value': 'Bearer ' + (authToken ?: '')]
		])

		return WS.sendRequest(request)
	}

	/**
	 * Perform bulk action on photos via API
	 * @param photoIds List of photo UUIDs
	 * @param action Action to perform: 'APPROVE', 'REJECT', 'RETRY'
	 * @return ResponseObject API response
	 */
	@Keyword
	def bulkAction(List<String> photoIds, String action) {
		RequestObject request = new RequestObject('BulkAction')
		request.setRestUrl(GlobalVariable.API_BASE_URL + '/api/photos/bulk-action')
		request.setRestRequestMethod('POST')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json'],
			['name': 'Authorization', 'value': 'Bearer ' + (authToken ?: '')]
		])
		request.setHttpBody(JsonOutput.toJson([
			'photoIds': photoIds,
			'action': action.toUpperCase()
		]))

		return WS.sendRequest(request)
	}

	/**
	 * Bulk delete photos via API
	 * @param photoIds List of photo UUIDs to delete
	 * @return ResponseObject API response
	 */
	@Keyword
	def bulkDelete(List<String> photoIds) {
		RequestObject request = new RequestObject('BulkDelete')
		request.setRestUrl(GlobalVariable.API_BASE_URL + '/api/photos/bulk-delete')
		request.setRestRequestMethod('POST')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json'],
			['name': 'Authorization', 'value': 'Bearer ' + (authToken ?: '')]
		])
		request.setHttpBody(JsonOutput.toJson(['photoIds': photoIds]))

		return WS.sendRequest(request)
	}

	/**
	 * Get photo counts by status via API
	 * @return ResponseObject API response with status counts
	 */
	@Keyword
	def getPhotoCounts() {
		RequestObject request = new RequestObject('GetPhotoCounts')
		request.setRestUrl(GlobalVariable.API_BASE_URL + '/api/photos/counts')
		request.setRestRequestMethod('GET')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json'],
			['name': 'Authorization', 'value': 'Bearer ' + (authToken ?: '')]
		])

		return WS.sendRequest(request)
	}

	/**
	 * Get events via API
	 * @param photoId Optional photo ID to filter events
	 * @return ResponseObject API response with events
	 */
	@Keyword
	def getEvents(String photoId = null) {
		String url = GlobalVariable.API_BASE_URL + '/api/events'
		if (photoId) {
			url += '?photoId=' + photoId
		}

		RequestObject request = new RequestObject('GetEvents')
		request.setRestUrl(url)
		request.setRestRequestMethod('GET')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json'],
			['name': 'Authorization', 'value': 'Bearer ' + (authToken ?: '')]
		])

		return WS.sendRequest(request)
	}

	/**
	 * Check API health
	 * @return ResponseObject API health response
	 */
	@Keyword
	def healthCheck() {
		RequestObject request = new RequestObject('HealthCheck')
		request.setRestUrl(GlobalVariable.API_BASE_URL + '/actuator/health')
		request.setRestRequestMethod('GET')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json']
		])

		return WS.sendRequest(request)
	}

	/**
	 * Analyze photo with AI service
	 * @param photoId UUID of the photo to analyze
	 * @return ResponseObject AI service response
	 */
	@Keyword
	def analyzePhoto(String photoId) {
		RequestObject request = new RequestObject('AnalyzePhoto')
		request.setRestUrl(GlobalVariable.AI_SERVICE_URL + '/ai/analyze-and-apply')
		request.setRestRequestMethod('POST')
		request.setHttpHeaderProperties([
			['name': 'Content-Type', 'value': 'application/json']
		])
		request.setHttpBody(JsonOutput.toJson(['photoId': photoId]))

		return WS.sendRequest(request)
	}

	/**
	 * Set authentication token for API calls
	 * @param token JWT token
	 */
	@Keyword
	def setAuthToken(String token) {
		this.authToken = token
	}

	/**
	 * Parse JSON response body
	 * @param response ResponseObject to parse
	 * @return Parsed JSON object
	 */
	@Keyword
	def parseResponse(ResponseObject response) {
		return jsonSlurper.parseText(response.getResponseText())
	}

	/**
	 * Verify response status code
	 * @param response ResponseObject to check
	 * @param expectedStatusCode Expected HTTP status code
	 * @return boolean True if status matches
	 */
	@Keyword
	def verifyStatusCode(ResponseObject response, int expectedStatusCode) {
		return WS.verifyResponseStatusCode(response, expectedStatusCode)
	}
}
