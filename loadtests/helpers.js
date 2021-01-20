//  https://k6.io/docs/using-k6/modules#local-filesystem-modules

/*
Return a query params to be appended to the end of a URL

* @param {object} data     A list of parameters
*/
export function buildQuery(data) {
    const result = [];

    Object.keys(data)
     .forEach((key) => {
        const encode = encodeURIComponent;
        result.push(encode(key) + "=" + encode(data[key]));
    });

    return result.join("&");
 }

/*
Return a unique number identifier for each iterations, across virtual users.

* @param {number} startValue            The starting value of unique identifier.
* @param {number} maxIterationValue     The maximum value of iteration.Once exeeded, repeat from iteration starting value.
*/
export function generateIdentifier(startValue, maxIterationValue = 9999) {
    // NOT easily possible to generate global sequential number because
    // each VU runs in a separate JavaScript VM and memory is not shared between them.
    // let maxIterationValue = 999; // Per Iteration
    // let startValue = 100; // Allow user to specify a starting value
    let numFormat = "00000"

    startValue = (parseInt(`${__VU}${numFormat.substring(1)}`) + startValue);
    let iterationValue = ((__ITER)%maxIterationValue);
    let numberIdentifier = ((startValue) + iterationValue);

    return numberIdentifier;

}


/*
To print http response information.
* @param {object} data     The response data from HTTP request
*/
export function debugLogging(data) {
    //  To print out some information for troubleshooting purpose.
    console.log("response.request.method:"+data.request.method);
    console.log("response.request.url:"+data.request.url);
    console.log("response.body:"+data.body);
    console.log("response.error_code:"+data.error_code);
}

 /*
Return a random integer between the specified values, inclusive.
~ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random

* @param {number} min   The return value is no lower than min.
* @param {number} max   The return value is less or equal to max.

*/
export function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}
