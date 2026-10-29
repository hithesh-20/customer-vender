"""
VendorSaathi Python AI Microservice
Runs on FastAPI/Uvicorn when installed, with automatic built-in ThreadingHTTPServer
fallback so it boots anywhere with zero friction.
"""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from ml_engines import forecast_demand_ml, optimize_route_ml

PORT = int(os.environ.get("AI_API_PORT", "5000"))
HOST = os.environ.get("AI_API_HOST", "127.0.0.1")


def health_payload():
    return {
        "success": True,
        "service": "VendorSaathi Python AI/ML Microservice",
        "models": [
            "scikit-learn Ridge Harmonic Demand Forecaster",
            "NumPy Distance Matrix + 2-Opt TSP Mobility Engine",
        ],
        "status": "healthy",
    }


try:
    from fastapi import FastAPI, Request
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn

    fastapi_app = FastAPI(
        title="VendorSaathi AI/ML Service",
        version="1.0.0",
        description="Demand Forecasting & Intelligent Mobility Engine",
    )
    fastapi_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @fastapi_app.get("/api/health")
    async def get_health():
        return health_payload()

    @fastapi_app.post("/api/v1/forecast/demand")
    async def post_demand(request: Request):
        body = await request.json()
        return {"success": True, "data": forecast_demand_ml(body)}

    @fastapi_app.post("/api/v1/routes/optimize")
    async def post_route(request: Request):
        body = await request.json()
        return {"success": True, "data": optimize_route_ml(body)}

    HAS_FASTAPI = True
except ImportError:
    fastapi_app = None
    HAS_FASTAPI = False


class AIRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json(200, {"ok": True})

    def do_GET(self):
        if self.path.startswith("/api/health") or self.path == "/":
            self._send_json(200, health_payload())
        else:
            self._send_json(404, {"success": False, "error": "Not found"})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
            body = json.loads(raw)

            if self.path.startswith("/api/v1/forecast/demand"):
                data = forecast_demand_ml(body)
                self._send_json(200, {"success": True, "data": data})
            elif self.path.startswith("/api/v1/routes/optimize"):
                data = optimize_route_ml(body)
                self._send_json(200, {"success": True, "data": data})
            else:
                self._send_json(404, {"success": False, "error": f"Unknown endpoint {self.path}"})
        except Exception as exc:
            self._send_json(500, {"success": False, "error": str(exc)})

    def log_message(self, fmt, *args):
        return


if __name__ == "__main__":
    if HAS_FASTAPI:
        print(f"🚀 Starting VendorSaathi FastAPI AI Service on {HOST}:{PORT}")
        uvicorn.run(fastapi_app, host=HOST, port=PORT, log_level="info")
    else:
        server = ThreadingHTTPServer((HOST, PORT), AIRequestHandler)
        print(f"🚀 Starting VendorSaathi Python AI/ML Service (scikit-learn + NumPy) on http://{HOST}:{PORT}")
        server.serve_forever()
