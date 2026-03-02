import { useState, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Clock, Info, Car } from 'lucide-react';
import { cn } from '../lib/utils';

interface EventMarker {
  id: string;
  position: google.maps.LatLngLiteral;
  title: string;
  category: string;
  address: string;
}

export default function InteractiveMap({ 
  apiKey, 
  events, 
  onSelectEvent 
}: { 
  apiKey: string; 
  events: EventMarker[];
  onSelectEvent: (event: EventMarker) => void;
}) {
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => console.error("Geolocation failed")
      );
    }
  }, []);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden glass border-white/10 relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={userLocation || { lat: 40.7128, lng: -74.0060 }}
          defaultZoom={13}
          mapId="DEMO_MAP_ID"
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          className="w-full h-full"
        >
          {userLocation && (
            <AdvancedMarker position={userLocation}>
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
            </AdvancedMarker>
          )}

          {events.map((event) => (
            <AdvancedMarker
              key={event.id}
              position={event.position}
              onClick={() => {
                setSelectedEvent(event);
                onSelectEvent(event);
              }}
            >
              <div className="group cursor-pointer">
                <div className="bg-accent-purple p-2 rounded-full shadow-lg transform transition-transform group-hover:scale-110">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {selectedEvent && (
            <InfoWindow
              position={selectedEvent.position}
              onCloseClick={() => setSelectedEvent(null)}
            >
              <div className="p-2 min-w-[200px] text-slate-900">
                <h3 className="font-bold text-lg">{selectedEvent.title}</h3>
                <p className="text-sm text-slate-600 mb-2">{selectedEvent.category}</p>
                <p className="text-xs text-slate-500">{selectedEvent.address}</p>
                <button 
                  onClick={() => onSelectEvent(selectedEvent)}
                  className="mt-3 w-full py-2 bg-accent-purple text-white rounded-lg text-sm font-medium hover:bg-accent-purple/90 transition-colors"
                >
                  View Details
                </button>
              </div>
            </InfoWindow>
          )}
          
          <DirectionsRenderer userLocation={userLocation} destination={selectedEvent?.position} />
          <TrafficLayer enabled={showTraffic} />
        </Map>
      </APIProvider>
      
      {/* Map Overlay Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button 
          onClick={() => setShowTraffic(!showTraffic)}
          className={cn(
            "p-3 glass rounded-full transition-all duration-300",
            showTraffic ? "bg-accent-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]" : "hover:bg-white/20 text-slate-400"
          )}
          title="Toggle Traffic"
        >
          <Car className="w-5 h-5" />
        </button>
        <button className="p-3 glass rounded-full hover:bg-white/20 transition-colors text-slate-400">
          <Navigation className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function TrafficLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const [trafficLayer, setTrafficLayer] = useState<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    const layer = new google.maps.TrafficLayer();
    setTrafficLayer(layer);
    return () => {
      layer.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (!trafficLayer) return;
    trafficLayer.setMap(enabled ? map : null);
  }, [trafficLayer, enabled, map]);

  return null;
}

function DirectionsRenderer({ userLocation, destination }: { userLocation: google.maps.LatLngLiteral | null, destination?: google.maps.LatLngLiteral }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !userLocation || !destination) {
      if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
      return;
    }

    directionsService.route(
      {
        origin: userLocation,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
        }
      }
    );
  }, [directionsService, directionsRenderer, userLocation, destination]);

  return null;
}
