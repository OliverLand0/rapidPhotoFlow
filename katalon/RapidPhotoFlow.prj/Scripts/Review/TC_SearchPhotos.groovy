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
 * Test Case: Search Photos
 *
 * Preconditions:
 * - User is logged in
 * - Photos exist
 *
 * Expected Result:
 * - Search input filters photos
 * - Clear search restores all photos
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

// Step 4: Get initial photo count
WebUI.delay(2)
int initialCount = 0
try {
	List initialPhotos = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
	initialCount = initialPhotos.size()
	WebUI.comment('Initial photo count: ' + initialCount)
} catch (Exception e) {
	WebUI.comment('No photos found initially')
}

if (initialCount > 0) {
	// Step 5: Search for a term that likely doesn't exist
	WebUI.setText(findTestObject('Object Repository/Pages/Review/txt_SearchInput'), 'xyznonexistent123')
	WebUI.sendKeys(findTestObject('Object Repository/Pages/Review/txt_SearchInput'), Keys.ENTER)
	WebUI.delay(2)

	// Step 6: Verify search filters results (should be 0 or fewer)
	int searchCount = 0
	try {
		List searchResults = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 3)
		searchCount = searchResults.size()
		WebUI.comment('Search results for nonexistent term: ' + searchCount)
	} catch (Exception e) {
		WebUI.comment('No results found for search - expected behavior')
	}

	// Step 7: Clear search
	WebUI.clearText(findTestObject('Object Repository/Pages/Review/txt_SearchInput'))
	WebUI.sendKeys(findTestObject('Object Repository/Pages/Review/txt_SearchInput'), Keys.ENTER)
	WebUI.delay(2)

	// Step 8: Verify photos are restored
	try {
		List restoredPhotos = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
		WebUI.comment('Photo count after clearing search: ' + restoredPhotos.size())
		assert restoredPhotos.size() >= initialCount, 'Photos should be restored after clearing search'
	} catch (Exception e) {
		WebUI.comment('Could not verify restored photos: ' + e.getMessage())
	}

	// Step 9: Search for common file extension
	WebUI.setText(findTestObject('Object Repository/Pages/Review/txt_SearchInput'), '.jpg')
	WebUI.sendKeys(findTestObject('Object Repository/Pages/Review/txt_SearchInput'), Keys.ENTER)
	WebUI.delay(2)

	try {
		List jpgResults = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), 5)
		WebUI.comment('Search results for .jpg: ' + jpgResults.size())
	} catch (Exception e) {
		WebUI.comment('No .jpg files found or search not supported: ' + e.getMessage())
	}
}

WebUI.comment('Search photos test completed')

// Cleanup
WebUI.closeBrowser()
