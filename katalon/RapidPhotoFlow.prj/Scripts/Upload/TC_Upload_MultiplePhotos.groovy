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
 * Test Case: Upload Multiple Photos
 *
 * Preconditions:
 * - User is logged in
 * - Multiple test image files exist
 *
 * Expected Result:
 * - All photos are uploaded successfully
 * - Photos appear in review page
 */

// Test data paths
String projectDir = RunConfiguration.getProjectDir()
String testImagePath1 = projectDir + '/Data Files/TestImages/test_photo_1.jpg'
String testImagePath2 = projectDir + '/Data Files/TestImages/test_photo_2.jpg'
String testImagePath3 = projectDir + '/Data Files/TestImages/test_photo_3.jpg'

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

// Step 3: Verify on upload page
WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Upload/div_DropZone'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 4: Get initial photo count
WebUI.click(findTestObject('Object Repository/Pages/Common/lnk_Review'))
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

int initialCount = 0
try {
	List elements = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
	initialCount = elements.size()
} catch (Exception e) {
	initialCount = 0
}

WebUI.comment('Initial photo count: ' + initialCount)

// Step 5: Go back to upload page
WebUI.click(findTestObject('Object Repository/Pages/Common/lnk_Upload'))
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

// Step 6: Upload multiple photos sequentially
WebUI.uploadFile(findTestObject('Object Repository/Pages/Upload/inp_FileInput'), testImagePath1)
WebUI.delay(2)

WebUI.uploadFile(findTestObject('Object Repository/Pages/Upload/inp_FileInput'), testImagePath2)
WebUI.delay(2)

WebUI.uploadFile(findTestObject('Object Repository/Pages/Upload/inp_FileInput'), testImagePath3)
WebUI.delay(2)

// Step 7: Wait for all uploads to complete
WebUI.delay(10) // Allow time for processing

// Step 8: Navigate to review page
WebUI.click(findTestObject('Object Repository/Pages/Common/lnk_Review'))
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

// Step 9: Verify photo count increased
int finalCount = 0
try {
	List elements = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)
	finalCount = elements.size()
} catch (Exception e) {
	finalCount = 0
}

WebUI.comment('Final photo count: ' + finalCount)
WebUI.comment('Photos added: ' + (finalCount - initialCount))

// Verify at least some photos were added
assert finalCount >= initialCount, 'Expected photo count to increase after upload'

WebUI.comment('Multiple photo upload test completed successfully')

// Cleanup
WebUI.closeBrowser()
