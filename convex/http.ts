import { httpRouter, RoutableMethod } from "convex/server";
import { httpAction } from "./_generated/server";
import { parse } from 'node-html-parser';

const http = httpRouter();

const proxyAction = httpAction(async (_ctx, request) => {
    // /proxy/:targetUrl - target url is a path param, parse from request.url
    const urlPrefixLength = "/proxy/".length;
    const targetUrl = new URL(request.url).pathname.slice(urlPrefixLength);

    console.log("targetUrl", targetUrl)
    if (!targetUrl) {
        return new Response("Missing target URL", { status: 400 });
    }

    const headers = new Headers();
    request.headers.forEach((value, key) => {
        if (key !== "host") {
            headers.set(key, value);
        }
    });



    const res = await fetch(targetUrl, {
        method: request.method,
        body: request.body,
        // headers: request.headers, // TODO: this doesn't work?
    });

    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", request.headers.get("Access-Control-Request-Headers") || "*");
    res.headers.set("Access-Control-Allow-Methods", request.method);

    return res
});

// TODO: add proxy for GET etc.
for (const method of ["GET", "POST", "PUT", "DELETE"]) {
    http.route({
        pathPrefix: "/proxy/",
        method: method as RoutableMethod,
        handler: proxyAction
    });
}

http.route({
    pathPrefix: "/proxy/",
    method: "OPTIONS",
    handler: httpAction(async (_ctx, request) => {
        const headers = request.headers;
        // if (
        //     headers.get("Origin") !== null &&
        //     headers.get("Access-Control-Request-Method") !== null &&
        //     headers.get("Access-Control-Request-Headers") !== null
        // ) {
        console.log("AAAA OPTIONS request", headers.get("Origin"));
        console.log("OPTIONS request", headers.get("Origin"));
        return new Response(null, {
            headers: new Headers({
                // e.g. https://mywebsite.com, configured on your Convex dashboard
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Max-Age": "86400",
            }),
        });
        // } else {
        //     return new Response();
        // }
    }),
});

// Convex expects the router to be the default export of `convex/http.js`.
export default http;
