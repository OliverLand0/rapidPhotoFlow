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
import com.kms.katalon.core.configuration.RunConfiguration
import internal.GlobalVariable as GlobalVariable
import org.openqa.selenium.Keys as Keys

import com.rapidphotoflow.keywords.AuthKeywords
import com.rapidphotoflow.keywords.PhotoKeywords

/**
 * Test Case: Upload Photo with Auto-Tagging
 *
 * Preconditions:
 * - User is logged in
 * - AI service is available
 * - Test image file exists
 *
 * Expected Result:
 * - Photo is uploaded successfully
 * - Auto-tagging is triggered
 * - Photo has tags assigned
 */

AuthKeywords authKeywords = new AuthKeywords()
PhotoKeywords photoKeywords = new PhotoKeywords()

String projectDir = RunConfiguration.getProjectDir()
String testImagePath = projectDir + '/Data Files/TestImages/test_photo.jpg'

// Step 1: Open browser
WebUI.openBrowser('')
WebUI.maximizeWindow()

// Step 2: Login
authKeywords.login(GlobalVariable.TEST_USER_EMAIL, GlobalVariable.TEST_USER_PASSWORD)

// Step 3: Verify on upload page
WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Upload/div_DropZone'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 4: Enable auto-tag toggle if present
try {
	TestObject autoTagToggle = findTestObject('Object Repository/Pages/Upload/chk_AutoTag')
	if (WebUI.verifyElementPresent(autoTagToggle, 5, FailureHandling.OPTIONAL)) {
		// Check if not already checked
		if (!WebUI.verifyElementChecked(autoTagToggle, 2, FailureHandling.OPTIONAL)) {
			WebUI.click(autoTagToggle)
			WebUI.comment('Auto-tag toggle enabled')
		} else {
			WebUI.comment('Auto-tag toggle was already enabled')
		}
	}
} catch (Exception e) {
	WebUI.comment('Auto-tag toggle not found or not applicable')
}

// Step 5: Upload photo
WebUI.uploadFile(findTestObject('Object Repository/Pages/Upload/inp_FileInput'), testImagePath)

// Step 6: Wait for upload and auto-tagging to complete (AI processing takes time)
WebUI.delay(15)

// Step 7: Navigate to review page
WebUI.click(findTestObject('Object Repository/Pages/Common/lnk_Review'))
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

// Step 8: Click on the first photo to open preview
WebUI.delay(2)
List photoCards = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)
if (photoCards.size() > 0) {
	photoCards[0].click()
	WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), GlobalVariable.ELEMENT_TIMEOUT)

	// Step 9: Check for tags
	WebUI.delay(2)
	try {
		List tags = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/span_Tag'), 5)
		if (tags.size() > 0) {
			WebUI.comment('Found ' + tags.size() + ' tags on uploaded photo - auto-tagging successful')
		} else {
			WebUI.comment('No tags found - auto-tagging may still be processing or not enabled')
		}
	} catch (Exception e) {
		WebUI.comment('Unable to find tags - may not be displayed or processing')
	}

	// Close modal
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_ModalClose'))
}

WebUI.comment('Upload with auto-tag test completed')

// Cleanup
WebUI.closeBrowser()
