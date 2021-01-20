// Demonstrate how to use 'check' to assert the http response.

// k6 run demo-2.js --out influxdb=http://localhost:8086/k6;
// k6 run demo-2.js --out influxdb=http://localhost:8086/k6 -u 10 -d 30s;
// k6 run demo-2.js --out influxdb=http://localhost:8086/k6 -u 5 -i 10;
import http from 'k6/http';
import { check, sleep } from 'k6';

const USERNAME = 'TestUser';
const PASSWORD = 'SuperCroc2020X';

export default () => {

    let result, response;

    let loginRes = http.post(`https://test-api.k6.io/auth/token/login/`, {
        username: USERNAME,
        password: PASSWORD,
    });

    result = check(loginRes, {
        "POST /auth/token/login is 200": (r) => r.status === 200,
        'logged in successfully': (resp) => resp.json('access') !== '',
    });


    let authHeaders = {
        headers: {Authorization: `Bearer ${loginRes.json('access')}`},
    };

    sleep(1);

    // -----------------------------------------

    response = http.get(`https://test-api.k6.io/my/crocodiles/`, authHeaders);

    result = check(response, {
        'GET /my/crocodiles/ is 200': (r) => r.status == 200,
        'retrieved crocodiles': (r) => r.json().length > 0
    });

    sleep(1);

    // -----------------------------------------

    response = http.get(`https://test-api.k6.io/my/crocodiles/a`, authHeaders);

    result = check(response, {
        'GET /my/crocodiles/{id} is 404': (r) => r.status == 404
    });

    sleep(1);

    // -----------------------------------------

    response = http.get(`https://test-api.k6.io/my/crocodiles/b`, authHeaders);

    result = check(response, {
        'GET /my/crocodiles/{id} is 404': (r) => r.status == 404
    });

    sleep(1);
};
