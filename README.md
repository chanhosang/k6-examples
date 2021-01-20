# k6-examples

## Prerequisites

* [k6](https://k6.io/docs/getting-started/installation), an open-source load testing tool for testing the performance of APIs, microservices, and websites.
    ```
    $ k6 version
    k6 v0.29.0 (2020-11-11T13:27:19+0000/d9bced3, go1.15.3, windows/amd64)
    ```
* [InfluxDB + Grafana](https://k6.io/docs/results-visualization/influxdb-+-grafana), for visualization of your k6 metrics.

## How to Run?

To run a demo test:
```
k6 run loadtests/demo.js
```
Or, you can specify the virtual users and iterations:
```
k6 run loadtests/demo.js -u 1 -i 1
```

**NOTE**

Good visualization of a load test results in important for performance analysis that help us to truly understand the underlying issues.

In order to upload the test result metrics to InfluxDB + Grafana in real-time, just add the following extra arguments to the command:
```
--out influxdb=http://localhost:8086/k6
```

For more info, refer to:

https://k6.io/blog/k6-loves-grafana

https://medium.com/swlh/beautiful-load-testing-with-k6-and-docker-compose-4454edb3a2e3

## To generate HTML report

You can use [k6-html-report](https://www.npmjs.com/package/k6-html-reporter?activeTab=readme) npm package to convert summary output to HTML report.

First, make sure you export the end-of-test summary report to a JSON file. For example,
```
k6 run loadtests/demo.js --summary-export=summary-export.json
```
Then, install the npm package and run the utility script:
```
npm install
node generate-html-report summary-export.json
```
The HTML report will be generated in 'html-report' folder.

## Good References

If you want to know more about K6, check out the following links:

* [k6io/awesome-k6](https://github.com/k6io/awesome-k6)

* [Lowering Performance Testing Barriers Using k6 with Robin Gustafsson](https://testguild.com/podcast/automation/211-performance-testing-k6-robin-gustafsson/)

* [Shifting Performance Testing to the left with k6](https://www.mariedrake.com/post/shifting-performance-testing-to-the-left-with-k6)

* [5 Things that Are Easier in k6 Than in JMeter](https://dzone.com/articles/5-things-that-are-easier-to-do-in-k6-than-in-jmete)
