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
 * Test Case: API - Health Check
 *
 * Endpoint: GET /actuator/health
 *
 * Expected Result:
 * - 200 OK response
 * - Status is UP
 */

// Step 1: Create request object
RequestObject healthRequest = new RequestObject('HealthCheck')
healthRequest.setRestUrl(GlobalVariable.API_BASE_URL + '/actuator/health')
healthRequest.setRestRequestMethod('GET')
healthRequest.setHttpHeaderProperties([
	['name': 'Content-Type', 'value': 'application/json'],
	['name': 'Accept', 'value': 'application/json']
])

// Step 2: Send request
def response = WS.sendRequest(healthRequest)

// Step 3: Verify status code is 200
WS.verifyResponseStatusCode(response, 200)
WS.comment('GET /actuator/health returned 200 OK')

// Step 4: Parse response body
JsonSlurper slurper = new JsonSlurper()
def health = slurper.parseText(response.getResponseText())

// Step 5: Verify status is UP
assert health.status == 'UP', 'Health status should be UP'
WS.comment('Health status: ' + health.status)

// Step 6: Log additional health details if available
if (health.components) {
	WS.comment('Health components:')
	health.components.each { name, details ->
		WS.comment('  ' + name + ': ' + details.status)
	}
}

WS.comment('API Health Check test completed successfully')
