/**
 * Sample script for PC browser extension to export data
 * This is an example of how the browser extension should format data for import into the Android app
 */

// Sample data structure that matches the Android app's import format
const browserExtensionData = {
  "userInfo": {
    "gender": "female",
    "age": "18-24",
    "education": "Master's Degree",
    "occupation": "Student",
    "browsingFrequency": "weekly",
    "createdAt": "2023-05-15T08:30:00Z",
    "updatedAt": "2023-06-10T14:22:00Z"
  },
  "contentAccessRecords": [
    {
      "id": "pc-record-001",
      "url": "https://news-website.com",
      "timestamp": "2023-06-01T09:15:00Z",
      "contentType": "safe",
      "keywordsDetected": []
    },
    {
      "id": "pc-record-002",
      "url": "https://social-media.com",
      "timestamp": "2023-06-01T14:30:00Z",
      "contentType": "blocked",
      "keywordsDetected": ["social", "entertainment"]
    },
    {
      "id": "pc-record-003",
      "url": "https://educational-site.com",
      "timestamp": "2023-06-02T10:45:00Z",
      "contentType": "safe",
      "keywordsDetected": []
    }
  ],
  "statistics": {
    "totalBlocked": 12,
    "totalWarnings": 5,
    "totalBypassed": 2,
    "totalSafe": 187,
    "dailyAccess": {
      "2023-06-01": 25,
      "2023-06-02": 32,
      "2023-06-03": 18
    },
    "hourlyDistribution": {
      "8": 5,
      "9": 12,
      "10": 18,
      "14": 8,
      "15": 6,
      "19": 13,
      "20": 9
    },
    "contentTypeDistribution": {
      "safe": 187,
      "blocked": 12,
      "warning_bypassed": 2
    },
    "dailyDomainAccess": {
      "2023-06-01": {
        "news-website.com": 3,
        "social-media.com": 8,
        "work-site.com": 14
      },
      "2023-06-02": {
        "educational-site.com": 5,
        "news-website.com": 7,
        "reference-site.com": 3,
        "social-media.com": 17
      }
    },
    "weeklyAccessPattern": {
      "1": 25, // Monday
      "2": 32, // Tuesday
      "3": 18, // Wednesday
      "4": 22, // Thursday
      "5": 35, // Friday
      "6": 41, // Saturday
      "0": 19  // Sunday
    }
  },
  "articleNotifications": [
    {
      "id": "article-001",
      "title": "Digital Wellness Tips",
      "content": "Learn how to maintain a healthy balance between online and offline activities for better mental health and productivity.",
      "category": "anti_addiction",
      "timestamp": "2023-05-20T11:00:00Z",
      "read": true
    }
  ],
  "timestamp": "2023-06-10T16:45:00Z",
  "version": "1.0.0"
};

// Function to export data as JSON file (for browser extension)
function exportDataToFile(data, filename) {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  // Create download link
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

// Example usage in browser extension:
// exportDataToFile(browserExtensionData, 'content-security-data.json');

console.log("Browser extension data export structure ready");
console.log("To export data, call: exportDataToFile(browserExtensionData, 'content-security-data.json')");

// Validation function to ensure data matches expected format
function validateData(data) {
  const requiredFields = ['timestamp', 'version'];
  const optionalFields = ['userInfo', 'contentAccessRecords', 'statistics', 'articleNotifications'];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!data.hasOwnProperty(field)) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }
  
  // Check optional fields if they exist
  if (data.userInfo && typeof data.userInfo !== 'object') {
    console.error('userInfo must be an object');
    return false;
  }
  
  if (data.contentAccessRecords && !Array.isArray(data.contentAccessRecords)) {
    console.error('contentAccessRecords must be an array');
    return false;
  }
  
  if (data.statistics && typeof data.statistics !== 'object') {
    console.error('statistics must be an object');
    return false;
  }
  
  if (data.articleNotifications && !Array.isArray(data.articleNotifications)) {
    console.error('articleNotifications must be an array');
    return false;
  }
  
  console.log('Data validation passed');
  return true;
}

// Validate the sample data
validateData(browserExtensionData);