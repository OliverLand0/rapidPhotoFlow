# RapidPhotoFlow Katalon Test Automation Suite

This directory contains the Katalon Studio test automation project for the RapidPhotoFlow photo management application.

## Project Structure

```
katalon/
└── RapidPhotoFlow.prj/
    ├── Object Repository/          # Test objects (web elements)
    │   ├── Pages/
    │   │   ├── Login/              # Login page objects
    │   │   ├── Signup/             # Signup page objects
    │   │   ├── Upload/             # Upload page objects
    │   │   ├── Review/             # Review page objects
    │   │   ├── Profile/            # Profile page objects
    │   │   └── Common/             # Common/shared objects
    │   └── API/                    # API request objects
    ├── Test Cases/                 # Test case scripts
    │   ├── Authentication/         # Login, logout, signup tests
    │   ├── Upload/                 # Photo upload tests
    │   ├── AITagging/              # AI auto-tagging tests
    │   ├── Review/                 # Photo review workflow tests
    │   ├── BulkOperations/         # Bulk action tests
    │   ├── API/                    # Backend API tests
    │   └── E2E/                    # End-to-end flow tests
    ├── Test Suites/                # Test suite definitions
    ├── Keywords/                   # Custom keywords (reusable functions)
    ├── Profiles/                   # Execution profiles (environments)
    ├── Data Files/                 # Test data files
    └── Reports/                    # Test execution reports
```

## Prerequisites

1. **Katalon Studio Enterprise** (version 8.0+)
2. **Chrome/Firefox/Edge** browser installed
3. **RapidPhotoFlow** application running locally or on staging

## Setup

1. Open Katalon Studio
2. Open the project: `File > Open Project > Select katalon/RapidPhotoFlow.prj`
3. Update test data in `Profiles/default.glbl`:
   - `BASE_URL`: Frontend application URL
   - `API_BASE_URL`: Backend API URL
   - `AI_SERVICE_URL`: AI service URL
   - `TEST_USER_EMAIL`: Test user credentials
   - `TEST_USER_PASSWORD`: Test user password

## Test Suites

| Suite | Description | Duration |
|-------|-------------|----------|
| `TS_Smoke` | Quick verification of core functionality | ~5 min |
| `TS_Authentication` | Login, logout, signup tests | ~10 min |
| `TS_Upload` | Photo upload functionality | ~15 min |
| `TS_AITagging` | AI auto-tagging and manual tagging | ~20 min |
| `TS_Review` | Photo review and approval workflow | ~15 min |
| `TS_BulkOperations` | Bulk approve, reject, delete, tag | ~15 min |
| `TS_API` | Backend API endpoint tests | ~5 min |
| `TS_Regression` | Full regression test suite | ~60 min |

## Running Tests

### From Katalon Studio

1. Open Test Suite in Test Suites folder
2. Click **Run** button or press `Ctrl+Shift+A`
3. Select browser and execution mode

### From Command Line (Katalon Runtime Engine)

```bash
# Run smoke tests
./katalonc -noSplash -runMode=console \
  -projectPath="/path/to/katalon/RapidPhotoFlow.prj" \
  -testSuitePath="Test Suites/TS_Smoke" \
  -executionProfile="default" \
  -browserType="Chrome"

# Run regression suite on staging
./katalonc -noSplash -runMode=console \
  -projectPath="/path/to/katalon/RapidPhotoFlow.prj" \
  -testSuitePath="Test Suites/TS_Regression" \
  -executionProfile="staging" \
  -browserType="Chrome (headless)"
```

## Custom Keywords

Reusable keywords are available in `Keywords/com/rapidphotoflow/keywords/`:

- **AuthKeywords**: Login, logout, signup operations
- **PhotoKeywords**: Upload, navigate, select photos
- **ReviewKeywords**: Filter, search, approve, reject, tag operations
- **ApiKeywords**: API request helpers

### Usage in Test Cases

```groovy
import com.rapidphotoflow.keywords.AuthKeywords
import com.rapidphotoflow.keywords.PhotoKeywords

AuthKeywords authKeywords = new AuthKeywords()
PhotoKeywords photoKeywords = new PhotoKeywords()

// Login and upload a photo
authKeywords.login(GlobalVariable.TEST_USER_EMAIL, GlobalVariable.TEST_USER_PASSWORD)
photoKeywords.uploadPhoto('/path/to/test-image.jpg')
```

## Test Data

Place test images in `Data Files/TestImages/`:
- `test_photo.jpg` - Single photo upload test
- `test_photo_1.jpg`, `test_photo_2.jpg`, `test_photo_3.jpg` - Multiple upload test

## Execution Profiles

| Profile | Environment | Description |
|---------|-------------|-------------|
| `default` | Local Development | localhost URLs, test credentials |
| `staging` | Staging Environment | staging URLs, test credentials |

## Test Case Naming Convention

- `TC_<Feature>_<Scenario>` for test cases
- Example: `TC_Login_ValidCredentials`, `TC_Upload_WithAutoTag`

## Tags

Test cases and suites are tagged for filtering:
- `smoke` - Smoke tests
- `authentication` - Auth-related tests
- `upload` - Upload functionality
- `ai`, `tagging` - AI tagging tests
- `review`, `workflow` - Review workflow
- `bulk` - Bulk operations
- `api` - API tests

## Reports

Test reports are generated in `Reports/` directory after each execution:
- HTML report with screenshots
- JUnit XML format for CI integration
- Video recording (if enabled)

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Katalon Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Katalon Tests
        uses: katalon-studio/katalon-studio-github-action@v2
        with:
          projectPath: 'katalon/RapidPhotoFlow.prj'
          testSuitePath: 'Test Suites/TS_Smoke'
          profile: 'default'
```

## Troubleshooting

### Common Issues

1. **Element not found**: Update selectors in Object Repository if UI changed
2. **Timeout errors**: Increase `ELEMENT_TIMEOUT` in profile
3. **Login failures**: Verify test user credentials in profile
4. **AI tagging slow**: AI service may need more processing time

### Debug Mode

Enable debug mode in Katalon Studio:
1. Set breakpoints in test scripts
2. Run with `Debug` instead of `Run`
3. Step through test execution

## Contributing

1. Create test cases following naming conventions
2. Add to appropriate test suite
3. Update Object Repository if new UI elements
4. Test locally before committing
