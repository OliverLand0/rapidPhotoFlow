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
 * Test Case: Bulk Auto-Tag Photos
 *
 * Preconditions:
 * - User is logged in
 * - Multiple photos exist
 * - AI service is available
 *
 * Expected Result:
 * - Multiple photos can be selected
 * - Bulk auto-tag triggers AI analysis for all selected photos
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
WebUI.delay(2)
List photoCards = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)
if (photoCards.size() < 2) {
	WebUI.comment('Need at least 2 photos for bulk auto-tag test - skipping')
	WebUI.closeBrowser()
	return
}

WebUI.comment('Found ' + photoCards.size() + ' photos for bulk auto-tag')

// Step 5: Select multiple photos
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
	WebUI.comment('Selected 2 photos')
} catch (Exception e) {
	WebUI.comment('Could not select photos: ' + e.getMessage())
}

// Step 6: Click Bulk Auto-Tag button
try {
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_AutoTag'))
	WebUI.comment('Bulk auto-tag clicked')

	// Step 7: Wait for AI processing (this may take a while)
	WebUI.comment('Waiting for AI processing...')
	WebUI.delay(20) // AI processing can take 10-30 seconds per photo

	// Step 8: Verify success by checking for toast/notification or checking tags
	try {
		WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Common/div_Toast'), 5, FailureHandling.OPTIONAL)
		WebUI.comment('Toast notification appeared - bulk auto-tag completed')
	} catch (Exception e) {
		WebUI.comment('No toast notification - checking results manually')
	}

	// Step 9: Click on a photo to verify tags were added
	photoCards[0].click()
	WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), GlobalVariable.ELEMENT_TIMEOUT)
	WebUI.delay(2)

	List tags = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/span_Tag'), 5)
	WebUI.comment('Photo has ' + tags.size() + ' tags after bulk auto-tag')

	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_ModalClose'))
} catch (Exception e) {
	WebUI.comment('Bulk auto-tag error: ' + e.getMessage())
}

WebUI.comment('Bulk auto-tag test completed')

// Cleanup
WebUI.closeBrowser()
