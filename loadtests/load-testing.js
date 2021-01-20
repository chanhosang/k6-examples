// To demonstrate a simlpe load test amd how to obtain environment variables from command line
// k6 run demo.js --out influxdb=http://localhost:8086/k6 -e RAMPUP_DURATION=30s -e STEADY_DURATION=1m;

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from "k6/metrics";
import { generateIdentifier, getRandomIntInclusive, buildQuery } from './helpers.js';

export let errorRate = new Rate("errors");

// Set the duration of rampup and steady state based on environment variable(s).
var durationRampup = `${__ENV.RAMPUP_DURATION}`;
durationRampup = (durationRampup === 'undefined') ? '20s' : durationRampup;

var durationSteady = `${__ENV.STEADY_DURATION}`;
durationSteady = (durationSteady === 'undefined') ? '1m' : durationSteady;

export let options = {
    stages: [
        { duration: durationRampup, target: 10 }, // further ramp-up to 10 users over 30 seconds
        { duration: durationSteady, target: 10 }, // stay at 10 users for 1 minute
        { duration: '30s', target: 0 }, // ramp-down to 0 user over 30 seconds
    ],
    thresholds: {
        http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
        'errors': [
            "rate<0.1", // more than 10% of errors will fail the test
            { threshold: 'rate < 0.5', abortOnFail: true, delayAbortEval: '1m' } // more than 50% of errors will abort the test
        ]
    },
};

export default () => {

    let urlQueryParams;
    let result, response;
    let authHeaders;

    // Static Variables
    const BASE_URL = 'https://test-api.k6.io';
    const PAUSE_TIME = 1; // constant pause time

    const USERNAME = 'TestUser';
    const PASSWORD = 'SuperCroc2020';

    // Dynamic Variables
    let identifier = generateIdentifier(1);
    let randomPauseTime = 0; // random pause time

    group("01. Login", function() {

        let loginRes = http.post(`${BASE_URL}/auth/token/login/`, {
            username: USERNAME,
            password: PASSWORD,
        },
        {tags: { name: 'POST /auth/token/login/' }});

        result = check(loginRes, {
            "POST /auth/token/login is 200": (r) => r.status === 200,
            'logged in successfully': (resp) => resp.json('access') !== '',
        });

        errorRate.add(!result);

        authHeaders = {
            headers: {Authorization: `Bearer ${loginRes.json('access')}`},
        };

        sleep(PAUSE_TIME);
        randomPauseTime = getRandomIntInclusive(1,5); sleep(randomPauseTime);
    });

    // -----------------------------------------
    group("02. Navigate to My Page", function() {

        response = http.get(`${BASE_URL}/my/crocodiles/`,
        Object.assign(authHeaders, {tags: { name: 'GET /my/crocodiles' }}));

        result = check(response, {
            'GET /my/crocodiles/ is 200': (r) => r.status == 200,
            'retrieved crocodiles': (r) => r.json().length > 0
        });

        errorRate.add(!result);

        sleep(PAUSE_TIME);
        randomPauseTime = getRandomIntInclusive(1,5); sleep(randomPauseTime);
    });

    // -----------------------------------------

    group("03. Navigate to Invalid Page", function() {

        response = http.get(`${BASE_URL}/my/crocodiles/${identifier}`,
        Object.assign(authHeaders, {tags: { name: 'GET /my/crocodiles/{id}' }}));

        result = check(response, {
            'GET /my/crocodiles/{id} is 404': (r) => r.status == 404
        });

        errorRate.add(!result);

        sleep(PAUSE_TIME);
        randomPauseTime = getRandomIntInclusive(1,5); sleep(randomPauseTime);

        console.log("response.request.url:"+response.request.url);

    });

    group("04. Navigate to My Page with Query Paramaters", function() {

        urlQueryParams = buildQuery({
            sex: "M",
            age: "2",
        });

        response = http.get(`${BASE_URL}/my/crocodiles?${urlQueryParams}`,
        Object.assign(authHeaders, {tags: { name: 'GET /my/crocodiles?sex={sex}&age={age}' }}));

        result = check(response, {
            'GET /my/crocodiles?sex={sex}&age={age} is 200': (r) => r.status == 200
        });

        errorRate.add(!result);

        sleep(PAUSE_TIME);
        randomPauseTime = getRandomIntInclusive(1,5); sleep(randomPauseTime);

        console.log("response.request.url:"+response.request.url);

    });
};
