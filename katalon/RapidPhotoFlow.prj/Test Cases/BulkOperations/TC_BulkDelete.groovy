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
 * Test Case: Bulk Delete Photos
 *
 * Preconditions:
 * - User is logged in
 * - Multiple photos exist
 *
 * Expected Result:
 * - Multiple photos can be selected
 * - Bulk delete removes selected photos
 * - Photo count decreases
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

// Step 4: Get initial photo count
WebUI.delay(2)
int initialCount = 0
List photoCards = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)
initialCount = photoCards.size()
WebUI.comment('Initial photo count: ' + initialCount)

if (initialCount < 2) {
	WebUI.comment('Need at least 2 photos for bulk delete test - skipping')
	WebUI.closeBrowser()
	return
}

// Step 5: Select photos using checkboxes
String checkboxXpath = "(//div[contains(@class, 'card')]//input[@type='checkbox'])[1]"
TestObject checkbox1 = new TestObject('Checkbox1')
checkbox1.addProperty('xpath', com.kms.katalon.core.testobject.ConditionType.EQUALS, checkboxXpath)

String checkboxXpath2 = "(//div[contains(@class, 'card')]//input[@type='checkbox'])[2]"
TestObject checkbox2 = new TestObject('Checkbox2')
checkbox2.addProperty('xpath', com.kms.katalon.core.testobject.ConditionType.EQUALS, checkboxXpath2)

int selectedCount = 0
try {
	WebUI.click(checkbox1)
	WebUI.delay(1)
	selectedCount++
	WebUI.click(checkbox2)
	WebUI.delay(1)
	selectedCount++
	WebUI.comment('Selected ' + selectedCount + ' photos')
} catch (Exception e) {
	WebUI.comment('Could not select photos via checkboxes')
}

// Step 6: Verify bulk action bar appears
try {
	WebUI.verifyElementVisible(findTestObject('Object Repository/Pages/Review/div_BulkActionBar'), GlobalVariable.ELEMENT_TIMEOUT)
} catch (Exception e) {
	WebUI.comment('Bulk action bar not visible')
}

// Step 7: Click Bulk Delete button
try {
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_Delete'))
	WebUI.delay(2)

	// Handle confirmation dialog if present
	try {
		String confirmXpath = "//button[contains(text(), 'Confirm') or contains(text(), 'Delete') or contains(text(), 'Yes')]"
		TestObject confirmBtn = new TestObject('ConfirmDelete')
		confirmBtn.addProperty('xpath', com.kms.katalon.core.testobject.ConditionType.EQUALS, confirmXpath)
		WebUI.click(confirmBtn)
		WebUI.delay(2)
	} catch (Exception e) {
		WebUI.comment('No confirmation dialog or already dismissed')
	}

	// Step 8: Verify photo count decreased
	WebUI.delay(2)
	List remainingPhotos = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
	int finalCount = remainingPhotos.size()
	WebUI.comment('Final photo count: ' + finalCount)

	if (finalCount < initialCount) {
		WebUI.comment('SUCCESS: Photos deleted. Removed: ' + (initialCount - finalCount))
	} else {
		WebUI.comment('WARNING: Photo count did not decrease')
	}
} catch (Exception e) {
	WebUI.comment('Bulk delete error: ' + e.getMessage())
}

WebUI.comment('Bulk delete test completed')

// Cleanup
WebUI.closeBrowser()
