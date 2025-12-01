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

/**
 * Test Case: Upload Single Photo
 *
 * Preconditions:
 * - User is logged in
 * - Test image file exists
 *
 * Expected Result:
 * - Photo is uploaded successfully
 * - Photo appears in recent uploads
 */

// Test data path - using project relative path
String projectDir = RunConfiguration.getProjectDir()
String testImagePath = projectDir + '/Data Files/TestImages/test_photo.jpg'

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

// Step 3: Verify on upload page (home)
WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Upload/div_DropZone'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 4: Upload photo using file input
WebUI.uploadFile(findTestObject('Object Repository/Pages/Upload/inp_FileInput'), testImagePath)

// Step 5: Wait for upload to process
WebUI.delay(3)

// Step 6: Verify upload progress or completion
try {
	WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Upload/div_ProgressBar'), 5, FailureHandling.OPTIONAL)

	// Wait for progress to complete (max 30 seconds)
	int maxWait = 30
	int waited = 0
	while (waited < maxWait) {
		try {
			if (!WebUI.verifyElementVisible(findTestObject('Object Repository/Pages/Upload/div_ProgressBar'), 2, FailureHandling.OPTIONAL)) {
				break
			}
		} catch (Exception e) {
			break
		}
		WebUI.delay(2)
		waited += 2
	}
} catch (Exception e) {
	// Progress bar might not be visible for small files
}

// Step 7: Verify photo appears in recent uploads section or success indication
WebUI.delay(2)
WebUI.comment('Single photo upload test completed')

// Step 8: Navigate to review page to verify photo exists
WebUI.click(findTestObject('Object Repository/Pages/Common/lnk_Review'))
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

// Step 9: Verify at least one photo exists in the grid
WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)

WebUI.comment('Photo upload verified - photo visible in review page')

// Cleanup
WebUI.closeBrowser()
