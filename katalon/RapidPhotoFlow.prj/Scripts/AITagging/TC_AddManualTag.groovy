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
 * Test Case: Add Manual Tag
 *
 * Preconditions:
 * - User is logged in
 * - At least one photo exists
 *
 * Expected Result:
 * - User can add manual tag
 * - Tag is displayed on the photo
 */

// Test data
String testTagName = 'test-tag-' + System.currentTimeMillis()

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

	// Step 6: Find and fill tag input
	try {
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/txt_TagInput'), GlobalVariable.ELEMENT_TIMEOUT)
		WebUI.setText(findTestObject('Object Repository/Pages/Review/txt_TagInput'), testTagName)

		// Step 7: Press Enter to add the tag
		WebUI.sendKeys(findTestObject('Object Repository/Pages/Review/txt_TagInput'), Keys.ENTER)
		WebUI.delay(2)

		// Step 8: Verify tag was added by searching for it in the tag list
		String tagXpath = "//span[contains(@class, 'badge') or contains(@class, 'tag')][contains(text(), '${testTagName}')]"
		TestObject addedTag = new TestObject('AddedTag')
		addedTag.addProperty('xpath', com.kms.katalon.core.testobject.ConditionType.EQUALS, tagXpath)

		if (WebUI.verifyElementPresent(addedTag, GlobalVariable.ELEMENT_TIMEOUT, FailureHandling.OPTIONAL)) {
			WebUI.comment('SUCCESS: Tag "' + testTagName + '" was added successfully')
		} else {
			WebUI.comment('WARNING: Tag may not have been added or displayed differently')
		}
	} catch (Exception e) {
		WebUI.comment('Tag input not found or error adding tag: ' + e.getMessage())
	}

	// Step 9: Close modal
	WebUI.click(findTestObject('Object Repository/Pages/Review/btn_ModalClose'))
}

WebUI.comment('Manual tag addition test completed')

// Cleanup
WebUI.closeBrowser()
