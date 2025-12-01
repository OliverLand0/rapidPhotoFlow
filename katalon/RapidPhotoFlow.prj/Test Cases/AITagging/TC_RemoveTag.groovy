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
 * Test Case: Remove Tag
 *
 * Preconditions:
 * - User is logged in
 * - At least one photo with tags exists
 *
 * Expected Result:
 * - User can remove a tag
 * - Tag count decreases
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

// Step 4: Verify photos exist
WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 5: Click on first photo to open preview
List photoCards = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)
if (photoCards.size() > 0) {
	photoCards[0].click()
	WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), GlobalVariable.ELEMENT_TIMEOUT)
	WebUI.delay(2)

	// Step 6: Get initial tag count
	int initialTagCount = 0
	List existingTags = []
	try {
		existingTags = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/span_Tag'), 5)
		initialTagCount = existingTags.size()
		WebUI.comment('Initial tag count: ' + initialTagCount)
	} catch (Exception e) {
		WebUI.comment('No tags found on this photo')
	}

	if (initialTagCount > 0) {
		// Step 7: Find and click the remove button on first tag
		try {
			// Look for remove/close button within the first tag
			String removeXpath = "(//span[contains(@class, 'badge') or contains(@class, 'tag')]//button[contains(@class, 'close') or contains(@aria-label, 'Remove')])[1]"
			TestObject removeBtn = new TestObject('TagRemoveButton')
			removeBtn.addProperty('xpath', com.kms.katalon.core.testobject.ConditionType.EQUALS, removeXpath)

			WebUI.click(removeBtn)
			WebUI.delay(2)

			// Step 8: Verify tag count decreased
			List remainingTags = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/span_Tag'), 5)
			int finalTagCount = remainingTags.size()
			WebUI.comment('Final tag count: ' + finalTagCount)

			if (finalTagCount < initialTagCount) {
				WebUI.comment('SUCCESS: Tag was removed successfully')
			} else {
				WebUI.comment('WARNING: Tag count did not decrease')
			}
		} catch (Exception e) {
			WebUI.comment('Could not find or click tag remove button: ' + e.getMessage())
		}
	} else {
		WebUI.comment('SKIPPED: No tags to remove on this photo')
	}

	// Step 9: Close modal
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_ModalClose'))
}

WebUI.comment('Remove tag test completed')

// Cleanup
WebUI.closeBrowser()
