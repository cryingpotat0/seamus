import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { parse } from 'node-html-parser';

const http = httpRouter();

http.route({
    path: "/get-jupyter-html-content",
    method: "POST",
    handler: httpAction(async (_ctx, request) => {
        const { cellId, url } = await request.json();

        const htmlContentResponse = await fetch(url);
        const htmlContent = parse(await htmlContentResponse.text());

        if (cellId?.length) {
            const cells = htmlContent.querySelectorAll('[id^="cell-id="]');
            const parent = cells[0].parentNode;
            const cellIdAsArr = (Array.isArray(cellId) ? cellId : [cellId]).map((id) => `cell-id=${id}`);
            for (const cell of cells) {
                // If the cell id exists in cellIdAsArr, do not remove it
                if (!cellIdAsArr.includes(cell.id)) {
                    parent.removeChild(cell);
                }
            }
        }

        return new Response(JSON.stringify({
            html: htmlContent.toString(),
        }), {
            status: 200,
            headers: new Headers({
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // TODO: tighten origins
                "Vary": "origin",
            }),
        });
    }),
});

http.route({
    path: "/get-jupyter-html-content",
    method: "OPTIONS",
    handler: httpAction(async (_ctx, request) => {
        const headers = request.headers;
        if (
            headers.get("Origin") !== null &&
            headers.get("Access-Control-Request-Method") !== null &&
            headers.get("Access-Control-Request-Headers") !== null
        ) {
            return new Response(null, {
                headers: new Headers({
                    // e.g. https://mywebsite.com, configured on your Convex dashboard
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type, Digest",
                    "Access-Control-Max-Age": "86400",
                }),
            });
        } else {
            return new Response();
        }
    }),
});

// Convex expects the router to be the default export of `convex/http.js`.
export default http;
