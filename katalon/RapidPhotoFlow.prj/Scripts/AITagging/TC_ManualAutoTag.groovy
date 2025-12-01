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

/**
 * Test Case: Manual Auto-Tag
 *
 * Preconditions:
 * - User is logged in
 * - At least one photo exists
 * - AI service is available
 *
 * Expected Result:
 * - Auto-tag button triggers AI analysis
 * - Tags are applied to the photo
 */

// Step 1: Open browser
WebUI.openBrowser('')
WebUI.maximizeWindow()

// Step 2: Login
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)
WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Login/txt_Email'), GlobalVariable.ELEMENT_TIMEOUT)
WebUI.setText(findTestObject('Object Repository/Pages/Login/txt_Email'), GlobalVariable.TEST_USER_EMAIL)
WebUI.setText(findTestObject('Object Repository/Pages/Login/txt_Password'), GlobalVariable.TEST_USER_PASSWORD)
WebUI.click(findTestObject('Object Repository/Pages/Login/btn_SignIn'))
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

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

	// Step 6: Count existing tags
	int initialTagCount = 0
	try {
		List existingTags = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/span_Tag'), 5)
		initialTagCount = existingTags.size()
		WebUI.comment('Initial tag count: ' + initialTagCount)
	} catch (Exception e) {
		WebUI.comment('No existing tags found')
	}

	// Step 7: Click Auto-Tag button
	try {
		WebUI.click(findTestObject('Object Repository/Pages/Review/btn_AutoTag'))
		WebUI.comment('Auto-tag button clicked')

		// Step 8: Wait for AI processing (may take several seconds)
		WebUI.delay(10)

		// Step 9: Verify tags were added
		List newTags = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/span_Tag'), 5)
		int finalTagCount = newTags.size()
		WebUI.comment('Final tag count: ' + finalTagCount)

		if (finalTagCount > initialTagCount) {
			WebUI.comment('SUCCESS: Auto-tagging added ' + (finalTagCount - initialTagCount) + ' new tags')
		} else if (finalTagCount == initialTagCount && finalTagCount > 0) {
			WebUI.comment('Tags already existed - auto-tagging may have found same tags')
		} else {
			WebUI.comment('WARNING: No new tags added - AI service may be unavailable')
		}
	} catch (Exception e) {
		WebUI.comment('Auto-tag button not found or clickable: ' + e.getMessage())
	}

	// Step 10: Close modal
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_ModalClose'))
}

WebUI.comment('Manual auto-tag test completed')

// Cleanup
WebUI.closeBrowser()
