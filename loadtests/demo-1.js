// Demonstrate how to use send http requests.

// k6 run demo-1.js --out influxdb=http://localhost:8086/k6;
// k6 run demo-1.js --out influxdb=http://localhost:8086/k6 -u 10 -d 30s;
// k6 run demo-1.js --out influxdb=http://localhost:8086/k6 -u 5 -i 10;
import http from 'k6/http';
import { sleep } from 'k6';

const USERNAME = 'TestUser';
const PASSWORD = 'SuperCroc2020AAA';

export default () => {
    let loginRes = http.post(`https://test-api.k6.io/auth/token/login/`, {
        username: USERNAME,
        password: PASSWORD,
    });

    let authHeaders = {
        headers: {Authorization: `Bearer ${loginRes.json('access')}`},
    };

    sleep(1);

    // -----------------------------------------

    http.get(`https://test-api.k6.io/my/crocodiles/`, authHeaders);
    sleep(1);

    // -----------------------------------------

    http.get(`https://test-api.k6.io/my/crocodiles/a`, authHeaders);
    sleep(1);

    // -----------------------------------------

    http.get(`https://test-api.k6.io/my/crocodiles/b`, authHeaders);
    sleep(1);
};
