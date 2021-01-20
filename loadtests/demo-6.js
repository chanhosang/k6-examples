// Demonstrate on how to add value to error rate for failed requests

// To visualise the errors in Grafana + InfluxDB, you may use the dashboard from
// https://grafana.com/grafana/dashboards/13719

// k6 run demo-6.js --out influxdb=http://localhost:8086/k6;

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from "k6/metrics";

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

    let result, response;
    let authHeaders;

    const BASE_URL = 'https://test-api.k6.io';
    const PAUSE_TIME = 1;

    const USERNAME = 'TestUser';
    const PASSWORD = 'SuperCroc2020';

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
    });

    group("02. Navigate to Home Page", function() {

        response = http.get(`${BASE_URL}/my/crocodiles/`,
        Object.assign(authHeaders, {tags: { name: 'GET /my/crocodiles' }}));

        result = check(response, {
            'GET /my/crocodiles/ is 200': (r) => r.status == 200,
            'retrieved crocodiles': (r) => r.json().length > 0
        });

        errorRate.add(!result);

        sleep(PAUSE_TIME);
    });

    group("03. Navigate to Invalid Page", function() {

        response = http.get(`${BASE_URL}/my/crocodiles/a`,
        Object.assign(authHeaders, {tags: { name: 'GET /my/crocodiles/{id}' }}));

        result = check(response, {
            'GET /my/crocodiles/{id} is 404': (r) => r.status == 404
        });

        errorRate.add(!result);

        sleep(PAUSE_TIME);

        response = http.get(`${BASE_URL}/my/crocodiles/b`,
        Object.assign(authHeaders, {tags: { name: 'GET /my/crocodiles/{id}' }}));

        result = check(response, {
            'GET /my/crocodiles/{id} is 404': (r) => r.status == 404
        });

        sleep(PAUSE_TIME);

    });
};
