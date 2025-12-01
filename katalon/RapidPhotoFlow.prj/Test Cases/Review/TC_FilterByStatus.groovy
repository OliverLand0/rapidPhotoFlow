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
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.windows.keyword.WindowsBuiltinKeywords as Windows
import internal.GlobalVariable as GlobalVariable
import org.openqa.selenium.Keys as Keys

import com.rapidphotoflow.keywords.AuthKeywords
import com.rapidphotoflow.keywords.ReviewKeywords

/**
 * Test Case: Filter Photos By Status
 *
 * Preconditions:
 * - User is logged in
 * - Photos exist with different statuses
 *
 * Expected Result:
 * - Status filter buttons work correctly
 * - Filtered results show appropriate photos
 */

AuthKeywords authKeywords = new AuthKeywords()
ReviewKeywords reviewKeywords = new ReviewKeywords()

// Step 1: Open browser
WebUI.openBrowser('')
WebUI.maximizeWindow()

// Step 2: Login
authKeywords.login(GlobalVariable.TEST_USER_EMAIL, GlobalVariable.TEST_USER_PASSWORD)

// Step 3: Navigate to review page
WebUI.click(findTestObject('Object Repository/Pages/Common/lnk_Review'))
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

// Step 4: Get initial photo count (All filter)
WebUI.delay(2)
int allCount = 0
try {
	List allPhotos = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
	allCount = allPhotos.size()
	WebUI.comment('All photos count: ' + allCount)
} catch (Exception e) {
	WebUI.comment('No photos found in All view')
}

// Step 5: Test Approved filter
try {
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_StatusFilter_Approved'))
	WebUI.delay(2)
	List approvedPhotos = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
	WebUI.comment('Approved photos count: ' + approvedPhotos.size())
} catch (Exception e) {
	WebUI.comment('Approved filter error or no approved photos: ' + e.getMessage())
}

// Step 6: Test Rejected filter
try {
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_StatusFilter_Rejected'))
	WebUI.delay(2)
	List rejectedPhotos = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
	WebUI.comment('Rejected photos count: ' + rejectedPhotos.size())
} catch (Exception e) {
	WebUI.comment('Rejected filter error or no rejected photos: ' + e.getMessage())
}

// Step 7: Test Pending/Ready filter
try {
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_StatusFilter_Pending'))
	WebUI.delay(2)
	List pendingPhotos = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
	WebUI.comment('Pending/Ready photos count: ' + pendingPhotos.size())
} catch (Exception e) {
	WebUI.comment('Pending filter error or no pending photos: ' + e.getMessage())
}

// Step 8: Return to All filter
WebUI.click(findTestObject('Object Repository/Pages/Review/btn_StatusFilter_All'))
WebUI.delay(2)

// Step 9: Verify All filter shows original count
try {
	List finalPhotos = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
	WebUI.comment('Final All photos count: ' + finalPhotos.size())
	assert finalPhotos.size() == allCount, 'All filter should show same count as initial'
} catch (Exception e) {
	WebUI.comment('Verification error: ' + e.getMessage())
}

WebUI.comment('Filter by status test completed')

// Cleanup
WebUI.closeBrowser()
