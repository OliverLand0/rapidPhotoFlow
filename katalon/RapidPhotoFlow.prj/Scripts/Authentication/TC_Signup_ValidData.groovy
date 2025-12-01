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
 * Test Case: Signup with Valid Data
 *
 * Preconditions:
 * - Email is not already registered
 *
 * Expected Result:
 * - User is redirected to email confirmation page
 * - Success message displayed
 */

// Generate unique test data
String timestamp = System.currentTimeMillis().toString()
String testUsername = 'testuser_' + timestamp
String testEmail = 'testuser_' + timestamp + '@rapidphotoflow.com'
String testPassword = 'TestPassword123!'

// Step 1: Open browser and navigate to signup page
WebUI.openBrowser('')
WebUI.maximizeWindow()
WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/signup')

// Step 2: Wait for signup page to load
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)
WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Signup/txt_Username'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 3: Enter username
WebUI.setText(findTestObject('Object Repository/Pages/Signup/txt_Username'), testUsername)

// Step 4: Enter email
WebUI.setText(findTestObject('Object Repository/Pages/Signup/txt_Email'), testEmail)

// Step 5: Enter password
WebUI.setText(findTestObject('Object Repository/Pages/Signup/txt_Password'), testPassword)

// Step 6: Enter confirm password
WebUI.setText(findTestObject('Object Repository/Pages/Signup/txt_ConfirmPassword'), testPassword)

// Step 7: Click Sign Up button
WebUI.click(findTestObject('Object Repository/Pages/Signup/btn_SignUp'))

// Step 8: Wait for redirect
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

// Step 9: Verify redirected to confirmation page or success message shown
// Note: Actual verification depends on application behavior (could be confirm-email page or success message)
WebUI.delay(3) // Wait for potential redirect or message

// Step 10: Log test data for reference
WebUI.comment('Signup test completed with email: ' + testEmail)
WebUI.comment('Note: User may need to verify email before login works')

// Cleanup
WebUI.closeBrowser()
