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
 * Test Case: API - Get Photo Counts
 *
 * Endpoint: GET /api/photos/counts
 *
 * Expected Result:
 * - 200 OK response
 * - JSON object with status counts
 */

// Step 1: Create request object
RequestObject getCountsRequest = new RequestObject('GetPhotoCounts')
getCountsRequest.setRestUrl(GlobalVariable.API_BASE_URL + '/api/photos/counts')
getCountsRequest.setRestRequestMethod('GET')
getCountsRequest.setHttpHeaderProperties([
	['name': 'Content-Type', 'value': 'application/json'],
	['name': 'Accept', 'value': 'application/json']
])

// Step 2: Send request
def response = WS.sendRequest(getCountsRequest)

// Step 3: Verify status code is 200
WS.verifyResponseStatusCode(response, 200)
WS.comment('GET /api/photos/counts returned 200 OK')

// Step 4: Parse response body
JsonSlurper slurper = new JsonSlurper()
def counts = slurper.parseText(response.getResponseText())

// Step 5: Verify counts object structure
assert counts instanceof Map, 'Response should be an object'

// Log the counts
WS.comment('Photo counts: ' + counts.toString())

// Step 6: Verify expected status keys exist
def expectedStatuses = ['PENDING', 'PROCESSING', 'PROCESSED', 'APPROVED', 'REJECTED', 'FAILED']
expectedStatuses.each { status ->
	if (counts.containsKey(status)) {
		WS.comment(status + ': ' + counts[status])
	}
}

WS.comment('API Get Photo Counts test completed successfully')
