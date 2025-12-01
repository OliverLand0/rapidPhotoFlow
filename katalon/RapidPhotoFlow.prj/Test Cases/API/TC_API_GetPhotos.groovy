import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import static com.kms.katalon.core.testobject.ObjectRepository.findWindowsObject
import com.kms.katalon.core.checkpoint.Checkpoint as Checkpoint
import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.mobile.keyword.MobileBuiltInKeywords as Mobile
import com.kms.katalon.core.model.FailureHandling as FailureHandling
import com.kms.katalon.core.testcase.TestCase as TestCase
import com.kms.katalon.core.testdata.TestData as TestData
import com.kms.katalon.core.testng.keyword.TestNGBuiltinKeywords as TestNGKW
import com.kms.katalon.core.testobject.TestObject as TestObject
import com.kms.katalon.core.testobject.RequestObject as RequestObject
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.windows.keyword.WindowsBuiltinKeywords as Windows
import internal.GlobalVariable as GlobalVariable

import groovy.json.JsonSlurper

/**
 * Test Case: API - Get Photos
 *
 * Endpoint: GET /api/photos
 *
 * Expected Result:
 * - 200 OK response
 * - JSON array of photos
 */

// Step 1: Create request object
RequestObject getPhotosRequest = new RequestObject('GetPhotos')
getPhotosRequest.setRestUrl(GlobalVariable.API_BASE_URL + '/api/photos')
getPhotosRequest.setRestRequestMethod('GET')
getPhotosRequest.setHttpHeaderProperties([
	['name': 'Content-Type', 'value': 'application/json'],
	['name': 'Accept', 'value': 'application/json']
])

// Step 2: Send request
def response = WS.sendRequest(getPhotosRequest)

// Step 3: Verify status code is 200
WS.verifyResponseStatusCode(response, 200)
WS.comment('GET /api/photos returned 200 OK')

// Step 4: Verify response is JSON
def contentType = response.getHeaderFields().get('Content-Type')
assert contentType.toString().contains('application/json'), 'Response should be JSON'

// Step 5: Parse response body
JsonSlurper slurper = new JsonSlurper()
def photos = slurper.parseText(response.getResponseText())

// Step 6: Verify response is an array
assert photos instanceof List, 'Response should be an array'
WS.comment('Response contains ' + photos.size() + ' photos')

// Step 7: If photos exist, verify structure
if (photos.size() > 0) {
	def firstPhoto = photos[0]
	assert firstPhoto.id != null, 'Photo should have id'
	assert firstPhoto.filename != null, 'Photo should have filename'
	assert firstPhoto.status != null, 'Photo should have status'
	WS.comment('Photo structure validated: id=' + firstPhoto.id + ', filename=' + firstPhoto.filename + ', status=' + firstPhoto.status)
}

WS.comment('API Get Photos test completed successfully')
