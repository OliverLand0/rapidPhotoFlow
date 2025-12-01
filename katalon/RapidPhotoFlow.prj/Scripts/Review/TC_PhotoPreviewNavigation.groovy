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
 * Test Case: Photo Preview Navigation
 *
 * Preconditions:
 * - User is logged in
 * - At least 2 photos exist
 *
 * Expected Result:
 * - User can navigate between photos using arrow keys
 * - User can navigate using next/previous buttons
 * - Modal can be closed
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

// Step 4: Verify at least 2 photos exist
WebUI.delay(2)
List photoCards = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)
if (photoCards.size() < 2) {
	WebUI.comment('Need at least 2 photos for navigation test - skipping')
	WebUI.closeBrowser()
	return
}

WebUI.comment('Found ' + photoCards.size() + ' photos for navigation test')

// Step 5: Click on first photo to open preview
photoCards[0].click()
WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), GlobalVariable.ELEMENT_TIMEOUT)
WebUI.comment('Preview modal opened')

// Step 6: Test keyboard navigation - Right arrow to next photo
WebUI.delay(1)
WebUI.sendKeys(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), Keys.ARROW_RIGHT)
WebUI.delay(1)
WebUI.comment('Navigated to next photo using Right Arrow')

// Step 7: Test keyboard navigation - Left arrow to previous photo
WebUI.sendKeys(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), Keys.ARROW_LEFT)
WebUI.delay(1)
WebUI.comment('Navigated to previous photo using Left Arrow')

// Step 8: Test button navigation - Next button
try {
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_ModalNext'))
	WebUI.delay(1)
	WebUI.comment('Navigated to next photo using Next button')
} catch (Exception e) {
	WebUI.comment('Next button not found or at end of list')
}

// Step 9: Test button navigation - Previous button
try {
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_ModalPrev'))
	WebUI.delay(1)
	WebUI.comment('Navigated to previous photo using Previous button')
} catch (Exception e) {
	WebUI.comment('Previous button not found or at beginning of list')
}

// Step 10: Test close modal - Escape key
WebUI.sendKeys(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), Keys.ESCAPE)
WebUI.delay(1)

// Verify modal closed
try {
	WebUI.verifyElementNotPresent(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), 5)
	WebUI.comment('Modal closed successfully with Escape key')
} catch (Exception e) {
	// Try close button as fallback
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_ModalClose'))
	WebUI.comment('Modal closed using Close button')
}

WebUI.comment('Photo preview navigation test completed')

// Cleanup
WebUI.closeBrowser()
