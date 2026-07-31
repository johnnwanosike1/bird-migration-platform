import { useRef, useState, useMemo, useEffect } from "react";
import Map, { NavigationControl, ScaleControl, GeolocateControl, FullscreenControl, Marker, Popup, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button, Group } from "@mantine/core";
import { useMapStateStore } from "../stores/mapstate";
import type { StopoverPoint, TrajectoryData } from "../types/Filter";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const BIRD_COLORS = [
    "#00e5ff", "#ff6b35", "#7fff00", "#ff00ff",
    "#ffea00", "#ff1744", "#00e676", "#651fff",
    "#ff9100", "#40c4ff"
];

export default function BirdMapContainer() {
    const mapRef = useRef<any>(null);
    const [viewState, setViewState] = useState({
        latitude: 37.77,
        longitude: -8.4,
        zoom: 7,
        bearing: 0,
        pitch: 0
    });
    const [activeLayer, setActiveLayer] = useState<"tracks" | "stopover" | null>(null);
    const [selected, setSelected] = useState<StopoverPoint | null>(null);
    const [selectedVisitCount, setSelectedVisitCount] = useState<number>(1);

    const stopovers: StopoverPoint[]     = useMapStateStore((state: any) => state.data)
    const trajectories: TrajectoryData[] = useMapStateStore((state: any) => state.trajectories)
    
    // Fly to bounding box when trajectories load
    useEffect(() => {
        if (!trajectories?.length || !mapRef.current) return;

        let minLng = Infinity, maxLng = -Infinity;
        let minLat = Infinity, maxLat = -Infinity;

        for (const t of trajectories) {
            for (const [lng, lat] of t.path) {
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
            }
        }

        if (minLng === Infinity) return;

        mapRef.current.flyTo({
            center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
            zoom: 7,
            duration: 1800,
            essential: true,
        });

        setActiveLayer("tracks");
    }, [trajectories]);

    // Jump to stopovers if no trajectories
    useEffect(() => {
        if (trajectories?.length || !stopovers?.length || !mapRef.current) return;

        let minLng = Infinity, maxLng = -Infinity;
        let minLat = Infinity, maxLat = -Infinity;

        for (const d of stopovers) {
            const [lng, lat] = d.coordinates;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        }

        mapRef.current.flyTo({
            center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
            zoom: 7,
            duration: 1800,
            essential: true,
        });

        setActiveLayer("stopover");
    }, [stopovers, trajectories]);

    // GeoJSON for trajectory lines
    const trajectoryGeoJSON = useMemo(() => {
        if (!trajectories?.length) return null;
        return {
            type: "FeatureCollection" as const,
            features: trajectories.map((t, i) => ({
                type: "Feature" as const,
                properties: {
                    color: BIRD_COLORS[i % BIRD_COLORS.length],
                    name: t.individual_local_identifier,
                    total_points: t.total_points,
                },
                geometry: {
                    type: "LineString" as const,
                    coordinates: t.path,
                }
            }))
        };
    }, [trajectories]);

    const stopoverGroups = useMemo(() => {
        if (!stopovers?.length) return [];

        const groups: Record<string, { lng: number; lat: number; items: StopoverPoint[] }> = {};
        for (const d of stopovers) {
            const lng = d?.coordinates?.[0] ?? 0;
            const lat = d?.coordinates?.[1] ?? 0;

            const key = `${lng.toFixed(1)},${lat.toFixed(1)}`;
            if (groups[key]) {
                groups[key].items.push(d);
            } else {
                groups[key] = { lng, lat, items: [d] };
            }
        }
        return Object.values(groups);
    }, [stopovers]);

    const totalVisits = stopovers?.length || 0;

    const totalFixes = useMemo(() => {
        if (!stopovers?.length) return 0;
        return stopovers.reduce((sum, d) => sum + (parseInt(d.entries) || 0), 0);
    }, [stopovers]);

    // Stopover markers
    const markers = useMemo(() => {
        if (activeLayer !== "stopover" || !stopoverGroups.length) return null;
        return stopoverGroups.map((group, i) => {
            const visitCount = group.items.length;
            const mostFixes = group.items.reduce((a, b) =>
                parseInt(a.entries) >= parseInt(b.entries) ? a : b
            );
            return (
                <Marker
                    key={`group-${i}-${group.lng}-${group.lat}`}
                    longitude={group.lng}
                    latitude={group.lat}
                    anchor="center"
                    onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        setSelected(mostFixes);
                        setSelectedVisitCount(visitCount);
                    }}
                >
                    <div style={{ position: "relative", cursor: "pointer" }}>
                    <div
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                background: `rgba(255, ${Math.round(200 * (1 - Math.min(parseInt(mostFixes.entries) / 20, 1)))}, 50, 0.9)`,
                                border: "2px solid rgba(255,255,255,0.8)",
                                boxShadow: "0 0 6px rgba(255,140,0,0.6)",
                                transition: "transform 0.15s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.6)")}
                            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                        />
                        {visitCount > 1 && (
                            <div style={{
                                position: "absolute",
                                top: -6,
                                right: -8,
                                minWidth: 16,
                                height: 16,
                                borderRadius: 8,
                                background: "#ffaa00",
                                border: "1px solid rgba(10,10,14,0.9)",
                                color: "#0a0a0e",
                                fontSize: 9,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 3px",
                                pointerEvents: "none",
                            }}>
                                {visitCount}
                            </div>
                        )}            
                    </div>
                </Marker>
            );
        });
    }, [stopoverGroups, activeLayer]);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", fontFamily: "'DM Mono', monospace" }}>
            <Map
                ref={mapRef}
                {...viewState}
                onMove={(e) => setViewState(e.viewState)}
                onClick={() => setSelected(null)}
                mapStyle={MAP_STYLE}
                style={{ height: "89dvh" }}
            >
                <NavigationControl position="top-right" />
                <FullscreenControl />
                <ScaleControl position="bottom-right" unit="metric" />
                <GeolocateControl position="top-right" />

                {/* Trajectory lines */}
                {activeLayer === "tracks" && trajectoryGeoJSON && (
                    <Source id="trajectories" type="geojson" data={trajectoryGeoJSON}>
                        <Layer
                            id="trajectory-glow"
                            type="line"
                            paint={{
                                "line-color": ["get", "color"],
                                "line-width": 8,
                                "line-opacity": 0.12,
                                "line-blur": 6,
                            }}
                            layout={{ "line-cap": "round", "line-join": "round" }}
                        />
                <Layer
                            id="trajectory-line"
                            type="line"
                            paint={{
                                "line-color": ["get", "color"],
                                "line-width": 1.5,
                                "line-opacity": 0.85,
                            }}
                            layout={{ "line-cap": "round", "line-join": "round" }}
                        />        
                    </Source>
                )}

                {/* Stopover markers */}
                {markers}

                {selected && (
                    <Popup
                        longitude={selected.coordinates[0]}
                        latitude={selected.coordinates[1]}
                        anchor="bottom"
                        offset={14}
                        closeButton={false}
                        onClose={() => setSelected(null)}
                    >
                  <div style={{
                            background: "rgba(10,10,14,0.95)",
                            border: "1px solid rgba(255,165,0,0.4)",
                            borderRadius: 6,
                            padding: "10px 14px",
                            color: "#e2e8f0",
                            fontSize: 11,
                            letterSpacing: "0.06em",
                            lineHeight: 1.9,
                            minWidth: 180,
                        }}>      
                            <div style={{ color: "#ffaa00", fontWeight: 700, marginBottom: 4 }}>
                                STOP-OVER{selectedVisitCount > 1 ? ` (${selectedVisitCount} VISITS)` : ""}
                            </div>
                            <div><span style={{ color: "#94a3b8" }}>BIRD </span>{selected.name}</div>
                            <div><span style={{ color: "#94a3b8" }}>TAG </span>{selected.code}</div>
                            <div><span style={{ color: "#94a3b8" }}>FIXES </span>{selected.entries}</div>
                            <div><span style={{ color: "#94a3b8" }}>LNG </span>{selected.coordinates[0].toFixed(5)}</div>
                            <div><span style={{ color: "#94a3b8" }}>LAT </span>{selected.coordinates[1].toFixed(5)}</div>
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Layer toggles */}
            <div className="map-filter absolute left-1/5 top-[20px]">
                <Group>
                    <Button
                        color={activeLayer === "tracks" ? "teal" : "rgba(10,10,14,0.70)"}
                        radius="xl"
                        onClick={() => setActiveLayer(v => v === "tracks" ? null : "tracks")}
                    >
                        Tracks
                        {trajectories?.length > 0 && (
                            <span style={{ marginLeft: 6, background: "rgba(0,229,255,0.2)", borderRadius: 10, padding: "0 6px", fontSize: 10 }}>
                                {trajectories.length}
                            </span>
                        )}
                    </Button>
                    <Button
                        color={activeLayer === "stopover" ? "orange" : "rgba(10,10,14,0.70)"}
                        radius="xl"
                        onClick={() => setActiveLayer(v => v === "stopover" ? null : "stopover")}
                    >
                        Stop Over
                        {stopoverGroups.length > 0 && (
                            <span style={{ marginLeft: 6, background: "rgba(255,165,0,0.3)", borderRadius: 10, padding: "0 6px", fontSize: 10 }}>
                                {stopoverGroups.length}
                            </span>
                        )}
                    </Button>
                 
                </Group>
            </div>

            {/* HUD */}
            <div style={{
                position: "absolute", top: 16, left: 16,
                background: "rgba(10,10,14,0.82)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
                padding: "10px 14px", color: "#e2e8f0", fontSize: 11,
                letterSpacing: "0.06em", lineHeight: 1.9, pointerEvents: "none", zIndex: 1,
            }}>
                <div style={{ color: "#64ffda", fontWeight: 700, marginBottom: 4 }}>MIGRATEVIS / MAP</div>
                <div><span style={{ color: "#94a3b8" }}>ZOOM </span>{viewState.zoom.toFixed(2)}</div>
                <div><span style={{ color: "#94a3b8" }}>PITCH </span>{viewState.pitch.toFixed(1)}°</div>
                <div><span style={{ color: "#94a3b8" }}>BEARING </span>{viewState.bearing.toFixed(1)}°</div>
                {trajectories?.length > 0 && (
                    <div style={{ marginTop: 4, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 4 }}>
                        <span style={{ color: "#94a3b8" }}>BIRDS </span>
                        <span style={{ color: "#00e5ff" }}>{trajectories.length}</span>
                    </div>
                )}
                {stopoverGroups.length > 0 && (
                <div style={{ marginTop: 4, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 4 }}>
                        <div>
                            <span style={{ color: "#94a3b8" }}>SITES </span>
                            <span style={{ color: "#ffaa00" }}>{stopoverGroups.length}</span>
                        </div>
                        <div>
                            <span style={{ color: "#94a3b8" }}>VISITS </span>
                            <span style={{ color: "#ffaa00" }}>{totalVisits}</span>
                        </div>
                        <div>
                            <span style={{ color: "#94a3b8" }}>FIXES </span>
                            <span style={{ color: "#ffaa00" }}>{totalFixes}</span>
                        </div>
                    </div>       
                )}
                {/* Bird colour legend */}
                {activeLayer === "tracks" && trajectories?.length > 0 && (
                    <div style={{ marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 6 }}>
                        {trajectories.map((t, i) => (
                            <div key={t.tag_local_identifier} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: BIRD_COLORS[i % BIRD_COLORS.length], flexShrink: 0 }} />
                                <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                                    {t.individual_local_identifier}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
