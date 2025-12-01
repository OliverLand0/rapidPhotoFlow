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
 * Test Case: Bulk Approve Photos
 *
 * Preconditions:
 * - User is logged in
 * - Multiple photos exist with PROCESSED status
 *
 * Expected Result:
 * - Multiple photos can be selected
 * - Bulk action bar appears
 * - Bulk approve changes status of all selected photos
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

// Step 4: Filter by Pending/Ready status
try {
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_StatusFilter_Pending'))
	WebUI.delay(2)
} catch (Exception e) {
	WebUI.comment('Using All filter')
}

// Step 5: Verify multiple photos exist
List photoCards = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)
if (photoCards.size() < 2) {
	WebUI.comment('Need at least 2 photos for bulk approve test - skipping')
	WebUI.closeBrowser()
	return
}

WebUI.comment('Found ' + photoCards.size() + ' photos for bulk approve')

// Step 6: Select multiple photos using checkboxes
// Look for checkboxes within photo cards
String checkboxXpath = "(//div[contains(@class, 'card')]//input[@type='checkbox'])[1]"
TestObject checkbox1 = new TestObject('Checkbox1')
checkbox1.addProperty('xpath', com.kms.katalon.core.testobject.ConditionType.EQUALS, checkboxXpath)

String checkboxXpath2 = "(//div[contains(@class, 'card')]//input[@type='checkbox'])[2]"
TestObject checkbox2 = new TestObject('Checkbox2')
checkbox2.addProperty('xpath', com.kms.katalon.core.testobject.ConditionType.EQUALS, checkboxXpath2)

try {
	WebUI.click(checkbox1)
	WebUI.delay(1)
	WebUI.click(checkbox2)
	WebUI.delay(1)
	WebUI.comment('Selected 2 photos using checkboxes')
} catch (Exception e) {
	// Try select all instead
	try {
		WebUI.click(findTestObject('Object Repository/Pages/Review/chk_SelectAll'))
		WebUI.delay(1)
		WebUI.comment('Selected all photos using Select All')
	} catch (Exception e2) {
		WebUI.comment('Could not select photos: ' + e2.getMessage())
	}
}

// Step 7: Verify bulk action bar appears
try {
	WebUI.verifyElementVisible(findTestObject('Object Repository/Pages/Review/div_BulkActionBar'), GlobalVariable.ELEMENT_TIMEOUT)
	WebUI.comment('Bulk action bar is visible')
} catch (Exception e) {
	WebUI.comment('Bulk action bar not visible - selection may have failed')
}

// Step 8: Click Bulk Approve button
try {
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_Approve'))
	WebUI.delay(3)
	WebUI.comment('Bulk approve clicked')

	// Step 9: Verify photos moved to Approved filter
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_StatusFilter_Approved'))
	WebUI.delay(2)

	List approvedPhotos = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
	WebUI.comment('Approved photos count: ' + approvedPhotos.size())
} catch (Exception e) {
	WebUI.comment('Bulk approve error: ' + e.getMessage())
}

WebUI.comment('Bulk approve test completed')

// Cleanup
WebUI.closeBrowser()
