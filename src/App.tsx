import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Map as MapIcon, 
  Search, 
  User, 
  LogOut, 
  Plus, 
  Navigation, 
  Utensils, 
  Hotel, 
  Star,
  ChevronRight,
  Clock,
  Sparkles,
  LayoutDashboard,
  Settings,
  Bell,
  MapPin
} from 'lucide-react';
import InteractiveMap from './components/Map';
import { cn } from './lib/utils';
import { Toaster, toast } from 'react-hot-toast';
import { format } from 'date-fns';

// --- Types ---
interface User {
  id: number;
  email: string;
  name: string;
}

interface EventMarker {
  id: string;
  position: google.maps.LatLngLiteral;
  title: string;
  category: string;
  address: string;
  image?: string;
  rating?: number;
  priceLevel?: number;
}

// --- Mock Data ---
const MOCK_EVENTS: EventMarker[] = [
  { 
    id: '1', 
    position: { lat: 40.7128, lng: -74.0060 }, 
    title: 'Central Park Music Festival', 
    category: 'Music', 
    address: 'Central Park, NY',
    image: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=800&q=80',
    rating: 4.8
  },
  { 
    id: '2', 
    position: { lat: 40.7580, lng: -73.9855 }, 
    title: 'Times Square Tech Expo', 
    category: 'Tech', 
    address: 'Times Square, NY',
    image: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=800&q=80',
    rating: 4.5
  },
  { 
    id: '3', 
    position: { lat: 40.7484, lng: -73.9857 }, 
    title: 'Empire State Art Gallery', 
    category: 'Cultural', 
    address: 'Empire State Building, NY',
    image: 'https://images.unsplash.com/photo-1518998053502-5190a3915a25?w=800&q=80',
    rating: 4.9
  },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'dashboard' | 'planner'>('landing');
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Check auth status
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setUser(data.user));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setView('landing');
    toast.success('Logged out successfully');
  };

  const filteredEvents = MOCK_EVENTS.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || event.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="glass p-8 rounded-2xl max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Configuration Required</h2>
          <p className="text-slate-400 mb-6">Please add your Google Maps API Key to the environment variables to start the app.</p>
          <div className="bg-slate-900 p-4 rounded-lg text-left font-mono text-sm text-accent-purple">
            VITE_GOOGLE_MAPS_API_KEY="YOUR_KEY"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Toaster position="top-right" />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
            <MapIcon className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight">SmartEvent</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <NavLink active={view === 'landing'} onClick={() => setView('landing')}>Home</NavLink>
          <NavLink active={view === 'dashboard'} onClick={() => setView('dashboard')}>Dashboard</NavLink>
          <NavLink active={view === 'planner'} onClick={() => setView('planner')}>Planner</NavLink>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full border-white/10">
                <div className="w-6 h-6 rounded-full bg-accent-purple flex items-center justify-center text-xs font-bold">
                  {user.name[0]}
                </div>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
              className="px-6 py-2 gradient-bg rounded-full text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {view === 'landing' && (
          <div className="flex-1 flex flex-col md:flex-row p-6 gap-6">
            {/* Left Sidebar: Discovery */}
            <div className="w-full md:w-96 flex flex-col gap-6">
              <div className="glass p-6 rounded-3xl space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl font-display font-bold leading-tight">
                    Discover <span className="gradient-text">Amazing</span> Events
                  </h1>
                  <p className="text-slate-400 text-sm">Find the best experiences around you and plan your perfect trip.</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search events, places..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 ring-accent-purple/50 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {['All', 'Music', 'Tech', 'Sports', 'Cultural'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                        activeCategory === cat ? "gradient-bg text-white" : "glass hover:bg-white/20"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
                {filteredEvents.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    isSelected={selectedEvent?.id === event.id}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            </div>

            {/* Main Content: Map */}
            <div className="flex-1 relative min-h-[400px]">
              <InteractiveMap 
                apiKey={GOOGLE_MAPS_API_KEY} 
                events={filteredEvents}
                onSelectEvent={(event) => setSelectedEvent(event)}
              />
              
              {/* Event Detail Overlay */}
              <AnimatePresence>
                {selectedEvent && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-6 left-6 right-6 md:left-auto md:w-96 glass-dark p-6 rounded-3xl z-10"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent-purple mb-1 block">
                          {selectedEvent.category}
                        </span>
                        <h3 className="text-xl font-display font-bold">{selectedEvent.title}</h3>
                      </div>
                      <button onClick={() => setSelectedEvent(null)} className="p-1 hover:bg-white/10 rounded-full">
                        <Plus className="w-5 h-5 rotate-45 text-slate-400" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <MapPin className="w-4 h-4 text-accent-purple" />
                        <span>{selectedEvent.address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Clock className="w-4 h-4 text-accent-purple" />
                        <span>Starts at 7:00 PM</span>
                      </div>
                      
                      <div className="pt-4 border-t border-white/5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Nearby Recommendations</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <RecommendationItem icon={<Hotel className="w-4 h-4" />} label="Hotels" />
                          <RecommendationItem icon={<Utensils className="w-4 h-4" />} label="Dining" />
                          <RecommendationItem icon={<Sparkles className="w-4 h-4" />} label="Sights" />
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          if (!user) {
                            setAuthMode('login');
                            setIsAuthModalOpen(true);
                          } else {
                            toast.success('Added to your itinerary!');
                          }
                        }}
                        className="w-full py-3 gradient-bg rounded-2xl font-bold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add to Trip
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-display font-bold">Welcome back, <span className="gradient-text">{user?.name || 'Explorer'}</span></h2>
                <p className="text-slate-400">You have 3 upcoming trips planned.</p>
              </div>
              <button className="px-6 py-3 glass rounded-2xl font-bold flex items-center gap-2 hover:bg-white/20 transition-all">
                <Plus className="w-5 h-5" />
                New Trip
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Trips" value="12" icon={<Navigation className="text-blue-400" />} />
              <StatCard title="Events Attended" value="28" icon={<Calendar className="text-purple-400" />} />
              <StatCard title="Places Saved" value="142" icon={<Star className="text-pink-400" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass p-8 rounded-3xl space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent-purple" />
                  Upcoming Trips
                </h3>
                <div className="space-y-4">
                  <TripItem title="Summer in New York" date="July 12 - July 18" status="Confirmed" />
                  <TripItem title="Tech Weekend SF" date="August 05 - August 07" status="Planning" />
                  <TripItem title="Tokyo Adventure" date="October 20 - October 30" status="Draft" />
                </div>
              </div>

              <div className="glass p-8 rounded-3xl space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-pink" />
                  AI Suggestions
                </h3>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 italic text-slate-300">
                  "Based on your interest in Tech and Music, we recommend checking out the 'Brooklyn Beats & Bytes' festival next month. It's only 2 miles from your saved hotel!"
                </div>
                <button className="w-full py-3 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/5 transition-all">
                  Generate Personalized Advice
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'planner' && (
          <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
             <div className="glass p-8 rounded-3xl space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-display font-bold">Itinerary Planner</h2>
                    <p className="text-slate-400">Summer in New York • July 12, 2026</p>
                  </div>
                  <button className="px-6 py-2 gradient-bg rounded-xl text-sm font-bold shadow-lg">
                    Sync to Google Calendar
                  </button>
                </div>

                <div className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                  <TimelineItem 
                    time="09:00 AM" 
                    title="Hotel Check-in" 
                    location="The Standard, High Line" 
                    type="hotel"
                  />
                  <TimelineItem 
                    time="12:30 PM" 
                    title="Lunch at Chelsea Market" 
                    location="75 9th Ave, New York" 
                    type="dining"
                  />
                  <TimelineItem 
                    time="03:00 PM" 
                    title="Empire State Art Gallery" 
                    location="Empire State Building" 
                    type="event"
                    active
                  />
                  <TimelineItem 
                    time="07:00 PM" 
                    title="Dinner with View" 
                    location="Summit One Vanderbilt" 
                    type="dining"
                  />
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative glass-dark w-full max-w-md p-8 rounded-3xl border border-white/10"
            >
              <h2 className="text-3xl font-display font-bold mb-2">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-400 text-sm mb-8">
                {authMode === 'login' ? 'Sign in to access your saved trips.' : 'Join us to start planning your next adventure.'}
              </p>

              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                
                const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
                fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                }).then(async res => {
                  if (res.ok) {
                    const result = await res.json();
                    setUser(result.user);
                    setIsAuthModalOpen(false);
                    toast.success(authMode === 'login' ? 'Welcome back!' : 'Account created!');
                  } else {
                    toast.error('Authentication failed');
                  }
                });
              }}>
                {authMode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
                    <input name="name" type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 ring-accent-purple/50" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
                  <input name="email" type="email" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 ring-accent-purple/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                  <input name="password" type="password" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 ring-accent-purple/50" />
                </div>

                <button type="submit" className="w-full py-4 gradient-bg rounded-2xl font-bold shadow-lg mt-4 hover:opacity-90 transition-opacity">
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-slate-400">
                  {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-accent-purple font-bold hover:underline"
                >
                  {authMode === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavLink({ children, active, onClick }: { children: React.ReactNode, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-sm font-medium transition-colors hover:text-white",
        active ? "text-white" : "text-slate-400"
      )}
    >
      {children}
      {active && <motion.div layoutId="nav-underline" className="h-0.5 gradient-bg mt-1" />}
    </button>
  );
}

interface EventCardProps {
  key?: string;
  event: EventMarker;
  isSelected: boolean;
  onClick: () => void;
}

function EventCard({ event, isSelected, onClick }: EventCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        "glass p-4 rounded-2xl cursor-pointer transition-all border-2",
        isSelected ? "border-accent-purple bg-white/15" : "border-transparent hover:bg-white/10"
      )}
    >
      <div className="flex gap-4">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-20 h-20 rounded-xl object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-purple">
              {event.category}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-yellow-500">
              <Star className="w-3 h-3 fill-current" />
              {event.rating}
            </div>
          </div>
          <h4 className="font-bold text-sm truncate mt-1">{event.title}</h4>
          <p className="text-xs text-slate-400 truncate mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {event.address}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function RecommendationItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex flex-col items-center gap-2 p-3 glass rounded-2xl hover:bg-white/20 transition-all group">
      <div className="text-slate-400 group-hover:text-accent-purple transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-500">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="glass p-6 rounded-3xl flex items-center gap-6">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-display font-bold">{value}</p>
      </div>
    </div>
  );
}

