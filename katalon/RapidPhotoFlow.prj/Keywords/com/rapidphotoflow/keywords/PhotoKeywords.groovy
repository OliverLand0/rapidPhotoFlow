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
 * Custom keywords for photo operations
 */
public class PhotoKeywords {

	/**
	 * Navigate to the Upload page
	 */
	@Keyword
	def navigateToUploadPage() {
		WebUI.click(findTestObject('Object Repository/Pages/Common/lnk_Upload'))
		WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Upload/div_DropZone'), GlobalVariable.ELEMENT_TIMEOUT)
	}

	/**
	 * Navigate to the Review page
	 */
	@Keyword
	def navigateToReviewPage() {
		WebUI.click(findTestObject('Object Repository/Pages/Common/lnk_Review'))
		WebUI.waitForPageLoad(GlobalVariable.PAGE_LOAD_TIMEOUT)
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/div_PhotoGrid'), GlobalVariable.ELEMENT_TIMEOUT)
	}

	/**
	 * Upload a single photo file
	 * @param filePath Absolute path to the image file
	 */
	@Keyword
	def uploadPhoto(String filePath) {
		navigateToUploadPage()

		// Upload via file input
		WebUI.uploadFile(findTestObject('Object Repository/Pages/Upload/inp_FileInput'), filePath)

		// Wait for upload to complete
		WebUI.delay(2) // Brief delay for upload to process

		// Click upload button if available
		try {
			WebUI.click(findTestObject('Object Repository/Pages/Upload/btn_Upload'), FailureHandling.OPTIONAL)
		} catch (Exception e) {
			// Auto-upload might be enabled
		}
	}

	/**
	 * Upload multiple photos
	 * @param filePaths List of absolute file paths
	 */
	@Keyword
	def uploadMultiplePhotos(List<String> filePaths) {
		navigateToUploadPage()

		filePaths.each { filePath ->
			WebUI.uploadFile(findTestObject('Object Repository/Pages/Upload/inp_FileInput'), filePath)
			WebUI.delay(1) // Brief delay between uploads
		}
	}

	/**
	 * Enable auto-tagging on upload
	 */
	@Keyword
	def enableAutoTagOnUpload() {
		try {
			TestObject autoTagToggle = findTestObject('Object Repository/Pages/Upload/chk_AutoTag')
			if (!WebUI.verifyElementChecked(autoTagToggle, GlobalVariable.ELEMENT_TIMEOUT, FailureHandling.OPTIONAL)) {
				WebUI.click(autoTagToggle)
			}
		} catch (Exception e) {
			WebUI.comment("Auto-tag toggle not found or already enabled")
		}
	}

	/**
	 * Disable auto-tagging on upload
	 */
	@Keyword
	def disableAutoTagOnUpload() {
		try {
			TestObject autoTagToggle = findTestObject('Object Repository/Pages/Upload/chk_AutoTag')
			if (WebUI.verifyElementChecked(autoTagToggle, GlobalVariable.ELEMENT_TIMEOUT, FailureHandling.OPTIONAL)) {
				WebUI.click(autoTagToggle)
			}
		} catch (Exception e) {
			WebUI.comment("Auto-tag toggle not found or already disabled")
		}
	}

	/**
	 * Wait for upload to complete
	 * @param timeout Maximum wait time in seconds
	 */
	@Keyword
	def waitForUploadComplete(int timeout = 60) {
		int elapsed = 0
		while (elapsed < timeout) {
			try {
				// Check if progress bar is no longer visible
				if (!WebUI.verifyElementVisible(findTestObject('Object Repository/Pages/Upload/div_ProgressBar'), 2, FailureHandling.OPTIONAL)) {
					return true
				}
			} catch (Exception e) {
				return true
			}
			WebUI.delay(2)
			elapsed += 2
		}
		return false
	}

	/**
	 * Get the count of photos in the grid
	 * @return int Number of photo cards visible
	 */
	@Keyword
	def getPhotoCount() {
		navigateToReviewPage()
		try {
			List elements = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)
			return elements.size()
		} catch (Exception e) {
			return 0
		}
	}

	/**
	 * Select a photo by index (0-based)
	 * @param index Index of the photo to select
	 */
	@Keyword
	def selectPhotoByIndex(int index) {
		navigateToReviewPage()

		// Find all photo cards
		List elements = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/div_PhotoCard'), GlobalVariable.ELEMENT_TIMEOUT)

		if (index < elements.size()) {
			elements[index].click()
		} else {
			throw new Exception("Photo index ${index} out of range. Only ${elements.size()} photos available.")
		}
	}

	/**
	 * Open photo preview modal for a photo by index
	 * @param index Index of the photo to preview
	 */
	@Keyword
	def openPhotoPreview(int index) {
		selectPhotoByIndex(index)
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), GlobalVariable.ELEMENT_TIMEOUT)
	}

	/**
	 * Close photo preview modal
	 */
	@Keyword
	def closePhotoPreview() {
		WebUI.click(findTestObject('Object Repository/Pages/Review/btn_ModalClose'))
		WebUI.waitForElementNotPresent(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), GlobalVariable.ELEMENT_TIMEOUT)
	}
}
