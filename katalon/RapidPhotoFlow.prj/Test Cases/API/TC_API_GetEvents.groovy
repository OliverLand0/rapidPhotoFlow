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
 * Test Case: API - Get Events
 *
 * Endpoint: GET /api/events
 *
 * Expected Result:
 * - 200 OK response
 * - JSON array of events
 */

// Step 1: Create request object
RequestObject getEventsRequest = new RequestObject('GetEvents')
getEventsRequest.setRestUrl(GlobalVariable.API_BASE_URL + '/api/events')
getEventsRequest.setRestRequestMethod('GET')
getEventsRequest.setHttpHeaderProperties([
	['name': 'Content-Type', 'value': 'application/json'],
	['name': 'Accept', 'value': 'application/json']
])

// Step 2: Send request
def response = WS.sendRequest(getEventsRequest)

// Step 3: Verify status code is 200
WS.verifyResponseStatusCode(response, 200)
WS.comment('GET /api/events returned 200 OK')

// Step 4: Parse response body
JsonSlurper slurper = new JsonSlurper()
def events = slurper.parseText(response.getResponseText())

// Step 5: Verify response is an array
assert events instanceof List, 'Response should be an array'
WS.comment('Response contains ' + events.size() + ' events')

// Step 6: If events exist, verify structure
if (events.size() > 0) {
	def firstEvent = events[0]
	assert firstEvent.id != null, 'Event should have id'
	assert firstEvent.type != null, 'Event should have type'
	assert firstEvent.timestamp != null, 'Event should have timestamp'
	WS.comment('Event structure validated: id=' + firstEvent.id + ', type=' + firstEvent.type)

	// Log event types found
	def eventTypes = events.collect { it.type }.unique()
	WS.comment('Event types found: ' + eventTypes.join(', '))
}

WS.comment('API Get Events test completed successfully')
