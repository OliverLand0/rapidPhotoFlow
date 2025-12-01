<?xml version="1.0" encoding="UTF-8"?>
<TestSuiteEntity>
   <description>Smoke test suite for quick verification of core functionality</description>
   <name>TS_Smoke</name>
   <tag>smoke,quick</tag>
   <isRerun>false</isRerun>
   <mailRecipient></mailRecipient>
   <numberOfRerun>0</numberOfRerun>
   <pageLoadTimeout>30</pageLoadTimeout>
   <pageLoadTimeoutDefault>true</pageLoadTimeoutDefault>
   <rerunFailedTestCasesOnly>false</rerunFailedTestCasesOnly>
   <rerunImmediately>false</rerunImmediately>
   <testSuiteGuid>ts-smoke-001</testSuiteGuid>
   <testCaseLink>
      <guid>tc-api-health-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/API/TC_API_HealthCheck</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-login-valid-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Authentication/TC_Login_ValidCredentials</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-logout-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Authentication/TC_Logout</testCaseId>
   </testCaseLink>
   <testCaseLink>
      <guid>tc-upload-single-001</guid>
      <isReuseDriver>false</isReuseDriver>
      <isRun>true</isRun>
      <testCaseId>Test Cases/Upload/TC_Upload_SinglePhoto</testCaseId>
   </testCaseLink>
</TestSuiteEntity>
