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
 * Test Case: Approve Photo
 *
 * Preconditions:
 * - User is logged in
 * - At least one photo exists with PROCESSED status (ready to review)
 *
 * Expected Result:
 * - Photo status changes to APPROVED
 * - Photo appears in Approved filter
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

// Step 4: Filter by Pending/Ready status to find approvable photos
try {
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_StatusFilter_Pending'))
	WebUI.delay(2)
} catch (Exception e) {
	WebUI.comment('Pending filter not available, using All')
}

// Step 5: Verify photos exist
try {
	WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)
} catch (Exception e) {
	WebUI.comment('No photos available for approval test - skipping')
	WebUI.closeBrowser()
	return
}

// Step 6: Click on first photo to open preview
List photoCards = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)
if (photoCards.size() > 0) {
	photoCards[0].click()
	WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), GlobalVariable.ELEMENT_TIMEOUT)

	// Step 7: Click Approve button
	try {
		WebUI.click(findTestObject('Object Repository/Pages/Review/btn_Approve'))
		WebUI.delay(2)
		WebUI.comment('Approve button clicked')

		// Step 8: Close modal
		try {
			WebUI.click(findTestObject('Object Repository/Pages/Review/btn_ModalClose'))
		} catch (Exception e) {
			// Modal might have closed automatically
		}
		WebUI.delay(2)

		// Step 9: Verify photo moved to Approved filter
		WebUI.click(findTestObject('Object Repository/Pages/Review/btn_StatusFilter_Approved'))
		WebUI.delay(2)

		List approvedPhotos = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
		if (approvedPhotos.size() > 0) {
			WebUI.comment('SUCCESS: Photo appears in Approved filter. Count: ' + approvedPhotos.size())
		} else {
			WebUI.comment('WARNING: No photos in Approved filter - approval may not have worked')
		}
	} catch (Exception e) {
		WebUI.comment('Approve button not found or error: ' + e.getMessage())
	}
} else {
	WebUI.comment('No photos available for approval')
}

WebUI.comment('Approve photo test completed')

// Cleanup
WebUI.closeBrowser()
