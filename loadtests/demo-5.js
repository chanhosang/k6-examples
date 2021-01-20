// Demonstrate on how to override the name tag for given requests.

// By default, k6 differentiates every unique endpoint name when tagging the metrics it records.
// In order look at the overall performance analysis, it would be better to override the name tag for a given requests
// based on preferable naming.

// k6 run demo-5.js --out influxdb=http://localhost:8086/k6;

import http from 'k6/http';
import { check, group, sleep } from 'k6';

const USERNAME = 'TestUser';
const PASSWORD = 'SuperCroc2020';

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

    let result, response;
    let authHeaders;

    group("01. Login", function() {

        let loginRes = http.post(`https://test-api.k6.io/auth/token/login/`, {
            username: USERNAME,
            password: PASSWORD,
        },
        {tags: { name: 'POST /auth/token/login/' }});

        result = check(loginRes, {
            "POST /auth/token/login is 200": (r) => r.status === 200,
            'logged in successfully': (resp) => resp.json('access') !== '',
        });


        authHeaders = {
            headers: {Authorization: `Bearer ${loginRes.json('access')}`},
        };

        sleep(1);
    });

    group("02. Navigate to Home Page", function() {

        response = http.get(`https://test-api.k6.io/my/crocodiles/`,
        Object.assign(authHeaders, {tags: { name: 'GET /my/crocodiles' }}));

        result = check(response, {
            'GET /my/crocodiles/ is 200': (r) => r.status == 200,
            'retrieved crocodiles': (r) => r.json().length > 0
        });

        sleep(1);
    });

    group("03. Navigate to Invalid Page", function() {

        response = http.get(`https://test-api.k6.io/my/crocodiles/a`,
        Object.assign(authHeaders, {tags: { name: 'GET /my/crocodiles/{id}' }}));

        result = check(response, {
            'GET /my/crocodiles/{id} is 404': (r) => r.status == 404
        });

        sleep(1);

        response = http.get(`https://test-api.k6.io/my/crocodiles/b`,
        Object.assign(authHeaders, {tags: { name: 'GET /my/crocodiles/{id}' }}));

        result = check(response, {
            'GET /my/crocodiles/{id} is 404': (r) => r.status == 404
        });

        sleep(1);

    });
};
