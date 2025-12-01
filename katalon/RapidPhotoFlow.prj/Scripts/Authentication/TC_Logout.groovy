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

import com.rapidphotoflow.keywords.AuthKeywords

/**
 * Test Case: User Logout
 *
 * Preconditions:
 * - User is logged in
 *
 * Expected Result:
 * - User is logged out
 * - Redirected to login page
 */

AuthKeywords authKeywords = new AuthKeywords()

// Step 1: Open browser and login
WebUI.openBrowser('')
WebUI.maximizeWindow()

// Step 2: Login with default user
authKeywords.login(GlobalVariable.TEST_USER_EMAIL, GlobalVariable.TEST_USER_PASSWORD)

// Step 3: Verify logged in
WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Common/btn_Logout'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 4: Click logout button
WebUI.click(findTestObject('Object Repository/Pages/Common/btn_Logout'))

// Step 5: Wait for page to load
WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

// Step 6: Verify redirected to login page
WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Login/btn_SignIn'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 7: Verify logout button is no longer visible
WebUI.verifyElementNotPresent(findTestObject('Object Repository/Pages/Common/btn_Logout'), GlobalVariable.ELEMENT_TIMEOUT)

// Step 8: Log result
WebUI.comment('Logout successful - user redirected to login page')

// Cleanup
WebUI.closeBrowser()