function TripItem({ title, date, status }: { title: string, date: string, status: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
          <MapIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="font-bold text-sm">{title}</h4>
          <p className="text-xs text-slate-400">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
          status === 'Confirmed' ? "bg-emerald-500/20 text-emerald-400" : 
          status === 'Planning' ? "bg-blue-500/20 text-blue-400" : "bg-slate-500/20 text-slate-400"
        )}>
          {status}
        </span>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
      </div>
    </div>
  );
}

function TimelineItem({ time, title, location, type, active }: { time: string, title: string, location: string, type: string, active?: boolean }) {
  const icons: Record<string, React.ReactNode> = {
    hotel: <Hotel className="w-4 h-4" />,
    dining: <Utensils className="w-4 h-4" />,
    event: <Calendar className="w-4 h-4" />,
  };

  return (
    <div className="relative pl-12">
      <div className={cn(
        "absolute left-0 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-slate-950",
        active ? "gradient-bg text-white neon-glow" : "glass text-slate-400"
      )}>
        {icons[type]}
      </div>
      <div className={cn(
        "p-5 rounded-2xl border transition-all",
        active ? "bg-white/15 border-accent-purple shadow-lg" : "bg-white/5 border-white/5 hover:bg-white/10"
      )}>
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold">{title}</h4>
          <span className="text-xs font-mono text-accent-purple font-bold">{time}</span>
        </div>
        <p className="text-sm text-slate-400 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {location}
        </p>
      </div>
    </div>
  );
}
