package com.rapidphotoflow.keywords

import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import static com.kms.katalon.core.testobject.ObjectRepository.findWindowsObject

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.checkpoint.Checkpoint
import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.mobile.keyword.MobileBuiltInKeywords as Mobile
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testcase.TestCase
import com.kms.katalon.core.testdata.TestData
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.configuration.RunConfiguration

import internal.GlobalVariable

/**
 * Custom keywords for authentication operations
 */
public class AuthKeywords {

	/**
	 * Login to the application with provided credentials
	 * @param email User email
	 * @param password User password
	 */
	@Keyword
	def login(String email, String password) {
		WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')
		WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

		WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Login/txt_Email'), GlobalVariable.ELEMENT_TIMEOUT)
		WebUI.setText(findTestObject('Object Repository/Pages/Login/txt_Email'), email)
		WebUI.setText(findTestObject('Object Repository/Pages/Login/txt_Password'), password)
		WebUI.click(findTestObject('Object Repository/Pages/Login/btn_SignIn'))

		// Wait for successful redirect to home page
		WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)
	}

	/**
	 * Login with default test user credentials from GlobalVariables
	 */
	@Keyword
	def loginWithDefaultUser() {
		login(GlobalVariable.TEST_USER_EMAIL, GlobalVariable.TEST_USER_PASSWORD)
	}

	/**
	 * Sign up a new user
	 * @param username Username for the new account
	 * @param email Email for the new account
	 * @param password Password for the new account
	 */
	@Keyword
	def signup(String username, String email, String password) {
		WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/signup')
		WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

		WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Signup/txt_Username'), GlobalVariable.ELEMENT_TIMEOUT)
		WebUI.setText(findTestObject('Object Repository/Pages/Signup/txt_Username'), username)
		WebUI.setText(findTestObject('Object Repository/Pages/Signup/txt_Email'), email)
		WebUI.setText(findTestObject('Object Repository/Pages/Signup/txt_Password'), password)
		WebUI.setText(findTestObject('Object Repository/Pages/Signup/txt_ConfirmPassword'), password)
		WebUI.click(findTestObject('Object Repository/Pages/Signup/btn_SignUp'))

		WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)
	}

	/**
	 * Logout from the application
	 */
	@Keyword
	def logout() {
		WebUI.click(findTestObject('Object Repository/Pages/Common/btn_Logout'))
		WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)

		// Verify redirected to login page
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Login/txt_Email'), GlobalVariable.ELEMENT_TIMEOUT)
	}

	/**
	 * Verify user is logged in by checking for protected page elements
	 * @return boolean True if user is logged in
	 */
	@Keyword
	def isLoggedIn() {
		try {
			return WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Common/btn_Logout'), GlobalVariable.ELEMENT_TIMEOUT, FailureHandling.OPTIONAL)
		} catch (Exception e) {
			return false
		}
	}

	/**
	 * Verify user is on the login page
	 * @return boolean True if on login page
	 */
	@Keyword
	def isOnLoginPage() {
		try {
			return WebUI.verifyElementPresent(findTestObject('Object Repository/Pages/Login/btn_SignIn'), GlobalVariable.ELEMENT_TIMEOUT, FailureHandling.OPTIONAL)
		} catch (Exception e) {
			return false
		}
	}

	/**
	 * Navigate to forgot password page
	 */
	@Keyword
	def navigateToForgotPassword() {
		WebUI.navigateToUrl(GlobalVariable.BASE_URL + '/login')
		WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)
		WebUI.click(findTestObject('Object Repository/Pages/Login/lnk_ForgotPassword'))
		WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)
	}
}
