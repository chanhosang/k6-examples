// Using https://www.npmjs.com/package/k6-html-reporter?activeTab=readme
// May be will be replaced by https://github.com/benc-uk/k6-reporter

// Usage: generate-html-report <relative path of summary-export file>

const reporter = require('k6-html-reporter');
const fs = require('fs');
const path = require('path');

// Get the *.json summary export from CLI. Default to summary-export.json in current directory.
var jsonOutput = process.argv.slice(2);
jsonOutput = (jsonOutput == null || jsonOutput.length === 0) ? 'summary-export.json' : jsonOutput;
console.log('jsonFile='+jsonOutput);

// Create a folder to store HTML report
fs.mkdir(path.join(__dirname, 'html-report'), (err) => {
    if (err) {
        return console.log('Directory already exists!');
    }
    console.log('Directory created successfully!');
});

// Generate HTML report
const options = {
        jsonFile: `./${jsonOutput}`,
        output: "html-report",
    };

reporter.generateSummaryReport(options);
