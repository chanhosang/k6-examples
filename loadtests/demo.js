// To demonstrate how to re-use modules and implementing a random pause to simulate user think-time
// k6 run demo.js --out influxdb=http://localhost:8086/k6;

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from "k6/metrics";
import { generateIdentifier, getRandomIntInclusive, buildQuery } from './helpers.js';

export let errorRate = new Rate("errors");

export let options = {
    stages: [
        { duration: '10s', target: 5 }, // simulate ramp-up of traffic from 1 to 5 users over 10 seconds
        { duration: '30s', target: 10 }, // further ramp-up to 10 users over 30 seconds
        { duration: '1m', target: 10 }, // stay at 10 users for 1 minute
        { duration: '30s', target: 0 }, // ramp-down to 0 user over 30 seconds
    ],
    thresholds: {
        http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
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
