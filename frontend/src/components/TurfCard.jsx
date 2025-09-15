import { Star } from "lucide-react";

const TurfCard = ({
  turf,
  selectedSport,
  nearestSwitch,
  onClick,
  sports,
}) => {
  const sport = sports.find((s) => s.id === selectedSport);

  return (
    <div
      onClick={onClick}
      className="bg-gray-900/60 border border-gray-700 rounded-2xl overflow-hidden cursor-pointer group hover:shadow-xl hover:border-lime-400 transition-all"
    >
      <div className="relative">
        <img
          src={turf.images[0]}
          alt={turf.name}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="font-semibold text-lg">{turf.name}</h3>
        </div>
        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full flex items-center">
          <Star size={14} className="text-yellow-400 fill-yellow-400 mr-1" />
          <span className="text-sm font-medium">{turf.rating || "New"}</span>
        </div>
        {nearestSwitch && (
          <div className="absolute top-2 right-2 bg-lime-500/10 text-lime-400 px-2 py-1 rounded-full text-xs font-bold">
            {turf.distance?.toFixed(1)} km
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {sport && (
              <div className={`${sport.color} p-1 rounded-md`}>
                <img
                  src={sport.icon}
                  alt={sport.name}
                  className="w-5 h-5 object-contain"
                />
              </div>
            )}
            <span className="text-xs font-bold text-gray-300">
              {selectedSport
                ? turf.sportsAvailable.find((s) => s === selectedSport)
                : turf.sportsAvailable.join(", ")}
            </span>
          </div>
          <span className="text-lime-400 font-bold">₹{turf.dayPrice}</span>
        </div>
        <p className="text-gray-400 text-sm">{turf.location?.city}</p>
      </div>
    </div>
  );
};

export default TurfCard;
