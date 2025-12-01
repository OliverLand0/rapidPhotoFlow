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
 * Test Case: Login with Invalid Credentials
 *
 * Preconditions:
 * - None
 *
 * Expected Result:
 * - User sees error message
 * - User remains on login page
 */

// Step 1: Open browser and navigate to login page
WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')

// Step 2: Wait for login page to load
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)
WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Login/txt_Email'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 3: Enter invalid email
WebUI.setText(findTestObject('Object Repository/Pages/Login/txt_Email'), 'invalid@email.com')

// Step 4: Enter invalid password
WebUI.setText(findTestObject('Object Repository/Pages/Login/txt_Password'), 'wrongpassword123')

// Step 5: Click Sign In button
WebUI.click(findTestObject('Object Repository/Pages/Login/btn_SignIn'))

// Step 6: Wait for error message
WebUI.delay(2)

// Step 7: Verify error message is displayed
WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Login/msg_Error'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 8: Verify we are still on login page (Sign In button visible)
WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Login/btn_SignIn'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 9: Log result
WebUI.comment('Login with invalid credentials correctly shows error message')

// Cleanup
WebUI.closeBrowser()
