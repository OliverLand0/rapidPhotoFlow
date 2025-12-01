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
 * Test Case: Login with Valid Credentials
 *
 * Preconditions:
 * - User account exists with TEST_USER_EMAIL and TEST_USER_PASSWORD
 *
 * Expected Result:
 * - User successfully logs in
 * - Redirected to Upload page (home)
 * - Logout button is visible
 */

// Step 1: Open browser and navigate to login page
WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

// Step 2: Wait for login page to load
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)
WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Login/txt_Email'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 3: Enter valid email
WebUI.setText(findTestObject('Object Repository/Pages/Login/txt_Email'), GlobalVariable.TEST_USER_EMAIL)

// Step 4: Enter valid password
WebUI.setText(findTestObject('Object Repository/Pages/Login/txt_Password'), GlobalVariable.TEST_USER_PASSWORD)

// Step 5: Click Sign In button
WebUI.click(findTestObject('Object Repository/Pages/Login/btn_SignIn'))

// Step 6: Wait for redirect to home page
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

// Step 7: Verify successful login - logout button should be visible
WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Common/btn_Logout'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 8: Verify we are on the upload page (home)
WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Upload/div_DropZone'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 9: Log result
WebUI.comment('Login with valid credentials successful')

// Cleanup
WebUI.closeBrowser()
