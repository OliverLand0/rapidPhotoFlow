<?xml version="1.0" encoding="UTF-8"?>
<TestSuiteEntity>
   <description>Full regression test suite covering all functionality</description>
   <name>TS_Regression</name>
   <tag>regression,full</tag>
   <isRerun>false</isRerun>
   <mailRecipient></mailRecipient>
   <numberOfRerun>0</numberOfRerun>
   <pageLoadTimeout>30</pageLoadTimeout>
   <pageLoadTimeoutDefault>true</pageLoadTimeoutDefault>
   <rerunFailedTestCasesOnly>false</rerunFailedTestCasesOnly>
   <rerunImmediately>false</rerunImmediately>
   <testSuiteGuid>ts-regression-001</testSuiteGuid>
   <!-- API Tests -->
   <testCaseLink>
      <guid>tc-api-health-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/API/TC_API_HealthCheck</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-api-get-photos-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/API/TC_API_GetPhotos</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-api-get-counts-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/API/TC_API_GetPhotoCounts</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-api-get-events-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/API/TC_API_GetEvents</testCaseId>
   </testCaseLink>
   <!-- Authentication Tests -->
   <testCaseLink>
      <guid>tc-login-valid-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Authentication/TC_Login_ValidCredentials</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-login-invalid-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Authentication/TC_Login_InvalidCredentials</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-logout-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Authentication/TC_Logout</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-signup-valid-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Authentication/TC_Signup_ValidData</testCaseId>
   </testCaseLink>
   <!-- Upload Tests -->
   <testCaseLink>
      <guid>tc-upload-single-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Upload/TC_Upload_SinglePhoto</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-upload-multi-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Upload/TC_Upload_MultiplePhotos</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-upload-autotag-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Upload/TC_Upload_WithAutoTag</testCaseId>
   </testCaseLink>
   <!-- Tagging Tests -->
   <testCaseLink>
      <guid>tc-autotag-manual-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/AITagging/TC_ManualAutoTag</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-tag-manual-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/AITagging/TC_AddManualTag</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-tag-remove-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/AITagging/TC_RemoveTag</testCaseId>
   </testCaseLink>
   <!-- Review Tests -->
   <testCaseLink>
      <guid>tc-review-filter-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Review/TC_FilterByStatus</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-review-search-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Review/TC_SearchPhotos</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-review-approve-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Review/TC_ApprovePhoto</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-review-reject-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Review/TC_RejectPhoto</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-review-preview-nav-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Review/TC_PhotoPreviewNavigation</testCaseId>
   </testCaseLink>
   <!-- Bulk Operations Tests -->
   <testCaseLink>
      <guid>tc-bulk-approve-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/BulkOperations/TC_BulkApprove</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-bulk-delete-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/BulkOperations/TC_BulkDelete</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-bulk-autotag-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/BulkOperations/TC_BulkAutoTag</testCaseId>
   </testCaseLink>
</TestSuiteEntity>
