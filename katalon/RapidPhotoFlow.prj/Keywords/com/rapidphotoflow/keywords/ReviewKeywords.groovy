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
 * Custom keywords for photo review operations
 */
public class ReviewKeywords {

	/**
	 * Filter photos by status
	 * @param status Status to filter by: 'all', 'pending', 'approved', 'rejected', 'failed'
	 */
	@Keyword
	def filterByStatus(String status) {
		TestObject filterButton
		switch(status.toLowerCase()) {
			case 'all':
				filterButton = findTestObject('Object Repository/Pages/Review/btn_StatusFilter_All')
				break
			case 'pending':
			case 'ready':
				filterButton = findTestObject('Object Repository/Pages/Review/btn_StatusFilter_Pending')
				break
			case 'approved':
				filterButton = findTestObject('Object Repository/Pages/Review/btn_StatusFilter_Approved')
				break
			case 'rejected':
				filterButton = findTestObject('Object Repository/Pages/Review/btn_StatusFilter_Rejected')
				break
			default:
				filterButton = findTestObject('Object Repository/Pages/Review/btn_StatusFilter_All')
		}

		WebUI.click(filterButton)
		WebUI.delay(1) // Wait for filter to apply
	}

	/**
	 * Search for photos by filename or text
	 * @param searchText Text to search for
	 */
	@Keyword
	def searchPhotos(String searchText) {
		WebUI.setText(findTestObject('Object Repository/Pages/Review/txt_SearchInput'), searchText)
		WebUI.sendKeys(findTestObject('Object Repository/Pages/Review/txt_SearchInput'), '\n')
		WebUI.delay(1) // Wait for search results
	}

	/**
	 * Clear search input
	 */
	@Keyword
	def clearSearch() {
		WebUI.clearText(findTestObject('Object Repository/Pages/Review/txt_SearchInput'))
		WebUI.delay(1)
	}

	/**
	 * Approve a photo (assumes photo is selected or in preview)
	 */
	@Keyword
	def approvePhoto() {
		WebUI.click(findTestObject('Object Repository/Pages/Review/btn_Approve'))
		WebUI.delay(1)
	}

	/**
	 * Reject a photo (assumes photo is selected or in preview)
	 */
	@Keyword
	def rejectPhoto() {
		WebUI.click(findTestObject('Object Repository/Pages/Review/btn_Reject'))
		WebUI.delay(1)
	}

	/**
	 * Delete a photo (assumes photo is selected or in preview)
	 */
	@Keyword
	def deletePhoto() {
		WebUI.click(findTestObject('Object Repository/Pages/Review/btn_Delete'))
		// Confirm deletion if dialog appears
		try {
			WebUI.click(findTestObject('Object Repository/Pages/Common/btn_ConfirmDialog'), FailureHandling.OPTIONAL)
		} catch (Exception e) {
			// No confirmation dialog
		}
		WebUI.delay(1)
	}

	/**
	 * Trigger auto-tagging for selected photo
	 */
	@Keyword
	def autoTagPhoto() {
		WebUI.click(findTestObject('Object Repository/Pages/Review/btn_AutoTag'))
		// Wait for tagging to complete (may take time due to AI processing)
		WebUI.delay(5)
	}

	/**
	 * Add a tag to the current photo
	 * @param tagName Name of the tag to add
	 */
	@Keyword
	def addTag(String tagName) {
		WebUI.setText(findTestObject('Object Repository/Pages/Review/txt_TagInput'), tagName)
		WebUI.sendKeys(findTestObject('Object Repository/Pages/Review/txt_TagInput'), '\n')
		WebUI.delay(1)
	}

	/**
	 * Remove a tag by clicking its remove button
	 * @param tagName Name of the tag to remove
	 */
	@Keyword
	def removeTag(String tagName) {
		// Find tag element and click its remove button
		String xpath = "//span[contains(@class, 'badge') or contains(@class, 'tag')][contains(text(), '${tagName}')]//button"
		TestObject tagRemoveBtn = new TestObject('Dynamic Tag Remove')
		tagRemoveBtn.addProperty('xpath', com.kms.katalon.core.testobject.ConditionType.EQUALS, xpath)

		WebUI.click(tagRemoveBtn)
		WebUI.delay(1)
	}

	/**
	 * Get all tags for current photo
	 * @return List of tag names
	 */
	@Keyword
	def getTags() {
		List<String> tags = []
		try {
			List elements = WebUI.findWebElements(findTestObject('Object Repository/Pages/Review/span_Tag'), GlobalVariable.ELEMENT_TIMEOUT)
			elements.each { element ->
				tags.add(element.getText())
			}
		} catch (Exception e) {
			// No tags found
		}
		return tags
	}

	/**
	 * Select all photos in the grid
	 */
	@Keyword
	def selectAllPhotos() {
		WebUI.click(findTestObject('Object Repository/Pages/Review/chk_SelectAll'))
		WebUI.delay(1)
	}

	/**
	 * Perform bulk approve on selected photos
	 */
	@Keyword
	def bulkApprove() {
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/div_BulkActionBar'), GlobalVariable.ELEMENT_TIMEOUT)
		approvePhoto()
	}

	/**
	 * Perform bulk reject on selected photos
	 */
	@Keyword
	def bulkReject() {
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/div_BulkActionBar'), GlobalVariable.ELEMENT_TIMEOUT)
		rejectPhoto()
	}

	/**
	 * Perform bulk delete on selected photos
	 */
	@Keyword
	def bulkDelete() {
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/div_BulkActionBar'), GlobalVariable.ELEMENT_TIMEOUT)
		deletePhoto()
	}

	/**
	 * Perform bulk auto-tag on selected photos
	 */
	@Keyword
	def bulkAutoTag() {
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pages/Review/div_BulkActionBar'), GlobalVariable.ELEMENT_TIMEOUT)
		autoTagPhoto()
	}

	/**
	 * Navigate to next photo in preview modal using keyboard
	 */
	@Keyword
	def navigateToNextPhoto() {
		WebUI.sendKeys(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), '\ue014') // Right arrow
		WebUI.delay(1)
	}

	/**
	 * Navigate to previous photo in preview modal using keyboard
	 */
	@Keyword
	def navigateToPreviousPhoto() {
		WebUI.sendKeys(findTestObject('Object Repository/Pages/Review/div_PreviewModal'), '\ue012') // Left arrow
		WebUI.delay(1)
	}

	/**
	 * Verify photo has specific status badge
	 * @param expectedStatus Expected status text
	 * @return boolean True if status matches
	 */
	@Keyword
	def verifyPhotoStatus(String expectedStatus) {
		String xpath = "//span[contains(@class, 'badge') or contains(@class, 'status')][contains(text(), '${expectedStatus}')]"
		TestObject statusBadge = new TestObject('Dynamic Status Badge')
		statusBadge.addProperty('xpath', com.kms.katalon.core.testobject.ConditionType.EQUALS, xpath)

		return WebUI.verifyElementPresent(statusBadge, GlobalVariable.ELEMENT_TIMEOUT, FailureHandling.OPTIONAL)
	}
}
