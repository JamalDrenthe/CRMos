#!/usr/bin/env python3
"""
Open-Source Geo Model Context Protocol (MCP) Server for CRMos
100% Keyless: PDOK Kadaster, Photon, Nominatim OSM, OSRM, and Overpass API.

Requires zero commercial API tokens.
Complies with OpenStreetMap usage policy with custom User-Agent and rate-limiting.
"""

import sys
import json
import time
import urllib.parse
import urllib.request
from typing import Dict, Any, Optional

USER_AGENT = "CustomMCPGeoAgent/1.0 (local-development)"

# Rate limit state (OSM policy allows max 1 req/sec)
_LAST_REQUEST_TIME = 0.0
_CACHE: Dict[str, Any] = {}

def _rate_limited_request(url: str, post_data: Optional[bytes] = None, timeout: int = 15) -> Dict[str, Any]:
    global _LAST_REQUEST_TIME
    
    # Check cache
    cache_key = f"{url}:{post_data.decode() if post_data else ''}"
    if cache_key in _CACHE:
        return _CACHE[cache_key]

    # Enforce minimum 1.0 second delay between public OSM calls
    now = time.time()
    elapsed = now - _LAST_REQUEST_TIME
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)

    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    }
    if post_data:
        headers["Content-Type"] = "application/x-www-form-urlencoded"

    req = urllib.request.Request(url, data=post_data, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        _LAST_REQUEST_TIME = time.time()
        raw = response.read().decode("utf-8")
        parsed = json.loads(raw)
        _CACHE[cache_key] = parsed
        return parsed

def handle_geocode(query: str, country: str = "nl", limit: int = 5) -> Dict[str, Any]:
    query = query.strip()
    if not query:
        return {"error": "Query cannot be empty"}

    results = []

    # 1. Specifiek voor Nederland: PDOK Locatieserver
    if country.lower() == "nl" or any(char.isdigit() for char in query):
        try:
            pdok_url = f"https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q={urllib.parse.quote(query)}&rows={limit}"
            pdok_data = _rate_limited_request(pdok_url)
            docs = pdok_data.get("response", {}).get("docs", [])
            for doc in docs:
                centroide = doc.get("centroide_ll", "")
                if centroide.startswith("POINT(") and centroide.endswith(")"):
                    parts = centroide[6:-1].split()
                    results.append({
                        "source": "PDOK Kadaster",
                        "display_name": doc.get("weergavenaam"),
                        "type": doc.get("type"),
                        "postal_code": doc.get("postcode"),
                        "city": doc.get("woonplaatsnaam"),
                        "street": doc.get("straatnaam"),
                        "house_number": doc.get("huisnummer"),
                        "longitude": float(parts[0]),
                        "latitude": float(parts[1]),
                    })
        except Exception as e:
            pass

    # 2. Wereldwijd: Photon API (Komoot / OSM)
    if not results:
        try:
            photon_url = f"https://photon.komoot.io/api/?q={urllib.parse.quote(query)}&limit={limit}"
            photon_data = _rate_limited_request(photon_url)
            for feat in photon_data.get("features", []):
                coords = feat.get("geometry", {}).get("coordinates", [0, 0])
                props = feat.get("properties", {})
                results.append({
                    "source": "Photon (OSM)",
                    "display_name": props.get("name") or props.get("street") or query,
                    "city": props.get("city"),
                    "postal_code": props.get("postcode"),
                    "country": props.get("country"),
                    "longitude": coords[0],
                    "latitude": coords[1],
                })
        except Exception:
            pass

    # 3. Fallback: Nominatim OpenStreetMap
    if not results:
        try:
            nom_url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=jsonv2&limit={limit}"
            nom_data = _rate_limited_request(nom_url)
            for item in nom_data:
                results.append({
                    "source": "Nominatim (OSM)",
                    "display_name": item.get("display_name"),
                    "type": item.get("type"),
                    "longitude": float(item.get("lon", 0)),
                    "latitude": float(item.get("lat", 0)),
                })
        except Exception as e:
            return {"error": f"Geocoding failed: {str(e)}"}

    return {"query": query, "total_found": len(results), "results": results}

def handle_reverse_geocode(latitude: float, longitude: float) -> Dict[str, Any]:
    # 1. Photon Reverse
    try:
        photon_url = f"https://photon.komoot.io/reverse?lon={longitude}&lat={latitude}"
        data = _rate_limited_request(photon_url)
        features = data.get("features", [])
        if features:
            props = features[0].get("properties", {})
            return {
                "source": "Photon (OSM)",
                "latitude": latitude,
                "longitude": longitude,
                "address": props.get("street") or props.get("name"),
                "house_number": props.get("housenumber"),
                "postal_code": props.get("postcode"),
                "city": props.get("city"),
                "country": props.get("country"),
            }
    except Exception:
        pass

    # 2. Nominatim Reverse
    try:
        nom_url = f"https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=jsonv2"
        data = _rate_limited_request(nom_url)
        addr = data.get("address", {})
        return {
            "source": "Nominatim (OSM)",
            "latitude": latitude,
            "longitude": longitude,
            "display_name": data.get("display_name"),
            "street": addr.get("road") or addr.get("pedestrian"),
            "house_number": addr.get("house_number"),
            "postal_code": addr.get("postcode"),
            "city": addr.get("city") or addr.get("town") or addr.get("village"),
            "country": addr.get("country"),
        }
    except Exception as e:
        return {"error": f"Reverse geocoding failed: {str(e)}"}

def handle_directions(start_lon: float, start_lat: float, end_lon: float, end_lat: float, profile: str = "foot") -> Dict[str, Any]:
    if profile not in ("driving", "cycling", "foot"):
        profile = "foot"

    url = f"https://router.project-osrm.org/route/v1/{profile}/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson"
    try:
        data = _rate_limited_request(url)
        if data.get("code") != "Ok" or not data.get("routes"):
            return {"error": "No route found between given coordinates"}

        route = data["routes"][0]
        return {
            "source": "OSRM (Open Source Routing Machine)",
            "profile": profile,
            "distance_meters": round(route.get("distance", 0), 1),
            "duration_seconds": round(route.get("duration", 0), 1),
            "duration_minutes": round(route.get("duration", 0) / 60, 1),
            "geometry": route.get("geometry"),
        }
    except Exception as e:
        return {"error": f"Routing failed: {str(e)}"}

def handle_poi_search(latitude: float, longitude: float, radius_meters: int = 500, tag_key: str = "amenity", tag_value: Optional[str] = None) -> Dict[str, Any]:
    if tag_value:
        ql_filter = f'["{tag_key}"="{tag_value}"]'
    else:
        ql_filter = f'["{tag_key}"]'

    query = f'[out:json][timeout:15];nwr(around:{radius_meters},{latitude},{longitude}){ql_filter};out center;'
    post_data = f"data={urllib.parse.quote(query)}".encode("utf-8")

    try:
        data = _rate_limited_request("https://overpass-api.de/api/interpreter", post_data=post_data, timeout=20)
        elements = data.get("elements", [])
        pois = []
        for el in elements:
            lat = el.get("lat") or el.get("center", {}).get("lat")
            lon = el.get("lon") or el.get("center", {}).get("lon")
            tags = el.get("tags", {})
            if lat and lon:
                pois.append({
                    "id": el.get("id"),
                    "name": tags.get("name") or tags.get("brand") or tags.get(tag_key),
                    "category": tags.get(tag_key),
                    "latitude": lat,
                    "longitude": lon,
                    "tags": tags,
                })
        return {
            "source": "Overpass API (OpenStreetMap)",
            "center": {"latitude": latitude, "longitude": longitude},
            "radius_meters": radius_meters,
            "total_found": len(pois),
            "pois": pois[:30],
        }
    except Exception as e:
        return {"error": f"Overpass query failed: {str(e)}"}

def main():
    """Standard JSON-RPC 2.0 MCP loop over stdio"""
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            req = json.loads(line)
            method = req.get("method")
            params = req.get("params", {})
            req_id = req.get("id")

            if method == "tools/list":
                tools = [
                    {
                        "name": "geo_geocode",
                        "description": "Convert address, postal code, or place name into geographic coordinates using PDOK Kadaster (NL) and Photon/Nominatim (Worldwide).",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "query": {"type": "string", "description": "Address or search query (e.g. 'Kalverstraat 1 Amsterdam' or '1012AB 1')"},
                                "country": {"type": "string", "description": "Two-letter country code ('nl' by default)"},
                                "limit": {"type": "integer", "description": "Maximum number of results (default 5)"}
                            },
                            "required": ["query"]
                        }
                    },
                    {
                        "name": "geo_reverse_geocode",
                        "description": "Convert latitude and longitude into street name, house number, postal code, and city.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "latitude": {"type": "number", "description": "Latitude coordinate"},
                                "longitude": {"type": "number", "description": "Longitude coordinate"}
                            },
                            "required": ["latitude", "longitude"]
                        }
                    },
                    {
                        "name": "geo_directions",
                        "description": "Calculate optimal routes, travel times, and turn-by-turn distances using OSRM (Open Source Routing Machine).",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "start_lon": {"type": "number", "description": "Starting longitude"},
                                "start_lat": {"type": "number", "description": "Starting latitude"},
                                "end_lon": {"type": "number", "description": "Destination longitude"},
                                "end_lat": {"type": "number", "description": "Destination latitude"},
                                "profile": {"type": "string", "enum": ["foot", "cycling", "driving"], "description": "Travel profile ('foot' for door-to-door reps)"}
                            },
                            "required": ["start_lon", "start_lat", "end_lon", "end_lat"]
                        }
                    },
                    {
                        "name": "geo_poi_search",
                        "description": "Query nearby points of interest (amenities, shops, schools, restaurants) within a meter radius using Overpass QL.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "latitude": {"type": "number", "description": "Center latitude"},
                                "longitude": {"type": "number", "description": "Center longitude"},
                                "radius_meters": {"type": "integer", "description": "Search radius in meters (default 500)"},
                                "tag_key": {"type": "string", "description": "OSM tag key (e.g. 'amenity', 'shop', 'tourism')"},
                                "tag_value": {"type": "string", "description": "Optional specific tag value (e.g. 'restaurant', 'supermarket')"}
                            },
                            "required": ["latitude", "longitude"]
                        }
                    }
                ]
                res = {"jsonrpc": "2.0", "id": req_id, "result": {"tools": tools}}
                sys.stdout.write(json.dumps(res) + "\n")
                sys.stdout.flush()

            elif method == "tools/call":
                tool_name = params.get("name")
                args = params.get("arguments", {})
                result = {}

                if tool_name == "geo_geocode":
                    result = handle_geocode(args.get("query", ""), args.get("country", "nl"), args.get("limit", 5))
                elif tool_name == "geo_reverse_geocode":
                    result = handle_reverse_geocode(float(args.get("latitude", 0)), float(args.get("longitude", 0)))
                elif tool_name == "geo_directions":
                    result = handle_directions(
                        float(args.get("start_lon", 0)),
                        float(args.get("start_lat", 0)),
                        float(args.get("end_lon", 0)),
                        float(args.get("end_lat", 0)),
                        args.get("profile", "foot")
                    )
                elif tool_name == "geo_poi_search":
                    result = handle_poi_search(
                        float(args.get("latitude", 0)),
                        float(args.get("longitude", 0)),
                        int(args.get("radius_meters", 500)),
                        args.get("tag_key", "amenity"),
                        args.get("tag_value")
                    )
                else:
                    result = {"error": f"Unknown tool: {tool_name}"}

                res = {"jsonrpc": "2.0", "id": req_id, "result": {"content": [{"type": "text", "text": json.dumps(result, indent=2)}]}}
                sys.stdout.write(json.dumps(res) + "\n")
                sys.stdout.flush()

            else:
                res = {"jsonrpc": "2.0", "id": req_id, "result": {}}
                sys.stdout.write(json.dumps(res) + "\n")
                sys.stdout.flush()

        except Exception as e:
            res = {"jsonrpc": "2.0", "id": req.get("id"), "error": {"code": -32603, "message": str(e)}}
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
